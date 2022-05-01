app.controller('LoginController', ['$scope','$rootScope','$http','$state','toaster','ipCookie','$window',function($scope,$rootScope,$http,$state,toaster,ipCookie,$window){
    $scope.authError = null;
    $scope.login = function () {
        var param = {
            email: $scope.email.trim(),
            password: $scope.password
        };
        $http.post(webservice_path + 'login', param).success(function (res) {


            if (res.Status == "True"){

                ipCookie('isla', 'true', {expires: 3, expirationUnit: 'hours'});
                ipCookie("tok", res.Response.vToken, {path: '/'});

                localStorage.setItem('token', res.Response.vToken);
                localStorage.setItem('aid', res.Response.iPkAdminId);
                localStorage.setItem('lld', res.Response.dtAdminLastLogin);
                localStorage.setItem('rol', res.Response.vRoleName);
                localStorage.setItem('rid', res.Response.iFkRoleId);
                if (res.Response.vRoleName == 'superadmin') {
                    localStorage.setItem('is_main_user', 1);
                } else {
                    localStorage.setItem('is_main_user', 0);
                }

                if(localStorage.getItem('is_main_user')!=1){
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                }
                $rootScope.lastlogin = localStorage.getItem('lld');
                $rootScope.aid = localStorage.getItem('aid');
                $rootScope.eRoleName = localStorage.getItem('rol');
                $rootScope.iRoleId = localStorage.getItem('rid');
                $window.location.href = base_url + 'dashboard';
                toaster.pop('success', localStorage.getItem('username'),res.Message);
            }else{
                $scope.authError = res.Message;
            }
        }, function (x) {
            $scope.authError = 'Server Error';
        });
    };
  }]);