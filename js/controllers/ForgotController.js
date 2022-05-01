angular.module('VeazyApp').controller('ForgotController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie) {

    $scope.submit = function (isValid) {
        $scope.submitted = true;
        if (isValid) {
            $scope.disabled = true;
            $scope.email = $scope.email.trim();
            var param = {'email': $scope.email,'link': base_url};
            $http.post(webservice_path + 'forgotpassword', param).success(function (res) {
                if(res.status == true){
                    toastr.success(res.result.message);
                    window.localStorage.setItem('user_otp_email', res.result.email);                    
                    $state.go('otp');
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