'use strict';

/* Controllers */
app.controller('addfaqCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename=$scope.faq.addtitle;
        $scope.faq_id = $stateParams.fid;

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.faq_id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.faq");
        }

        getFolder();

        /** GET FAQ FOLDER */
        function getFolder() {
            $scope.type='faq';
            var paramd = {
                eType:$scope.type
            };
            $http.post(webservice_path + 'folder/getFolder',paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** VIEW FAQ DETAILS BY ID*/
        if ($stateParams.fid) {
            $scope.pagename=$scope.faq.edittitle;
            $http.get(webservice_path +'/Faq/view/'+ $stateParams.fid).success(function(res) {
                if (res.StatusCode == '999') {
                    $state.go('login');
                    toaster.pop('error','',$scope.general.sessionexpire);
                } else if (res.Status == 'True') {
                    $scope.vSliderTitle = res.Response.vFAQ;
                    $scope.vSliderDescription = res.Response.vFAQAnswer;
                    $scope.iPkFolderId= res.Response.iFkFolderId;
                } else if (res.StatusCode == '0') {
                    $state.go("app.faq");
                    toaster.pop('error','',res.Message);
                }
            });
        }

        /** ADD & EDIT FAQ */
        $scope.add_summery_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    vSliderTitle: $scope.vSliderTitle,
                    vSliderDescription:$scope.vSliderDescription,
                    catId: $stateParams.fid,
                    iPkFolderId:$scope.iPkFolderId
                };

                if ($stateParams.fid) {
                    $http.post( webservice_path +'Faq/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.faq");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'Faq/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.faq");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
