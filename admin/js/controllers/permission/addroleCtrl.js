'use strict';
/* Controllers */
app.controller('addroleCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename = $scope.role.addrole;
        $scope.id = $stateParams.roleid;
        $scope.userId = localStorage.getItem('aid');

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.rolelist");
        }

        /** VIEW PERMISSION DATA BY ID*/
        if ($stateParams.roleid) {
            $scope.pagename = $scope.role.editrole;
            $http.get(webservice_path +'permission/view/' + $scope.id).success(function(res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True') {
                    $scope.vRolName = res.Response.vRoleName;
                    $scope.iRoleId = res.Response.iPkRoleId;
                } else if (res.StatusCode == '0') {
                    $state.go("app.rolelist");
                    toaster.pop('error','',res.Message);
                } else{
                    toaster.pop('error','',res.Message);
                }
            });
        }

        /** ADD & EDIT PERMISSION*/
        $scope.add_role_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    vRolName: $scope.vRolName,
                    roleId: $stateParams.roleid
                };

                if ($stateParams.roleid) {
                    $http.post( webservice_path +'permission/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.rolelist");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'permission/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.rolelist");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
