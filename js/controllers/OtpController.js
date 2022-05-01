angular.module('VeazyApp').controller('OtpController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie) {

    $scope.email = window.localStorage.getItem('user_otp_email');
    $scope.submit = function (isValid) {
        $scope.submitted = true;
        if (isValid) {
            $scope.disabled = true;
            
            var param = {'email': $scope.email, 'otp': $scope.otp};
            $http.post(webservice_path + 'checkotp', param).success(function (res) {
                if(res.status == true){
                    window.localStorage.setItem('otp',res.result.otp);
                    toastr.success(res.result.message);
                    $state.go("resetpassword");
                }
            }).error(function (res) {
                $scope.submitted = false;
                $scope.disabled = false;
                if(res.status == false){
                    toastr.error(res.result.message);
                }
            });
        }
    }

});