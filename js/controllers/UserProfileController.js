angular.module('VeazyApp').controller('UserProfileController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie)
{
    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');
    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $rootScope.maindashboard = 'true';
    $scope.maindashboard = 'true';
    
    if($scope.token != undefined){
        $http.get(webservice_path + "getProfile?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
            .success(function (res) {
                if(res.status == true){
                    $scope.firstname = res.result.data.vFirstName;
                    $scope.lastname = res.result.data.vLastName;
                    $scope.gender = res.result.data.eGender;
                    $scope.email = res.result.data.vEmail;
                    $('.nav-tabs').tabdrop({align: 'left'});
                }
            })
            .error(function (res) {
                if(res.status == false){
                    toastr.error(res.result.message);
                }
            });
    }

    $scope.submitprofile = function (isValid) {
        $scope.submittedprofile = true;
        if (isValid) {
            $scope.disabledprofile = true;
            $scope.firstname = $scope.firstname.trim();
            $scope.lastname = $scope.lastname.trim();
            $scope.email = $scope.email.trim();
            var param = {
                'firstname': $scope.firstname,
                'lastname': $scope.lastname,
                'email': $scope.email,
                'gender': $scope.gender,
                'uid': $scope.uid,
                'token': $scope.token,
                'type': app_type
            };
            $http.post(webservice_path + 'updateProfile', param).success(function (res) {
                if(res.status == true){
                    toastr.success(res.result.message);
                    $state.go('app.profile', {}, {reload: true});
                }
            }).error(function (res) {
                if(res.status == false){
                    $scope.submittedprofile = false;
                    $scope.disabledprofile = false;
                    toastr.error(res.result.message);
                }
            });
        }
    };

    $scope.changePass = function (isValid) {
        $scope.submittedpass = true;
        if (isValid) {
            $scope.disabledpass = true;
            $scope.currentpassword = $scope.currentpassword.trim();
            $scope.password = $scope.password.trim();
            var param = {
                'currentpassword': $scope.currentpassword,
                'password': $scope.password,
                'uid': $scope.uid,
                'token': $scope.token,
                'type': app_type
            };
            $http.post(webservice_path + 'changePassword', param).success(function (res) {
                if(res.status == true){
                    toastr.success(res.result.message);
                    ipCookie.remove('uid');
                    ipCookie.remove('token');
                    $state.go('login');
                }
            }).error(function (res) {
                if(res.status == false){
                    $scope.submittedpass = false;
                    $scope.disabledpass = false;
                    toastr.error(res.result.message);
                }
            });
        }
    };

    $scope.sizeLimit = 1058576; // 10MB in Bytes
    $scope.uploadFile = function (files, t) {
        if(files[0] != undefined){
            if (window.FileReader) {   //do this
                var reader = new FileReader();
                var fd = new FormData();

                var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
                if (Extension == "gif" || Extension == "png" || Extension == "bmp" || Extension == "jpeg" || Extension == "jpg") {
                    fd.append("file", files[0]);
                    var val = '';
                    reader.onload = function (e) {
                        val = e.target.result;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };
                    $scope.ProfilePic = files[0];
                    reader.readAsDataURL(files[0]);
                } else {
                    $scope.ProfilePic = files[0];
                }
            } else {
                $scope.ProfilePic = files[0];
            }
        }else{
            $scope.ProfilePic = false;
        }
    };

    $scope.fileSizeLabel = function () {
        // Convert Bytes To MB
        return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
    };

    var formdata = new FormData();

    $scope.getTheFiles = function ($files) {
        angular.forEach($files, function (value, key) {
            formdata.append('profilepic', value);
        });
    };

    $scope.changeAvatar = function () {
        if ($scope.ProfilePic) {
            if ($scope.ProfilePic.type == "image/jpeg" || $scope.ProfilePic.type == "image/png" || $scope.ProfilePic.type == "image/jpg" || $scope.ProfilePic.type == "image/gif") {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.ProfilePic.size));
                if (fileSize > $scope.sizeLimit) {
                    toastr.error('Sorry, the file is too large. <br/> The maximum allowed size is ' + $scope.fileSizeLabel(),'Very large file');
                    return false;
                } else {
                    $scope.disabledavatar = true;
                    formdata.append('token', $scope.token);
                    formdata.append('uid', $scope.uid);
                    formdata.append('type', app_type);
                    $http({
                        method: 'POST',
                        url: webservice_path + 'changeAvatar',
                        data: formdata,
                        headers: {
                            'Content-Type': undefined
                        }
                    }).success(function (res) {
                        if(res.status == true){
                            toastr.success(res.result.message);
                            // $state.go('app.dashboard');
                            $state.go('app.profile', {}, {reload: true});
                            $scope.disabledavatar = false;
                        }
                    }).error(function (res, status) {
                        if(res.status == false){
                            $scope.disabledavatar = false;
                            toastr.error(res.result.message);
                        }
                    });
                }
            } else {
                toastr.error('The profile image must be an image file.', 'File type');
            }
        } else {
            toastr.error('Please select profile picture', 'Image');
        }
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
}).directive('ngFiles', ['$parse', function ($parse) {

    function fn_link(scope, element, attrs) {
        var onChange = $parse(attrs.ngFiles);
        element.on('change', function (event) {
            onChange(scope, { $files: event.target.files });
        });
    }

    return {
        link: fn_link
    }
} ]);