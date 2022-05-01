'use strict';

/* Controllers */
app.controller('addtodoCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename= "Add To Do";
        $scope.id = $stateParams.tdid;

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.todolist");
        }

        /** GET TODO FOLDER BY TYPE */
        getFolder();
        function getFolder() {
            $scope.type='todo';
            var paramd = {
                eType:$scope.type
            };
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

        /** VIEW TODO DETAILS BY ID */
        if ($stateParams.tdid) {
            $scope.pagename="Edit To Do"
            $http.get(webservice_path +'/todo/view/'+ $stateParams.tdid).success(function(res) {
                if (res.StatusCode == '999') {
                    $state.go('login');
                    toaster.pop('error','',$scope.general.sessionexpire);
                } else if (res.Status == 'True') {
                    $scope.vtodo = res.Response.vToDo;
                    $scope.iPkFolderId=res.Response.iFkFolderId;
                    $scope.getchange(res.Response.iFkFolderId);
                    $scope.iDocumentCategoryId = res.Response.iFkDocCatId;
                } else if (res.StatusCode == '0') {
                    $state.go("app.todolist");
                    toaster.pop('error','',res.Message);
                }
            });
        }

        /** ADD & EDIT TODO */
        $scope.add_todolist_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    vtodo: $scope.vtodo,
                    catId: $stateParams.tdid,
                    iDocumentCategoryId:$scope.iDocumentCategoryId,
                    iPkFolderId:$scope.iPkFolderId
                };

                if ($stateParams.tdid) {
                    $http.post(webservice_path +'todo/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.todolist");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'todo/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.todolist");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
