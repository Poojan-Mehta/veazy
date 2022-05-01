'use strict';

/* Controllers */
app.controller('todoCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster','ipCookie','$modal','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster,ipCookie,$modal,prompt) {

        $scope.sliderId = localStorage.getItem('aid');
        $scope.tok = ipCookie('tok');
        var allbids = [];

        $scope.getformateddate = function (dt) {
            var today = new Date(dt);
            return today;
        };

        getData();
        $scope.rowCollection = [];

        /** ON BLUR PRIORITY CHANGE */
        $scope.onBlur = function($event,pid,prio) {            
            var paramd = {
                pid: pid,
                prio: prio
            };
            if(paramd.prio != undefined){
                $http.post(webservice_path + 'todo/changePriority', paramd).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success','','Priority has been Changed');
                        $scope.SearchbyCriteria();
                    }
                });
            }              
        }

        /** ON BLUR PRIORITY CHANGE END */

        /** GET TODO */
        function getData() {

            $http.get(webservice_path + 'todo?aid=' + $scope.sliderId +'&token=' + $scope.tok).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);


        /* DROPDOWN FOLDER & SUMMARY CATEGORY */
        getFolder();
        function getFolder() {
            $scope.type = 'todo';
            var paramd = {
                eType: $scope.type
            };
            $http.post(webservice_path + 'folder/getFolder', paramd).success(function (res) {
                if (res.Status == 'True') {
                    $scope.getFolder = res.Response;
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
                        if (document.getElementById('slider' + value.iPkToDoId)) {
                            if (document.getElementById('slider' + value.iPkToDoId).checked == true) {
                                allrecords.push(value.iPkToDoId);
                            }
                        }
                    });

                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'todo/createduplicate', param).success(function (res) {
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

        /** BULK ALLOCATION CODE START */
        $scope.addTag = function()
        {
            var selectcondition = $scope.checkSelection();
            
            if (selectcondition == 1) {        
                
                angular.forEach($scope.rowCollection, function (value, key) {
                    if (document.getElementById('slider' + value.iPkToDoId)) {
                        if (document.getElementById('slider' + value.iPkToDoId).checked == true) {
                            allbids.push(value.iPkToDoId);
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
            $http.post(webservice_path + 'todo/bulkallocation', param).success(function (res) {
                if (res.Status == 'True') {                            
                    toaster.pop('success', '', $scope.general.createbulkallocation);                           
                    $scope.SearchbyCriteria();                            
                }
            });
            $('input:checkbox').removeAttr('checked');           

            $scope.addTagModal.dismiss();                        
        };

        /** BULK ALLOCATION CODE END */

        /** GET CATEGORY IN ORDER TO CHANGE FOLDER*/
        $scope.getCategoryData = function (id) {
            $scope.iDocumentCategoryId = '';
            $scope.getDocumentCategory = '';
            $scope.type = 'todo';
            var paramd = {
                type: $scope.type
            };
            $http.post(webservice_path + 'document/getDocumentCategory/' + id, paramd).success(function (res) {
                if (res.Status == 'True') {
                    $scope.getDocumentCategory = res.Response;
                    $scope.SearchbyCriteria();
                }
            });
        };

        /** GET SEARCH DATA IN ORDER TO CHANGE FOLDER DROPDOWN AS WELL AS CATEGORY*/
        $scope.SearchbyCriteria = function () {
            var param = {
                iPkFolderId: $scope.iPkFolderId,
                iDocumentCategoryId: $scope.iDocumentCategoryId,
                type: $scope.type
            };
            $http.post(webservice_path + 'todo/getSearchData', param).success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        };

        /* DROPDOWN FOLDER & SUMMARY CATEGORY END */

        /** REMOVE TODO*/
        $scope.removeItem = function (id, vUserName){
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.sliderId,
                token: $scope.tok,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'todo/delete', param).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success',vUserName, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        $scope.SearchbyCriteria();
                    }
                });
            });
        };

        /** CHANGE STATUS OF TODO*/
        $scope.changestatus = function (id, eStatus) {
            var param = {
                aid: $scope.sliderId,
                token: $scope.tok,
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
                    $http.post(webservice_path + 'todo/changeStatus',param).success(function (res) {
                        if (res.Status == 'True'){
                            toaster.pop('success','',$scope.general.changestatus);
                            $scope.SearchbyCriteria();
                        }
                    });
                }else{
                    $scope.SearchbyCriteria();
                }
            });
        };

        /** GET TODO DETAILS IN CSV FORMAT*/
        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Slider Image Title": value.vToDo,
                    "Slider Image": value.dtToDoCreatedOn,
                    "Slider Image Website Link": value.eToDoStatus

                });
            });
            return data;
        };       

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('slider' + value.iPkToDoId)) {
                    if (document.getElementById('slider' + value.iPkToDoId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".sliderstatus").prop('checked', this.checked);
        });

        /** REMOVE SELECTED TODO*/
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

                        if (document.getElementById('slider' + value.iPkToDoId)){
                            if (document.getElementById('slider' + value.iPkToDoId).checked == true){
                                allrecords.push(value.iPkToDoId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'todo/deleteAll',param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.removesuccess);
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

        /** ACTIVE SELECTED TODO */
        $scope.activeAll = function () {

            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ($scope.general.activeracords);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('slider' + value.iPkToDoId)) {
                            if (document.getElementById('slider' + value.iPkToDoId).checked == true) {
                                allrecords.push(value.iPkToDoId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'todo/changeStatusAll',param).success(function (res) {
                        if (res.Status == 'True') {
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

        /** DEACTIVE SELECTED TODO*/
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
                        if (document.getElementById('slider' + value.iPkToDoId)) {
                            if (document.getElementById('slider' + value.iPkToDoId).checked == true) {
                                allrecords.push(value.iPkToDoId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'todo/changeStatusAll',param).success(function (res) {
                        if (res.Status == 'True') {
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