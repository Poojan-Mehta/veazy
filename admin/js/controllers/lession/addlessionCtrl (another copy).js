'use strict';

/* Controllers */

app.controller('addlessionCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','FileUploader',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,FileUploader) {
        $scope.pagename=$scope.lession.addtitle;



        var fd = new FormData();
        var allpimage = [];
        var videos = [];


        $scope.uploadVideo = function (files, t) {
            var reader = new FileReader();

            var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
            if (Extension == "gif" || Extension == "png" || Extension == "bmp" || Extension == "jpeg" || Extension == "jpg") {
                fd.append("file", files[0]);
                var c = videos.length;
                videos[c] = files[0];

                window.img = files[0].name;

                var val = '';
                reader.onload = function (e) {
                    val = e.target.result;
                    $scope.reviewImage.push({'image' :e.target.result,'id': null});

                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                };
                reader.readAsDataURL(files[0]);
            }
            else {
                window.img = '';
                alert($scope.editprofile.invalidfile);
            }
        };


        $scope.uploadPhoto = function (files, t) {
            var reader = new FileReader();

            var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
            if (Extension == "gif" || Extension == "png" || Extension == "bmp" || Extension == "jpeg" || Extension == "jpg") {
                fd.append("file", files[0]);
                var c = allpimage.length;
                allpimage[c] = files[0];

                window.img = files[0].name;

                var val = '';
                reader.onload = function (e) {
                    val = e.target.result;
                    $scope.reviewImage.push({'image' :e.target.result,'id': null});

                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                };
                reader.readAsDataURL(files[0]);
            }
            else {
                window.img = '';
                alert($scope.editprofile.invalidfile);
            }
        };

        $scope.add_lesion_form = function (isValid) {

            $scope.submitted = true;
            if (isValid) {
                var formdata = new FormData();

                //All input data
                angular.forEach($scope.Lession, function (value, key) {
                    formdata.append(key, value);
                });
                formdata.append('vLesionName', $('#vLesionName').val());
                formdata.append('vDescription', $('#vDescription').val());
                //All images
                if(allpimage.length>0) {
                    for (var i = 0; i < allpimage.length; i++) {
                        formdata.append('images[]', allpimage[i]);
                    }
                }

                if(videos.length>0) {
                    for (var i = 0; i < allpimage.length; i++) {
                        formdata.append('videos[]', videos[i]);
                    }
                }

                $http.post(webservice_path + 'lession/add', formdata, {

                    transformRequest: angular.identity,
                    headers: {'Content-Type': undefined}
                })
                    .success(function (res) {
                        if (res.Status == "True") {
                            toaster.pop('success', '', res.Message);
                            $state.go('app.myproperty');
                        }
                        else {
                            toaster.pop('error', '', res.Message);
                        }
                    });

            }
        }
    }]);
