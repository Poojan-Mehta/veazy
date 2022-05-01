'use strict';

/* Controllers */

app.controller('addlessionCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','FileUploader',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,FileUploader) {
        $scope.pagename=$scope.lession.addtitle;


       /* var uploader = $scope.uploader = new FileUploader({
            url: webservice_path + 'lession/index'

        });


        // FILTERS
        uploader.filters.push({
            name: 'customFilter',
            fn: function(item *//*{File|FileLikeObject}*//*, options) {
                return this.queue.length < 10;
            }
        });
        // CALLBACKS

        uploader.onWhenAddingFileFailed = function(item *//*{File|FileLikeObject}*//*, filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onAfterAddingFile = function(fileItem) {
            console.info('onAfterAddingFile', fileItem);
        };
        uploader.onAfterAddingAll = function(addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
        };
        uploader.onProgressItem = function(fileItem, progress) {
            console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function(progress) {
            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            console.info('onSuccessItem', fileItem, response, status, headers);
        };
        uploader.onErrorItem = function(fileItem, response, status, headers) {
            console.info('onErrorItem', fileItem, response, status, headers);
        };
        uploader.onCancelItem = function(fileItem, response, status, headers) {
            console.info('onCancelItem', fileItem, response, status, headers);
        };
        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            console.info('onCompleteItem', fileItem, response, status, headers);
        };
        uploader.onCompleteAll = function() {
            console.info('onCompleteAll');
        };

        console.info('uploader', uploader);*/

        $scope.uploadVideo = function (files, t) {
            var reader = new FileReader();

            var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
            if (Extension == "mp4" || Extension == "mkv" || Extension=="3gp") {
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
                toaster.pop('error', '', 'Accept Only Video!');
            }
        };



        var fd = new FormData();
        var allpimage = [];
        var videos = [];

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
        $scope.removeImage = function (index,id) {
            if($scope.pid){
                if(id!=null) {
                    var param = {
                        PropertyMediaId: id,
                    };
                    commonService.callAPi('post', webservice_path + 'webservice/deletePropertyImage', param).success(function (res) {
                        if (res.Status == "True") {
                            toaster.pop('success', '', 'Image removed successfully');
                        }
                    });
                }
            }
            $scope.reviewImage.splice(index, 1);
            allpimage.splice(index, 1);

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
