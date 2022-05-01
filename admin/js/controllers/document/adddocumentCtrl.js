'use strict';
/* Controllers */
app.controller('adddocCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt) {
        $scope.pagename = $scope.documents.addttile;
        $scope.userId = localStorage.getItem('aid');
        $scope.id = $stateParams.did;
        $scope.type='document';

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.document");
        }

        /** GET FOLDER DATA BY TYPE*/
        getFolder();
        function getFolder() {
            var paramd = {eType:$scope.type};
            $http.post(webservice_path + 'folder/getFolder',paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** GET DOCUMENT CATEGORY */
        $scope.getchange = function (id) {
            $scope.iDocumentCategoryId = '';
            var paramd = {type:$scope.type};
            $http.post(webservice_path + 'document/getDocumentCategory/' + id , paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getDocumentCategory = res.Response;
                }
            });
        };

        /** VIEW DOCUMENT DETAILS BY ID*/
        if ($stateParams.did) {
            $scope.iPkDocId = $stateParams.did;
            $scope.pagename = $scope.documents.edittitle;
            $http.get(webservice_path +'document/view/' + $scope.iPkDocId).success(function(res){
                if (res.Status == 'True') {
                    $scope.DocumentName = res.Response.vDocName;
                    $scope.documentSuggestion =res.Response.vDocSuggestion;
                    $scope.DocumentGuide = res.Response.vDocGuide;
                    $scope.iPkFolderId = res.Response.iFkFolderId;
                    $scope.getchange(res.Response.iFkFolderId);
                    $scope.iDocumentCategoryId = res.Response.iFkDocCatId;
                    $scope.isDisabled = true;
                    $scope.getTemplates();
                } else if (res.StatusCode == '0') {
                    $state.go("app.document");
                    toaster.pop('error','',res.Message);
                } else{
                    toaster.pop('error','',res.Message);
                }
            });
        }

        /** GET TEMPLATE LISTING*/
        $scope.getTemplates = function (record) {
            var param = { iPkDocId: $scope.iPkDocId };
            $http.post(webservice_path + 'document/getTemplates', param).success(function (res) {
                $scope.displayedCollections = res.Response;
            });
        };

        /** EDIT TIME BUTTON CHANGE*/
        $scope.editTitleDescription = function () {
            $scope.isDisabled = false;
        };

        $scope.flag = false;

        /** ADD & EDIT DOCUMENT*/
        $scope.add_cat_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                $scope.flag = true;

                var param = {
                    aid:$scope.userId,
                    iDocumentCategoryId: $scope.iDocumentCategoryId,
                    DocumentName: $scope.DocumentName,
                    documentSuggestion:$scope.documentSuggestion,
                    DocumentGuide:$scope.DocumentGuide,
                    catId:$scope.iPkDocId,
                    iPkFolderId:$scope.iPkFolderId
                };
                if ($scope.iPkDocId != undefined) {
                    $http.post( webservice_path +'document/edit',param).success(function(res) {
                        $scope.flag = false;
                        if (res.Status == 'True') {
                            $scope.isDisabled = true;
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }else {
                    $http.post(webservice_path + 'document/add', param).success(function(res) {
                        $scope.flag = false;
                        if (res.Status == 'True') {
                            $scope.isDisabled = true;
                            $scope.iPkDocId = res.Response.iPkDocId;
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }


        /** Below code related to add template */

        $scope.uploadResources = function (files, t) {
            if (window.FileReader) {
                $scope.SelectedFile = files[0];
            } else {
                $scope.SelectedFile = files[0];
                toaster.pop('error','Invalid file selection');
            }
        };

        $scope.sizeLimit      = 10585760; // 10MB in Bytes
        $scope.fileSizeLabel = function() {
            // Convert Bytes To MB
            return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
        };

        $scope.subflag = false;

        /** ADD DOCUMENT RESOURCE & FILE UPLOAD CHECK*/
        $scope.addResourceFiles = function () {
            if($scope.iPkDocId){
                if ($scope.SelectedFile) {
                    var Extension =$scope.SelectedFile.name.substring($scope.SelectedFile.name.lastIndexOf('.') + 1).toLowerCase();
                    /** CHECK EXTENSION ARRAY */
                    var arr=["BMP",
                        "CSV",
                        "DOC",
                        "DOCX",
                        "EML",
                        "GIF",
                        "JPEG",
                        "JPG",
                        "KEYNOTE",
                        "MSG",
                        "NUMBERS",
                        "ODF",
                        "ODS",
                        "ODT",
                        "PAGES",
                        "PDF",
                        "PNG",
                        "PPT",
                        "PPTX",
                        "RAR",
                        "RTF",
                        "RTF/TEXT",
                        "TIF",
                        "TIFF",
                        "TXT",
                        "XLS",
                        "XLSX",
                        "XLSX",
                        "ZIP",
                        "7Z"];
                    if (arr.indexOf(Extension.toUpperCase())!=-1) {
                        var fileSize = Math.round(parseInt($scope.SelectedFile.size));
                        if (fileSize > $scope.sizeLimit) {
                            $scope.subflag = false;
                            toaster.pop('error','your attachment is too big. Maximum ' + $scope.fileSizeLabel() + ' file attachment allowed');
                            return false;
                        }
                        var param = {
                            iPkDocId: $scope.iPkDocId,
                            fileToUpload:$scope.SelectedFile
                        };
                        $scope.subflag = true;
                        $http({
                            method: 'POST',
                            url: webservice_path + "document/UploadTemplate",
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
                                $scope.SelectedFile = '';
                                $scope.ResourcesFiles = '';
                                $scope.getTemplates();
                                toaster.pop('success','',res.Message);
                                $scope.subflag = false;
                            }else{
                                toaster.pop('error','',res.Message);
                                $scope.subflag = false;
                            }


                        }).error(function (response) {
                            toaster.pop('error',"Something went wrong!");
                            $scope.subflag = false;
                        })
                    }else{
                        toaster.pop('error','Invalid File type.');
                        $scope.subflag = false;
                    }
                }else{
                    toaster.pop('error','Please select document.');
                    $scope.subflag = false;
                }
            }
        };

        /** REMOVE DOCUMENT*/
        $scope.removeItem = function (id) {
            $scope.promtmsg = ('Are you sure to remove selected template?');
            prompt({
                message: $scope.promtmsg,
                input: false

            }).then(function (name) {
                var param = {iPkDocTemplateId: id};
                $http.post(webservice_path + 'document/deleteTemplate', param).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success','',res.Message);
                        $scope.getTemplates();
                    }
                });
            });
        };

    }]);
