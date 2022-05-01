'use strict';
/* Controllers */
app.controller('adddocCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename = $scope.documents.addttile;
        $scope.id = $stateParams.did;
        $scope.userId = localStorage.getItem('aid');
        $scope.type='document';

        /** GET FOLDER BY TYPE*/
        getFolder();
        function getFolder() {
            var paramd = {eType:$scope.type};
            $http.post(webservice_path + 'folder/getFolder',paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** GET CATEGORY IN ORDER TO CHANGE FOLDER*/
        $scope.getchange = function (id) {
            $scope.iDocumentCategoryId = '';
            var paramd = {type:$scope.type};
            $http.post(webservice_path + 'document/getDocumentCategory/' + id , paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getDocumentCategory = res.Response;
                }
            });
        };

        if ($stateParams.did) {
            $scope.pagename = $scope.documents.edittitle;
            $http.get(webservice_path +'document/view?id=' + $scope.id).success(function(res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True') {
                    $scope.iPkDocTemplateId =res.Response.iFkDocTemplateId;
                    $scope.DocumentName = res.Response.vDocName;
                    $scope.documentSuggestion =res.Response.vDocSuggestion;
                    $scope.DocumentGuide = res.Response.vDocGuide;
                    $scope.isRequired =res.Response.eIsDocRequired;
                    $scope.iPkFolderId = res.Response.iFkFolderId;
                    $scope.getchange(res.Response.iFkFolderId);
                    $scope.iDocumentCategoryId = res.Response.iFkDocCatId;
                }else{
                    toaster.pop('error','',res.Message);
                }
            });
        }

        $scope.add_cat_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    iDocumentCategoryId: $scope.iDocumentCategoryId,
                    iPkDocTemplateId:$scope.iPkDocTemplateId,
                    DocumentName: $scope.DocumentName,
                    documentSuggestion:$scope.documentSuggestion,
                    DocumentGuide:$scope.DocumentGuide,
                    isRequired:$scope.isRequired,
                    catId: $stateParams.did,
                    iPkFolderId:$scope.iPkFolderId
                };
                if ($stateParams.did) {
                    $http.post( webservice_path +'document/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.document");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'document/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.document");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
