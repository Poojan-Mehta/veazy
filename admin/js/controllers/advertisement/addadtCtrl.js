'use strict';
/* Controllers */
app.controller('addadtCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename = $scope.advertisement.addadvertise;
        $scope.id = $stateParams.adtid;
        $scope.userId = localStorage.getItem('aid');

        if ($stateParams.adtid) {
            $scope.pagename = $scope.advertisement.editadvertise;
            $http.get(webservice_path +'advertisement/view?id=' + $scope.id).success(function(res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True') {
                    $scope.postTitle = res.Response.vPostTitle;
                    $scope.postDesc = res.Response.vPostDescription;
                    $scope.webURL = res.Response.vUsersAdWebsiteLink;
                }else{
                    toaster.pop('error','',res.Message);
                }
            });
        }

        $scope.add_adt_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    postTitle: $scope.postTitle,
                    postDesc: $scope.postDesc,
                    webURL: $scope.webURL,
                    adtId: $stateParams.adtid
                };
                if ($stateParams.adtid) {
                    $http.post( webservice_path +'advertisement/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.advertisement");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'advertisement/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.advertisement");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
