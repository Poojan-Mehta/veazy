angular.module('VeazyApp').controller('ResetPasswordController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie) {


    if($stateParams.key){
        $scope.otp = $stateParams.key;
        $scope.isKey = true;
        $scope.btnTxt = 'Create Password';
        $scope.headerTxt = 'Password Creation';
    }else{
        $scope.otp = window.localStorage.getItem('otp');
        $scope.isKey = false;
        $scope.btnTxt = 'Reset Password';
        $scope.headerTxt = 'Reset Password';
    }
    
    $scope.submit = function (isValid) {
        $scope.submitted = true;
        
        if($scope.password == $scope.rpassword){

            if (isValid && ($scope.password == $scope.rpassword)) {
                $scope.disabled = true;
                $scope.password = $scope.password.trim();
                //var param = {'key': $scope.key, 'password': $scope.password};
                var param = {'otp': $scope.otp,'password': $scope.password,'is_key':$scope.isKey };
                $http.post(webservice_path + 'resetpassword', param).success(function (res) {
                    if(res.status == true){
                        toastr.success(res.result.message);
                        localStorage.clear();
                        $state.go("login");
                    }
                }).error(function (res) {
                    $scope.submitted = false;
                    $scope.disabled = false;
                    if(res.status == false){
                        toastr.error(res.result.message);
                    }
                });
            }
        }else{
            toastr.error("password do not match");
        }
    }
}).directive('passwordStrength', [
    function () {
        return {
            require: 'ngModel',
            restrict: 'E',
            scope: {
                password: '=ngModel'
            },

            link: function (scope, elem, attrs, ctrl) {
                scope.$watch('password', function (newVal) {

                    scope.strength = isSatisfied(newVal && newVal.length >= 6) +
                        isSatisfied(newVal && /(?=.*\W)/.test(newVal)) +
                        isSatisfied(newVal && /\d/.test(newVal));

                    function isSatisfied(criteria) {
                        return criteria ? 1 : 0;
                    }
                }, true);
            },
            template: '<div class="progress" style="height:5px;">' +
            '<div class="progress-bar progress-bar-danger" style="width: {{strength >= 1 ? 33.33 : 0}}%"></div>' +
            '<div class="progress-bar progress-bar-warning" style="width: {{strength >= 2 ? 33.33 : 0}}%"></div>' +
            '<div class="progress-bar progress-bar-success" style="width: {{strength >= 3 ? 33.33 : 0}}%"></div>' +
            '</div>'
        }
    }
]).directive('patternValidator', [
    function () {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, elem, attrs, ctrl) {

                ctrl.$parsers.unshift(function (viewValue) {

                    var patt = new RegExp(attrs.patternValidator);

                    var isValid = patt.test(viewValue);

                    ctrl.$setValidity('passwordPattern', isValid);
                    
                    return viewValue;
                });
            }
        };
    }
]).directive('validPasswordC', function () {

    return {
        require: 'ngModel',
        scope: {
            reference: '=validPasswordC'
        },
        link: function (scope, elm, attrs, ctrl) {  
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var noMatch = viewValue != scope.reference;
                ctrl.$setValidity('noMatch', !noMatch);
                return (noMatch) ? noMatch : !noMatch;
            });

            scope.$watch("reference", function (value) {
                ctrl.$setValidity('noMatch', value === ctrl.$viewValue);
            });
        }
    }
});