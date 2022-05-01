'use strict';
/* Controllers */
app.controller('addbusinesscatCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename = $scope.documentCategory.addttile;
        $scope.id = $stateParams.dcatid;
        $scope.userId = localStorage.getItem('aid');
        $scope.type='document';

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.businesscategory");
        }

        /** VIEW DOCUMENT CATEGORY DATA BY ID AND TYPE WISE*/
        if ($stateParams.dcatid) {
            $scope.pagename = $scope.documentCategory.edittitle;
            var param = {
                eType:$scope.type
            }
            $http.post(webservice_path +'documentCategory/view/' + $scope.id , param).success(function(res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True') {
                    $scope.catName = res.Response.vDocCat;
                    $scope.catDesc =res.Response.vDocCatDesc;
                    $scope.iPkFolderId = res.Response.iFKFolderId;
                }else if (res.StatusCode == '0') {
                    $state.go("app.businesscategory");
                    toaster.pop('error','',res.Message);
                }
            });
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

        /** ADD & EDIT DOCUMENT CATEGORY*/
        $scope.add_cat_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    catName: $scope.catName,
                    catDesc:$scope.catDesc,
                    catId: $stateParams.dcatid,
                    type:$scope.type,
                    iPkFolderId:$scope.iPkFolderId
                };
                if ($stateParams.dcatid) {
                    $http.post( webservice_path +'documentCategory/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.businesscategory");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'documentCategory/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.businesscategory");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
