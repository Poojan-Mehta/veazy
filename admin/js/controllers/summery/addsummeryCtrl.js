'use strict';

/* Controllers */
app.controller('addhomesliderCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename=$scope.summary.addsumery;
        $scope.summeryid = $stateParams.suid;
        $scope.type='summary';

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.summeryid == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.summery");
        }

        /** GET FOLDER DATA*/
        getFolder();
        function getFolder() {
            var paramd = {eType:$scope.type};
            $http.post(webservice_path + 'folder/getFolder',paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** GET CATEGORY DATA IN ORDER TO CHANGE FOLDER*/
        $scope.getchange = function (id) {
            $scope.iDocumentCategoryId = '';
            var paramd = {type:$scope.type};
            $http.post(webservice_path + 'document/getDocumentCategory/' + id , paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getDocumentCategory = res.Response;
                }
            });
        };

        /** FETCH SUMMARY DATA ID WISE */
        if ($stateParams.suid) {
            $scope.pagename=$scope.summary.editsummery;
            $http.get(webservice_path +'/homeslider/view/'+ $stateParams.suid).success(function(res) {
                if (res.StatusCode == '999') {
                    $state.go('login');
                    toaster.pop('error','',$scope.general.sessionexpire);
                } else if (res.Status == 'True') {
                    $scope.vSliderTitle = res.Response.vSummaryTitle;
                    $scope.vSliderDescription = res.Response.vSummaryDescription;
                    $scope.iPkFolderId = res.Response.iFkFolderId;
                    $scope.getchange(res.Response.iFkFolderId);
                    $scope.iDocumentCategoryId = res.Response.iFkDocCatId;
                } else if (res.StatusCode == '0') {
                    $state.go("app.summery");
                    toaster.pop('error','',res.Message);
                }
            });
        }

        /** ADD & EDIT SUMMARY*/
        $scope.add_summery_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    vSliderTitle: $scope.vSliderTitle,
                    vSliderDescription:$scope.vSliderDescription,
                    catId: $stateParams.suid,
                    iDocumentCategoryId:$scope.iDocumentCategoryId,
                    iPkFolderId:$scope.iPkFolderId
                };

                if ($stateParams.suid) {
                    $http.post( webservice_path +'homeslider/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.summery");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'homeslider/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.summery");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
