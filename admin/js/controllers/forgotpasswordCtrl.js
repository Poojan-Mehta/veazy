'use strict';

app.controller('forgotpasswordCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt) {

        $scope.tmp_path = theme_path.replace("admin/", "");

        /** FORGOTPASSWORD FORM*/
        $scope.forgopass_form = function (isValid) {
            $scope.submitted = true;
            var param = {
                vEmail: $scope.email,
                path: $scope.tmp_path
            };

            if ($scope.email) {
                $http.post(webservice_path + 'forgot/forgotpassword', param).success(function (res) {
                    if (res.Status == "True") {
                        $state.go("login");
                        toaster.pop('success','','A reset link sent to your email address, please check it in 7 days.');
                    } else {
                        toaster.pop('error',"", 'Oops..!Given email address is not registered with us');
                    }
                });
            } else {
                toaster.pop('error', "Server Error", '');
            }
        }
    }]);