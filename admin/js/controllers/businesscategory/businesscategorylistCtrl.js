'use strict';
/* Controllers */
app.controller('businessdoccategorylistCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt) {
        $scope.id = localStorage.getItem('aid');
        $scope.rowCollection = [];
        $scope.type='document';

        /** GET DOCUMENT CATEGORY DETAILS*/
        getData();
        function getData() {
            var paramd = {type:$scope.type};
            $http.post(webservice_path +'documentCategory',paramd).success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** GET FOLDER BY TYPE*/
        getFolder();
        function getFolder() {
            var paramd = { eType:$scope.type };
            $http.post(webservice_path + 'folder/getFolder',paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** CREATE DUPLICATE OF SELECTED RECORD */
        $scope.duplicate = function () {
            alert('hello');
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ($scope.general.duplicate);
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
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    
                    $http.post(webservice_path + 'documentCategory/createduplicate', param).success(function (res) {
                        if (res.Status == 'True') {                            
                            toaster.pop('success', '', $scope.general.createdduplicate);                            
                            $scope.SearchbyCriteria();                            
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

        /** ON BLUR PRIORITY CHANGE */
        $scope.onBlur = function($event,pid,prio) {            
            var paramd = {
                pid: pid,
                prio: prio,
                type: $scope.type
            };
            $http.post(webservice_path + 'documentCategory/changePriority', paramd).success(function (res) {
                if (res.Status == 'True') {
                    toaster.pop('success','','Priority has been Changed');
                    $scope.SearchbyCriteria();
                }
            });  
        };

        /** SERCH FOLDER DATA BY ID & TYPE*/
        $scope.SearchbyCriteria = function () {
            if($scope.iPkFolderId != null || $scope.iPkFolderId != undefined){
                var param = {iPkFolderId:$scope.iPkFolderId, type:$scope.type};
                $http.post(webservice_path + 'homeslider/getFolderData' , param).success(function (res) {
                    if (res.Status == 'True'){
                        $scope.rowCollection = res.Response;
                    }
                });
            }else{
                getData();
            }
        };
        $scope.SearchbyCriteria();

        /** REMOVE DOCUMENT CATEGORY*/
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
                $http.post(webservice_path + 'documentCategory/delete',param).success(function (res) {
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

        /** CHANGE STATUS OF DOCUMENT CATEGORY*/
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
                    $http.post(webservice_path + 'documentCategory/changeStatus',param).success(function (res) {
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
                if (document.getElementById('cat' + value.iPkDocCatId)) {
                    if (document.getElementById('cat' + value.iPkDocCatId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            $('.catstatus').not(this).not(':disabled').prop('checked', this.checked);
        });

        /** REMOVE SELECTED DOCUMENT CATEGORY*/
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
                        if (document.getElementById('cat' + value.iPkDocCatId)){
                            if (document.getElementById('cat' + value.iPkDocCatId).checked == true){
                                allrecords.push(value.iPkDocCatId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'documentCategory/deleteAll',param).success(function (res) {
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

        /** ACTIVE SELECTED DOCUMENT CATEGORY*/
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

        /** INACTIVE SELECTED DOCUMENT CATEGORY*/
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
