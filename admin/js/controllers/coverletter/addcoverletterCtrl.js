'use strict';
/* Controllers */
app.controller('addcoverletterCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename = $scope.coverletter.addttile;
        $scope.cover_id = $stateParams.cid;
        $scope.coverfee =[{'id':'free','name':'Free'},{'id':'paid','name':'Paid'}];
        $scope.feeId = 'free';
        $scope.cover_price = '';
        $scope.userId = localStorage.getItem('aid');

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.cover_id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.coverletter");
        }

        /**
         * Check wheather cover fee is paid or free
         */
        $scope.check_cover_fee = function () {
            if($scope.feeId == 'free'){
                $scope.cover_price = '';
            }
        };

        /** GET FOLDE BY TYPE*/
        getFolder();
        function getFolder() {
            $scope.type='cover';
            var param = {eType:$scope.type};
            $http.post(webservice_path + 'folder/getFolder',param).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** GET COVERLETTER DETAILS BY ID*/
        if ($stateParams.cid) {
            $scope.pagename = $scope.coverletter.edittitle;
            $http.get(webservice_path +'coverletter/view/' + $scope.cover_id).success(function(res){

                if (res.Status == 'True') {                    
                    $scope.iPkFolderId = res.Response.iFkFolderId;
                    $scope.catName = res.Response.vCoverLetterTitle;
                    $scope.catDesc =res.Response.vCoverLetterDesc;
                    $scope.feeId = res.Response.eCoverFee;
                    $scope.cover_price =res.Response.dCoverLetterPrice;
                    $scope.check_cover_fee();
                    $scope.cover_file = res.Response.vCoverLetterFile;
                    $scope.cover_thumbnail = res.Response.vCoverLetterThumbFile;
                    $scope.vDocTemplateFile = window.location.protocol + "//" + window.location.host + "/"+project_name + "/" + 'api/coverletters/file/' + res.Response.vCoverLetterFile;
                    $scope.reviewImage = window.location.protocol + "//" + window.location.host + "/"+project_name + "/" + 'api/coverletters/thumbnail/' + res.Response.cover_image;
                } else if (res.StatusCode == '0') {
                    $state.go("app.coverletter");
                    toaster.pop('error','',res.Message);
                } else{
                    toaster.pop('error','',res.Message);
                    $state.go("app.coverletter");
                }
            });
        }

        /** CHECK UPLOADED FILE*/
        $scope.uploadResources = function (files, t) {
            if(t == 'files'){

                if (window.FileReader) {   //do this
                    var reader = new FileReader();
                    var fd = new FormData();
                    var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
                    if (Extension == "doc" || Extension == "docx" || Extension == "pdf") {
                        fd.append("file", files[0]);
                        reader.onload = function (e) {
                            $scope.reviewImageFile = e.target.result;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        };
                        $scope.fileName = files[0];
                        reader.readAsDataURL(files[0]);
                    } else {
                        toaster.pop('error','',"Upload File Only Accept *.pdf,*.doc");
                        $scope.fileName = files[0];
                    }
                } else {
                    $scope.fileName = files[0];
                }
            }

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
                        reader.readAsDataURL(files[0]);
                    } else {
                        $scope.thumbfileName = files[0];
                    }
                } else {
                    $scope.thumbfileName = files[0];
                }
            }
        };

        /** ADD COVERLETTER FORM*/
        $scope.add_cat_form = function (isValid)
        {
            /** IMAGE EXTENSION ARRAY*/
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
            $scope.submitted = true;
            if(isValid){

                if($scope.feeId == 'paid'){
                    if($scope.cover_price == '' || $scope.cover_price <= 0){
                        toaster.pop('error','Cover price is required and must be greater than 0.');
                        return false;
                    }
                }

                var param = {
                    catId: $stateParams.cid,
                    userId:$scope.userId,
                    catName: $scope.catName,
                    catDesc:$scope.catDesc,
                    iPkFolderId:$scope.iPkFolderId,
                    feeId:$scope.feeId,
                    cover_price:$scope.cover_price,
                    fileName:$scope.fileName,
                    cover_file: $scope.cover_file,
                    cover_thumbnail: $scope.cover_thumbnail
                };

                if($stateParams.cid){
                    if ($scope.fileName) {
                        var Extension =$scope.fileName.name.substring($scope.fileName.name.lastIndexOf('.') + 1).toLowerCase();
                        if (arr.indexOf(Extension.toUpperCase())!=-1) {
                            var fileSize = Math.round(parseInt($scope.fileName.size));
                            if (fileSize > $scope.sizeLimit) {
                                toaster.pop('error','','Sorry, the selected file is too large. The maximum allowed size is ' + $scope.fileSizeLabel());
                                return false;
                            } else {
                                if($scope.thumbfileName){
                                    if($scope.thumbfileName.type == "image/jpeg" || $scope.thumbfileName.type == "image/png" || $scope.thumbfileName.type == "image/jpg" || $scope.thumbfileName.type == "image/gif"){
                                        param['thumbfileName'] = $scope.thumbfileName;
                                        $scope.edit_cat_form(param);
                                    }else{
                                        toaster.pop('error', 'Thumbnail type', 'Invalid thumbnail selected');
                                    }
                                }else{
                                    $scope.edit_cat_form(param);
                                }
                            }
                        }else{
                            toaster.pop('error', 'File type', 'Invalid file type');
                        }
                    }
                    else{
                        var param = {
                            catId: $stateParams.cid,
                            userId:$scope.userId,
                            catName: $scope.catName,
                            catDesc:$scope.catDesc,
                            iPkFolderId:$scope.iPkFolderId,
                            feeId:$scope.feeId,
                            cover_price:$scope.cover_price,
                            cover_file: $scope.cover_file,
                            cover_thumbnail: $scope.cover_thumbnail
                        };

                        if($scope.thumbfileName){
                            if($scope.thumbfileName.type == "image/jpeg" || $scope.thumbfileName.type == "image/png" || $scope.thumbfileName.type == "image/jpg" || $scope.thumbfileName.type == "image/gif"){
                                param['thumbfileName'] = $scope.thumbfileName;
                                $scope.edit_cat_form(param);
                            }else{
                                toaster.pop('error', 'Thumbnail type', 'Invalid thumbnail selected');
                            }
                        }else{
                            $scope.edit_cat_form(param);
                        }
                    }

                }else {
                    /** CHECK UPLOADED FILE*/
                    if ($scope.fileName) {
                        var Extension =$scope.fileName.name.substring($scope.fileName.name.lastIndexOf('.') + 1).toLowerCase();

                        if (arr.indexOf(Extension.toUpperCase())!=-1) {
                            // Perform File Size Check First
                            var fileSize = Math.round(parseInt($scope.fileName.size));
                            if (fileSize > $scope.sizeLimit) {
                                toaster.pop('error','','Sorry, the selected file is too large. The maximum allowed size is ' + $scope.fileSizeLabel());
                                return false;
                            } else {
                                if($scope.thumbfileName){
                                    if($scope.thumbfileName.type == "image/jpeg" || $scope.thumbfileName.type == "image/png" || $scope.thumbfileName.type == "image/jpg" || $scope.thumbfileName.type == "image/gif"){
                                        param['thumbfileName'] = $scope.thumbfileName;
                                        $http({
                                            method: 'POST',
                                            url: webservice_path + 'coverletter/add',
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
                                            if (res.Status == 'True') {
                                                $state.go("app.coverletter");
                                                toaster.pop('success', '',res.Message);
                                            }else{
                                                toaster.pop('error','',res.Message);
                                            }
                                        });
                                    }else{
                                        toaster.pop('error', 'Thumbnail type', 'Invalid thumbnail selected');
                                    }
                                }else{
                                    toaster.pop('error', 'Thumbnail', 'Please upload thumbnail');
                                }
                            }
                        } else {
                            toaster.pop('error', 'File type', 'Invalid file type');
                        }
                    } else {
                        toaster.pop('error', 'File', 'Please select upload file');
                    }

                }
            }
        };

        /** EDIT COVERLETTER FORM*/
        $scope.edit_cat_form = function (param) {

            $http({
                method: 'POST',
                url: webservice_path + 'coverletter/edit',
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
                if (res.Status == 'True') {
                    $state.go("app.coverletter");
                    toaster.pop('success','',res.Message);
                }else{
                    toaster.pop('error','',res.Message);
                }
            });
        }

    }]);
