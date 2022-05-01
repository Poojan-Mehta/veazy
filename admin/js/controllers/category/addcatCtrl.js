'use strict';
/* Controllers */

angular.module('app', ['tree.dropdown']);

app.controller('addcatCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename = $scope.category.addcategory;
        $scope.id = $stateParams.catid;

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.category");
        }

        $scope.userId = localStorage.getItem('aid');
        $scope.show='yes';

        /** VIEW PRODUCT CATEGORY BY ID*/
        if ($stateParams.catid) {
            $scope.show='no';
            $scope.showcancel='yes';
            $scope.pagename = $scope.category.editcategory;
            $http.get(webservice_path +'category/view/' + $scope.id).success(function(res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True') {
                    $scope.catName = res.Response.vVisaCat;
                    $scope.catDesc =res.Response.vVisaCatDesc;
                    $scope.fk_parent_cat_id=res.Response.iParentVisaCatId;

                    var param = {
                        fk_parent_cat_id:$scope.fk_parent_cat_id
                    };
                    $http.post(webservice_path +'category/getSelectedCategoryName',param).success(function(res) {
                        if (res.Status == 'True'){
                            $scope.vVisaCat = res.Response.vVisaCat;
                        }
                    });
                    $scope.editParent=function(){
                        $scope.show='yes';
                        $scope.showcancel='yes';
                    };
                    $scope.cancelEdit=function(){
                        $scope.show='no';
                        $scope.showcancel='no';
                    };

                }else if (res.StatusCode == '0') {
                    $state.go("app.category");
                    toaster.pop('error','',res.Message);
                }else{
                    toaster.pop('error','',res.Message);
                }
            });
        }

        $scope.selectId=function(id){
             $scope.fk_parent_cat_id=id;
        };

        /** GET PARENT CATEGORY*/
        $scope.getParentCategory =function() {
            var param = {
                cat_id:$stateParams.catid
            };
            $http.post(webservice_path +'category/getParentCategory',param).success(function(res) {
                if (res.Status == 'True') {
                    $scope.treeData = res.Response;
                }
            });
        };
        $scope.getParentCategory();

        /** ADD & EDIT PRODUCT CATEGORY*/
        $scope.add_cat_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    aid:$scope.userId,
                    catName: $scope.catName,
                    catDesc:$scope.catDesc,
                    catId: $stateParams.catid,
                    fk_parent_cat_id:$scope.fk_parent_cat_id
                };

                if ($stateParams.catid) {
                    $http.post( webservice_path +'category/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.category");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'category/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.category");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        };


    }]);
