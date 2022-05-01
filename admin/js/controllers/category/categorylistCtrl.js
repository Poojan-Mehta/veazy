'use strict';
/* Controllers */
app.controller('categorylistCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt) {
        $scope.id = localStorage.getItem('aid');
        $scope.rowCollection = [];

        /** GET PRODUCT CATEGORY*/
        getData();
        function getData() {
            $http.get(webservice_path +'category').success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE PRODUCT CATEGORY*/
        $scope.removeItem = function (id, catName) {
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.id,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'category/delete',param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success',catName, res.Message);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }else{
                        toaster.pop('error','',res.Message);
                    }
                });

            });
        };

        /** CHANGE STATUS OF PRODUCT CATEGORY*/
        $scope.changestatus = function (id, eStatus) {
            var param = {
                aid: $scope.id,
                statusId: id,
                status: eStatus
            };
            var status = 'inactive';
            if(eStatus == status){
                status = 'active';
            }
            $scope.promtmsg = ($scope.general.ask +'   ' + status + '   ' + $scope.general.record);
            prompt({
                message: $scope.promtmsg,
                input: false,
                "buttons": [
                    {
                        "label": "Yes",
                        "cancel": false,
                        "primary": false
                    },
                    {
                        "label": "No",
                        "cancel": false,
                        "primary": false
                    }
                ]
            }).then(function (name) {
                if(name.label == 'Yes'){
                    $http.post(webservice_path + 'category/changeStatus',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True'){
                            toaster.pop('success','',$scope.general.changestatus);
                            getData();
                        }
                    });
                }else{
                    getData();
                }
            });
        };

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('cat' + value.iPkVisaCatId)) {
                    if (document.getElementById('cat' + value.iPkVisaCatId).checked == true){
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            $('.catstatus').not(this).not(':disabled').prop('checked', this.checked);
        });

        /** REMOVE SELECTED PRODUCT CATEGORY*/
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
                        if (document.getElementById('cat' + value.iPkVisaCatId)){
                            if (document.getElementById('cat' + value.iPkVisaCatId).checked == true){
                                allrecords.push(value.iPkVisaCatId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'category/deleteAll',param).success(function (res) {
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

        /** ACTIVE SELECTED PRODUCT CATEGORY*/
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
                        if (document.getElementById('cat' + value.iPkVisaCatId)) {
                            if (document.getElementById('cat' + value.iPkVisaCatId).checked == true) {
                                allrecords.push(value.iPkVisaCatId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'category/changeStatusAll',param).success(function (res) {
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

        /** INACTIVE SELECTED PRODUCT CATEGORY*/
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
                        if (document.getElementById('cat' + value.iPkVisaCatId)) {
                            if (document.getElementById('cat' + value.iPkVisaCatId).checked == true) {
                                allrecords.push(value.iPkVisaCatId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'category/changeStatusAll',param).success(function (res) {
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
