'use strict';
/* Controllers */
app.controller('addmplaceCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.page_name = 'Add Market Place';
        $scope.id = $stateParams.mpid;
        $scope.type = 'product';
        $scope.save_btn = 'Add';

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.mplace");
        }

        if ($stateParams.mpid) {
            $scope.page_name = 'Edit Market Place';
            $scope.save_btn = 'Update';
            var param = {
                eType:$scope.type
            }
            $http.get(webservice_path +'/marketplace/view/'+ $scope.id, param).success(function(res) {
                if (res.StatusCode == '999') {
                    $state.go('login');
                    toaster.pop('error','',$scope.general.sessionexpire);
                } else if (res.Status == 'True') {
                    $scope.vMPName = res.Response.vMPName;
                } else if (res.StatusCode == '0') {
                    $state.go("app.mplace");
                    toaster.pop('error','',res.Message);
                }
            });
        }
        $scope.add_cat_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    vMPName: $scope.vMPName,
                    mpid: $stateParams.mpid,
                    eType: $scope.type,
                };

                if ($stateParams.mpid) {
                    $http.post(webservice_path +'marketplace/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.mplace");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'marketplace/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.mplace");
                            toaster.pop('success', '',res.Message);
                        }
                        else if (res.StatusCode == '500') {
                            toaster.pop('error','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
