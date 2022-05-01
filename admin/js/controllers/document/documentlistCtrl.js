'use strict';
/* Controllers */
app.controller('docclistCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster','ipCookie','$modal','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster,ipCookie,$modal,prompt) {
        $scope.id = localStorage.getItem('aid');
        $scope.rowCollection = [];
        getData();
        var allbids = [];

        /** GET DOCUMENT DATA*/
        function getData() {
            $http.get(webservice_path +'document').success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }

        /** CREATE DUPLICATE OF SELECTED RECORD */
        $scope.duplicate = function () {

            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ($scope.general.duplicate);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('cat' + value.iPkDocId)) {
                            if (document.getElementById('cat' + value.iPkDocId).checked == true) {
                                allrecords.push(value.iPkDocId);
                            }
                        }
                    });

                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    
                    $http.post(webservice_path + 'document/createduplicate', param).success(function (res) {
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
                prio: prio
            };
            if(paramd.prio != undefined){
                $http.post(webservice_path + 'document/changePriority', paramd).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success','','Priority has been Changed');
                        $scope.SearchbyCriteria();
                    }
                });
            }              
        }

        /** BULK ALLOCATION CODE START */
        $scope.addTag = function()
        {
            var selectcondition = $scope.checkSelection();
            
            if (selectcondition == 1) {        
                
                angular.forEach($scope.rowCollection, function (value, key) {
                    if (document.getElementById('cat' + value.iPkDocId)) {
                        if (document.getElementById('cat' + value.iPkDocId).checked == true) {
                            allbids.push(value.iPkDocId);
                        }
                    }
                });
                $scope.addTagModal = $modal.open({
                    animation: true,
                    templateUrl: "addTag.html",
                    scope:$scope,
                    size: 'sm',
                    backdrop: 'static',
                    keyboard: false
                });   
                
            } else {
                $scope.promtmsg = ($scope.general.singlerecorddelete);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                });
            }

            
        };

        $scope.cancelTagModal = function(){
            $scope.addTagModal.dismiss();
        };

        $scope.saveTagName = function(fid,cid){    
            
            var param = {
                fid:fid,
                cid:cid,
                selectedIds: allbids
            };
            $http.post(webservice_path + 'document/bulkallocation', param).success(function (res) {
                if (res.Status == 'True') {                            
                    toaster.pop('success', '', $scope.general.createbulkallocation);                           
                    $scope.SearchbyCriteria();                            
                }
            });
            $('input:checkbox').removeAttr('checked');           

            $scope.addTagModal.dismiss();                        
        };

        /** BULK ALLOCATION CODE END */

        /* DROPDOWN FOLDER & SUMMARY CATEGORY START */
        getFolder();
        function getFolder() {
            $scope.type='document';
            var paramd = {
                eType:$scope.type
            };
            $http.post(webservice_path + 'folder/getFolder',paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** GET DOCUMENT CATEGORY IN ORDER TO CHANGE FOLDER*/
        $scope.getCategoryData = function (id) {
            $scope.iDocumentCategoryId = '';
            $scope.getDocumentCategory = '';
            $scope.type='document';
            var paramd = {
                type:$scope.type
            };
            $http.post(webservice_path + 'document/getDocumentCategory/' + id , paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.getDocumentCategory = res.Response;
                    $scope.SearchbyCriteria();
                }
            });
        };

        /** SEARCH RESULT IN ORDER TO CHANGE BOTH THE DROPDOWN*/
        $scope.SearchbyCriteria = function () {
            var param = {
                iPkFolderId:$scope.iPkFolderId,
                iDocumentCategoryId: $scope.iDocumentCategoryId
            };
            $http.post(webservice_path + 'document/getSearchData' , param).success(function (res) {
                if (res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        };

        /* DROPDOWN FOLDER & SUMMARY CATEGORY END */

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE DOCUMENT*/
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
                $http.post(webservice_path + 'document/delete',param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success',catName, res.Message);
                        $('input:checkbox').removeAttr('checked');
                        $scope.SearchbyCriteria();
                    }else{
                        toaster.pop('error','',res.Message);
                    }
                });

            });
        };

        /** CHANGE DOCUMENT STATUS*/
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
                    $http.post(webservice_path + 'document/changeStatus',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True'){
                            toaster.pop('success','',$scope.general.changestatus);
                            $scope.SearchbyCriteria();
                        }
                    });
                }else{
                    $scope.SearchbyCriteria();
                }
            });
        };

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('cat' + value.iPkDocId)) {
                    if (document.getElementById('cat' + value.iPkDocId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".catstatus").prop('checked', this.checked);
        });

        /** REMOVE SELECTED DOCUMENT*/
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
                        if (document.getElementById('cat' + value.iPkDocId)){
                            if (document.getElementById('cat' + value.iPkDocId).checked == true){
                                allrecords.push(value.iPkDocId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'document/deleteAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.removesuccess);
                            $scope.SearchbyCriteria();
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

        /** ACTIVE SELECTED DOCUMENT*/
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
                        if (document.getElementById('cat' + value.iPkDocId)) {
                            if (document.getElementById('cat' + value.iPkDocId).checked == true) {
                                allrecords.push(value.iPkDocId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'document/changeStatusAll',param).success(function (res) {
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

        /** DEACTIVE SELECTED DOCUMENT*/
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
                        if (document.getElementById('cat' + value.iPkDocId)) {
                            if (document.getElementById('cat' + value.iPkDocId).checked == true) {
                                allrecords.push(value.iPkDocId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'document/changeStatusAll',param).success(function (res) {
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
