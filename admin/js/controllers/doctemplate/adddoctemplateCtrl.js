'use strict';
/* Controllers */
app.controller('adddoctemplateCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster) {
        $scope.pagename = $scope.documenttemplate.addttile;
        $scope.id = $stateParams.tempid;
        $scope.userId = localStorage.getItem('aid');

        /** VIEW DOCUMENT TEMPLATE*/
        if ($stateParams.tempid) {
            $scope.pagename = $scope.documenttemplate.edittitle;
            $http.get(webservice_path + 'DocTemplate/view?id=' + $scope.id).success(function (res) {
                if (res.StatusCode == '999') {
                    $scope.logout();
                    toaster.pop('error', '', res.Message);
                } else if (res.Status == 'True') {
                    $scope.catName = res.Response.vDocTemplate;
                    $scope.catDesc = res.Response.vDocTemplateDesc;
                    $scope.vDocTemplateFile = res.Response.vDocTemplateFile;
                    $scope.price = res.Response.dDocTemplatePrice;
                } else {
                    toaster.pop('error', '', res.Message);
                }
            });
        }

        /** CHECK UPLOADED FILE*/
        $scope.sizeLimit = 10585760; // 10MB in Bytes
        $scope.uploadResources = function (files, t) {
            if (window.FileReader) {   //do this
                var reader = new FileReader();
                var fd = new FormData();

                var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
                if (Extension == "gif" || Extension == "png" || Extension == "bmp" || Extension == "jpeg" || Extension == "jpg") {
                    fd.append("file", files[0]);
                    var val = '';
                    reader.onload = function (e) {
                        val = e.target.result;
                        $scope.reviewImage2 = e.target.result;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };
                    $scope.fileName = files[0];
                    reader.readAsDataURL(files[0]);
                } else {
                    $scope.fileName = files[0];
                }
            } else {
                $scope.fileName = files[0];
            }
        };

        $scope.fileSizeLabel = function () {
            // Convert Bytes To MB
            return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
        };

        /** ADD & EDIT DOCUMENT TEMPLATE*/
        $scope.add_cat_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid: $scope.userId,
                    catName: $scope.catName,
                    catDesc: $scope.catDesc,
                    price: $scope.price,
                    Filename: $scope.fileName,
                    catId: $stateParams.tempid
                };

                if ($stateParams.tempid) {
                    if ($scope.fileName) {
                        if ($scope.fileName.type == "image/jpeg" || $scope.fileName.type == "image/png" || $scope.fileName.type == "image/jpg" || $scope.fileName.type == "application/pdf" || $scope.fileName.type == "application/doc" || $scope.fileName.type == "application/msword") {

                            $http({
                                method: 'POST',
                                url: webservice_path + 'DocTemplate/edit',
                                headers: {'Content-Type': undefined},
                                data: param,
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
                                    $rootScope.sucs_status = true;
                                    $rootScope.message = res.Message;
                                    $state.go("app.doctemplate");
                                    toaster.pop('success', "Template has been updated successfully.");
                                } else {
                                    toaster.pop('error', '', res.Message);
                                }
                            });
                        }
                        else {
                            toaster.pop('error', 'Invalid file format');
                        }
                    } else {
                        if ($scope.fileName == '' || $scope.fileName == undefined || $scope.fileName == null) {
                            $scope.fileNamess = $scope.vDocTemplateFile;
                        }
                        var paramss = {
                            aid: $scope.userId,
                            catName: $scope.catName,
                            catDesc: $scope.catDesc,
                            price: $scope.price,
                            Filename: $scope.fileNamess,
                            catId: $stateParams.tempid
                        };
                        $http.post(webservice_path + 'DocTemplate/edit', paramss).success(function (res) {
                            if (res.StatusCode == '999') {
                                $scope.logout();
                                toaster.pop('error', '', res.Message);
                            } else if (res.Status == 'True') {
                                $state.go("app.doctemplate");
                                toaster.pop('success', '', res.Message);
                            } else {
                                toaster.pop('error', '', res.Message);
                            }
                        });
                    }
                } else {
                    if ($scope.fileName) {
                        /** PERFORM FILE SIZE CHECK FIRST*/
                        var fileSize = Math.round(parseInt($scope.fileName.size));
                        if (fileSize > $scope.sizeLimit) {
                            toaster.pop('error','Sorry, the file is too large. The maximum allowed size is '+ $scope.fileSizeLabel ());
                            $scope.subflag = false;
                            return false;
                        } else {
                            $http({
                                method: 'POST',
                                url: webservice_path + 'DocTemplate/add',
                                headers: {'Content-Type': 'multipart/form-data'},
                                data: param,
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
                                    $rootScope.sucs_status = true;
                                    $rootScope.message = res.Message;
                                    $state.go("app.doctemplate");
                                    toaster.pop('success', res.Message);
                                } else {
                                    toaster.pop('error', '', res.Message);
                                }
                            });
                        }
                    }else{
                        toaster.pop('error', 'Please select file');
                    }
                }
            }
        }
    }]);
