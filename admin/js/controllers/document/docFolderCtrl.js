'use strict';
/* Controllers */
app.controller('docFolderCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt) {
        $scope.id = localStorage.getItem('aid');

        $scope.rowCollection = [];
        $scope.folder_type = "document";

        /** GET FOLDER BY TYPE*/
        function getData() {
            var param = { eType:$scope.folder_type };
            $http.post(webservice_path +'folder',param).success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }
        getData();

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE DOC FOLDER*/
        $scope.removeItem = function (id, vFolderName) {
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.id,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'folder/delete',param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success',vFolderName, res.Message);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }else{
                        toaster.pop('error','',res.Message);
                    }
                });

            });
        };

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('cat' + value.iPkFolderId)) {
                    if (document.getElementById('cat' + value.iPkFolderId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            $('.catstatus').not(this).not(':disabled').prop('checked', this.checked);
        });

        /** REMOVE SELECTED FOLDER*/
        $scope.removeAll = function (){
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1){
                $scope.promtmsg = ($scope.general.removerecords);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('cat' + value.iPkFolderId)){
                            if (document.getElementById('cat' + value.iPkFolderId).checked == true){
                                allrecords.push(value.iPkFolderId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'folder/deleteAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.removesuccess);
                            getData();
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                    $('input:checkbox').removeAttr('checked');
                });
            } else {
                $scope.promtmsg = ($scope.general.singlerecorddelete);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                });
            }
        };

        /** ACTIVE SELECTED FOLDER*/
        $scope.activeAll = function () {
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ($scope.general.activerecords);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('cat' + value.iPkDocCatId)) {
                            if (document.getElementById('cat' + value.iPkDocCatId).checked == true) {
                                allrecords.push(value.iPkDocCatId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'documentCategory/changeStatusAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.activatedrecords);
                            getData();
                        }
                    });
                    $('input:checkbox').removeAttr('checked');
                });
            } else {
                $scope.promtmsg = ($scope.general.singlerecorddelete);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                });
            }
        };

        /** INACTIVE SELECTED FOLDER*/
        $scope.deactiveAll = function () {
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ($scope.general.inactivaterecords);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('cat' + value.iPkDocCatId)) {
                            if (document.getElementById('cat' + value.iPkDocCatId).checked == true) {
                                allrecords.push(value.iPkDocCatId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'documentCategory/changeStatusAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.inactivatedrecords);
                            getData();
                        }
                    });
                    $('input:checkbox').removeAttr('checked');
                });
            } else {
                $scope.promtmsg = ($scope.general.singlerecorddelete);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                });
            }
        };
    }]);
