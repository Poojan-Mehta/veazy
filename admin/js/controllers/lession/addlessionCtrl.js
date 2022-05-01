'use strict';

/* Controllers */
app.directive("limitTexteditor", [function() {
    return {
        restrict: "A",
        link: function(scope, elem, attrs) {
            var limit = parseInt(attrs.limitTexteditor);
            angular.element(elem).on("keypress", function(event) {
                if (elem[0].innerText.length == 250){
                    if (event.keyCode !== 8 && event.keyCode !== 46) {
                        event.preventDefault();
                    }
                }
            });
        }
    }
}]);
app.controller('addlessionCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt', '$modal',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt, $modal) {
        $scope.pagename = $scope.lession.addtitle;
        $scope.id = $stateParams.lid;
        $scope.tab = 'true';
        $scope.lessonparam = {};
        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if ($stateParams.lid == '') {
            toaster.pop('error', '', 'Something went wrong.');
            $state.go("app.lession");
        }

        /** GET FOLDER DATA TYPE WISE*/
        getFolder();
        function getFolder() {
            $scope.type = 'lesson';
            var paramd = {eType: $scope.type};
            $http.post(webservice_path + 'folder/getFolder', paramd).success(function (res) {
                if (res.Status == 'True') {
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** GET DATA EDIT TIME*/
        if ($stateParams.lid) {
            $scope.pagename = $scope.lession.edittitle;
            /** GET LESSION DATA START*/
            $scope.getLesson = function () {
                var param = {iPkLessonId: $scope.id};
                $http.post(webservice_path + 'lession/getLessons/' + $scope.id, param).success(function (res) {
                	if (res.Status == 'True') {                        
                        $scope.lessonparam.vTitle = res.Response.vLessonTitle;
                        $scope.lessonparam.vDescription = res.Response.vLessonDescription;
                        $scope.iPkLessonId = res.Response.iPkLessonId;
                        $scope.vLessonResourcepath = res.Response.vLessonResource;
                        $scope.lessonparam.iPkFolderId = res.Response.iFkFolderId;
                        $scope.path = '../api/webroot/videos/';
                        $scope.lesson_video_name = res.Response.vLessonResource;
                        $scope.lesson_thumb_video_name = res.Response.vthumbnailFile;
                        $scope.lesson_thumbnail = res.Response.vthumbnailFile;
                        $scope.reviewImage = window.location.protocol + "//" + window.location.host + "/"+project_name + "/" + 'api/videos/thumbnail/' + res.Response.lesson_image;
                        $scope.lessonparam.vLessonVideoLink = res.Response.vLessonVideoLink;
                        $scope.isDisabled = true;
                        $scope.tab = false;
                        $scope.isDisabledVideo = true;                        
                    }
                    else if (res.StatusCode == '0') {
                        $state.go("app.lession");
                        toaster.pop('error', '', res.Message);
                    }
                });
            };
            $scope.getLesson();
            /** GET LESSION DATA END*/

            /** GET LESSION RESOURCE START*/
            $scope.getSubResources = function (record) {
                var param = {iPkLessonId: $stateParams.lid};
                $http.post(webservice_path + 'lession/getSubResources', param).success(function (res) {
                    $scope.displayedCollections = res.Response;
                });
            };

            $scope.getSubResources();
            /** GET LESSION RESOURCE END*/
        }

        /** THIS FUNCTION IS USED FOR EDIT TIME BUTTON CHANGE */
        $scope.editTitleDescription = function () {
            $scope.isDisabled = false;
        };

        /** THIS FUNCTION IS USED FOR ADD AND EDIT TITLE AND DESCRIPTION IN DATABASE */
        $scope.flag = false;
        $scope.addTitleDescription = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                $scope.flag = true;
                var param = {
                    vTitle: $scope.lessonparam.vTitle,
                    vDescription: $scope.lessonparam.vDescription,
                    iPkLessonId: $scope.iPkLessonId,
                    iPkFolderId: $scope.lessonparam.iPkFolderId
                };
                if ($scope.iPkLessonId == undefined) {                    
                    localStorage.setItem('iPkLessonId', '');
                    $http.post(webservice_path + 'lession/addLession', param).success(function (res) {
                        $scope.flag = false;
                        if (res.Status == "True") {                            
                            $scope.isDisabled = true;
                            $scope.tab = false;
                            toaster.pop('success', 'Added Successfully');
                            $scope.iPkLessonId = res.Response.iPkLessonId;
                            localStorage.setItem('iPkLessonId', $scope.iPkLessonId);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'lession/editLession', param).success(function (res) {
                        $scope.flag = false;
                        if (res.Status == "True") {
                            $scope.isDisabled = true;
                            $scope.tab = false;
                            toaster.pop('success', 'Edited Successfully');
                            $scope.iPkLessonId = res.Response.iPkLessonId;
                            localStorage.setItem('iPkLessonId', $scope.iPkLessonId);
                        }
                    });
                }
            }
        };

        $scope.sizeLimit = 10585760; // 10MB in Bytes
        $scope.uploadVideo = function (files, t) {
            if (window.FileReader) {   //do this
                var reader = new FileReader();
                var fd = new FormData();

                var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
                if (Extension == "mp4") {
                    fd.append("file", files[0]);
                    var val = '';
                    reader.onload = function (e) {
                        val = e.target.result;
                        $scope.reviewImage2 = e.target.result;
                        if (!$scope.$phase) {
                            $scope.$apply();
                        }
                    };
                    $scope.videoFile = files[0];
                    console.log($scope.videoFile);
                    reader.readAsDataURL(files[0]);
                } else {
                    $scope.videoFile = files[0];
                    toaster.pop('error', 'Invalid Files accept only *.mp4');
                }
            } else {
                $scope.videoFile = files[0];
            }
        };

        $scope.edit_video_form = function () {
            $scope.isDisabledVideo = false;
        };

        /** ADD VIDEO FUNCTION */
        $scope.add_video_form = function () {
        	$scope.submitted = true;
            $scope.flagVideo = true;

            $scope.iPkLessonId = $scope.iPkLessonId;
            if ($scope.iPkLessonId != undefined || $scope.iPkLessonId != '') {                
                var paramss = {iPkLessonId: $scope.iPkLessonId};

                $http.post(webservice_path + 'lession/checkVideoLesson', paramss).success(function (res) {
                    $scope.flag = false;
                    if (res.Status == "True") {                                                
                        if (res.Response.Status == 'yes') {                            
                            if($scope.lesson_video_name == ''){
                                toaster.pop('error', 'Please select video');                                
                                $scope.isDisabledVideo = true;
                                return false;
                            }else {                                                                                        
                                var paramvideo = {
                                    videoFile: $scope.videoFile,
                                    thumbnail: $scope.thumbfileName,
                                    iPkLessonId: $scope.iPkLessonId,
                                    lesson_video_name: $scope.lesson_video_name,
                                    lesson_thumb_video_name: $scope.lesson_thumb_video_name,
                                    lesson_thumbnail: $scope.lesson_thumbnail,
                                    vLessonVideoLink: $scope.lessonparam.vLessonVideoLink                                   
                                };
                                $http({
                                    method: 'POST',
                                    url: webservice_path + 'lession/editVideo',
                                    headers: {'Content-Type': 'multipart/form-data'},
                                    data: paramvideo,
                                    transformRequest: function (data, headersGetter) {
                                        var formData = new FormData();
                                        angular.forEach(data, function (value, key) {
                                            formData.append(key, value);
                                        });
                                        var headers = headersGetter();
                                        delete headers['Content-Type'];
                                        return formData;
                                    }
                                }).success(function (res) {
                                    $scope.flagVideo = false;
                                    if (res.Status == "True") {
                                        toaster.pop('success', 'Edited Successfully');
                                        $scope.isDisabledVideo = true;
                                        $scope.getLesson();
                                        $scope.videos = '';
                                    }
                                });                                
                            }
                        }
                        if (res.Response.Status == 'no' || res.Response.Status == null) {                            
                            if ($scope.iPkLessonId) {
                                /*if ($scope.videoFile == '' || $scope.videoFile == undefined || $scope.videoFile == '') {
                                    toaster.pop('error', 'Please select video');
                                    $scope.isDisabledVideo = true;
                                    return false;
                                } else {*/
                                    /*if ($scope.videoFile.type == "video/mp4") {*/
                                        var params = {
                                            videoFile: $scope.videoFile,
                                            iPkLessonId: $scope.iPkLessonId,
                                            thumbnail: $scope.thumbfileName,
                                            vLessonVideoLink: $scope.lessonparam.vLessonVideoLink
                                        };
                                        $http({
                                            method: 'POST',
                                            url: webservice_path + 'lession/addVideo',
                                            headers: {'Content-Type': 'multipart/form-data'},
                                            data: params,
                                            transformRequest: function (data, headersGetter) {
                                                var formData = new FormData();
                                                angular.forEach(data, function (value, key) {
                                                    formData.append(key, value);
                                                });
                                                var headers = headersGetter();
                                                delete headers['Content-Type'];
                                                return formData;
                                            }
                                        }).success(function (res) {
                                            $scope.flagVideo = false;
                                            $scope.isDisabledVideo = true;
                                            if (res.Status == "True") {
                                                $scope.isDisabledVideo = true;
                                                $http.post(webservice_path + 'lession/getLessons/' + $scope.iPkLessonId).success(function (res) {
                                                    $scope.isDisabledVideo = true;
                                                    if (res.Status == 'True') {
                                                        $scope.lessonparam.vTitle = res.Response.vLessonTitle;
                                                        $scope.lessonparam.vDescription = res.Response.vLessonDescription;
                                                        $scope.iPkLessonId = res.Response.iPkLessonId;
                                                        $scope.vLessonResourcepath = res.Response.vLessonResource;
                                                        $scope.path = '../api/webroot/videos/';
                                                        $scope.isDisabled = true;
                                                        $scope.isDisabledVideo = true;
                                                    }
                                                });
                                            }
                                        });
                                    /*} else {
                                        toaster.pop('error', 'Invalid file type. Selected file must be *.mp4');
                                    }*/
                                /*}*/
                            } else {
                                toaster.pop('error', 'Lesson Title is required');
                            }
                        }
                    }
                });
            }
        };

        /** CHECK UPLOADED FILE */
        $scope.uploadResources = function (files, t) {
            $scope.fileName = files[0];
            
            if(t == 'thumbnail'){
                if (window.FileReader) {   //do this
                    var reader = new FileReader();
                    var fd = new FormData();

                    var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
                    if (Extension == "png" || Extension == "jpeg" || Extension == "jpg" || Extension == 'gif') {
                        fd.append("file", files[0]);
                        reader.onload = function (e) {
                            $scope.reviewImage = e.target.result;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        };
                        $scope.thumbfileName = files[0];
                        console.log($scope.thumbfileName);
                        reader.readAsDataURL(files[0]);
                    } else {
                        $scope.thumbfileName = files[0];
                    }
                } else {
                    $scope.thumbfileName = files[0];
                }
            }
        };

        $scope.resource = {};
        /** ADD RESOURCE FILE FUNCTION */
        $scope.addResourceFiles = function (isValid) {
            if (isValid) {
                if ($scope.iPkLessonId) {
                    if ($scope.fileName) {
                        var Extension =$scope.fileName.name.substring($scope.fileName.name.lastIndexOf('.') + 1).toLowerCase();
                        var arr=["BMP", "CSV", "DOC", "DOCX", "GIF", "JPEG", "JPG", "PDF", "PNG", "PPT", "PPTX", "XLS", "XLSX", "XLSX"];

                        if (arr.indexOf(Extension.toUpperCase())!=-1) {
                            var paramResources = {
                                iPkLessonId: $scope.iPkLessonId,
                                resources: $scope.fileName,
                                resourceName: $scope.resource.resourceName
                            };

                            $http({
                                method: 'POST',
                                url: webservice_path + 'lession/addSubResourceFile',
                                headers: {'Content-Type': 'multipart/form-data'},
                                data: paramResources,
                                transformRequest: function (data, headersGetter) {
                                    var formData = new FormData();
                                    angular.forEach(data, function (value, key) {
                                        formData.append(key, value);
                                    });
                                    var headers = headersGetter();
                                    delete headers['Content-Type'];
                                    return formData;
                                }
                            }).success(function (res) {
                                if (res.Status == "True") {
                                    $scope.fileName = '';
                                    $scope.resource.resourceName = '';
                                    var param = {iPkLessonId: $scope.iPkLessonId};
                                    $http.post(webservice_path + 'lession/getSubResources', param).success(function (res) {
                                        $scope.displayedCollections = res.Response;
                                    });
                                }else{
                                    toaster.pop('error', 'Resource Name is required');
                                }
                            });
                        }
                        else {
                            toaster.pop('error', 'Resource file must be document,image or pdf.', 'Invalid File');
                        }
                    }else{
                        toaster.pop('error', 'Please select resource file');
                    }
                } else {
                    toaster.pop('error', 'Lesson Title is required');
                }
            }else{
                toaster.pop('error', 'Resource Name is required');
            }

        };

        /** REMOVE RESOURCE FILE */
        $scope.removeItem = function (id) {
            $scope.promtmsg = ('Are you sure want to remove selected file?');
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                var param = {iPkLessonRId: id};
                $http.post(webservice_path + 'lession/deleteResources', param).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success', "Deleted Successfully");
                        var param = {iPkLessonId: $scope.iPkLessonId};
                        $http.post(webservice_path + 'lession/getSubResources', param).success(function (res) {
                            $scope.displayedCollections = res.Response;
                        });
                    }
                });
            });
        };

        if ($stateParams.lid) {
            $scope.tab = 'false';
        }else if ($scope.iPkLessonId) {
            $scope.tab = 'false';
        } else {
            $scope.tab = 'true';
        }

    }]);
