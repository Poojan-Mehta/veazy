'use strict';
/* Controllers */
app.controller('addlessonfolderCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {

        $scope.pagename="Add Folder";
        $scope.id = $stateParams.fid;
        $scope.type = 'lesson';

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.lessonfolder");
        }

        /** GET FOLDER DATA ID AND TYPE WISE*/
        if ($stateParams.fid) {
            $scope.pagename="Edit Folder";
            var param = {
                eType:$scope.type
            }
            $http.post(webservice_path +'/folder/view/'+ $scope.id , param).success(function(res) {
                if (res.StatusCode == '999') {
                    $state.go('login');
                    toaster.pop('error','',$scope.general.sessionexpire);
                } else if (res.Status == 'True') {
                    $scope.vFolderName = res.Response.vFolderName;
                } else if (res.StatusCode == '0') {
                    $state.go("app.lessonfolder");
                    toaster.pop('error','',res.Message);
                }
            });
        }

        /** ADD & EDIT LESSON FOLDER */
        $scope.add_cat_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    vFolderName: $scope.vFolderName,
                    fid: $stateParams.fid,
                    eType: $scope.type,
                };

                if ($stateParams.fid) {
                    $http.post(webservice_path +'folder/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.lessonfolder");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'folder/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.lessonfolder");
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
