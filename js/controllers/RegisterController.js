angular.module('VeazyApp').controller('RegisterController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {

    /** question code start */

    const items = document.querySelectorAll(".accordion a");

    function toggleAccordion(){
      this.classList.toggle('active');
      this.nextElementSibling.classList.toggle('active');
    }

    items.forEach(item => item.addEventListener('click', toggleAccordion));

    /** question code end */

    $scope.submit = function (isValid) {
        if($scope.switch == true){
            $scope.submitted = true;
            if (isValid) {
                $scope.disabled = true;
                $scope.firstname = $scope.firstname.trim();
                $scope.lastname = $scope.lastname.trim();
                $scope.email = $scope.email.trim();
                $scope.password = $scope.password.trim();
                $scope.mobile = $scope.mobile;
                var param = {
                    'firstname': $scope.firstname,
                    'lastname': $scope.lastname,
                    'email': $scope.email,
                    'gender': $scope.gender,
                    'password': $scope.password,
                    'mobile': $scope.mobile
                };
                $http.post(webservice_path + 'signup', param).success(function (res) {
                    if(res.status == true){
                        toastr.success(res.result.message);
                        window.location.href = "http://app.veazy.com.au/thankyou.html";
                        return true;
                        //$state.go('login'); return true;
                        ipCookie('uid', res.result.user_id, {expires: 12, expirationUnit: 'hours'});
                        ipCookie('token', res.result.api_token, {expires: 12, expirationUnit: 'hours'});
                        $scope.checkdefaultplan();
                    }else{
                        toastr.error(res.result.message);
                    }
                }).error(function (res) {
                    if(res.status == false){
                        $scope.submitted = false;
                        $scope.disabled = false;
                        toastr.error(res.result.message);
                    }
                });
            }
        }else{
            toastr.error("Please turn on Terms and conditions");
        }
        
    };

    $scope.openVideo = function(){

        $scope.selected_video = 'http://app.veazy.com.au/api/webroot/videos/movie.mp4?wmode=transparent&amp;rel=0&autoplay=1';
        //$scope.selected_video = 'https://vimeo.com/380393043';
        //$scope.selected_video1 = 'http://app.veazy.com.au/Sample1280.ogv?wmode=transparent&amp;rel=0&autoplay=1';

        $scope.videoModal = $uibModal.open({
            animation: true,
            windowClass: 'fade video_modal',
            templateUrl: "videoModal.html",
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            size: 'lg'
        });
    }

    $scope.closeVideo = function () {
        /**var vid = document.getElementById("modal-video");
        vid.pause();**/
        $scope.videoModal.dismiss();
    };

    /** check default plan */
    $scope.checkdefaultplan = function () {
        $http.get(webservice_path + 'checkdefaultplan').success(function (res) {
            if(res.status == true){
                if(res.result.plan == 'free'){
                    //$state.go('app.dashboard');
                    $state.go('login');
                    return true;
                }
                if(res.result.plan == 'paid'){
                    $state.go('login');
                    return true;
                    //$state.go('defaultplan');
                }
            }
        });
    };

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