'use strict';

/* Controllers */
app.controller('faqCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster','ipCookie','$modal','prompt',
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
                $http.post(webservice_path + 'faq/changePriority', paramd).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success','','Priority has been Changed');
                        getData();
                    }
                });
            }  
        };

        /** GET FAQ DETAILS  */
        function getData() {

            $http.get(webservice_path + 'Faq?aid=' + $scope.sliderId +'&token=' + $scope.tok).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }

        /* DROPDOWN FOLDER & SUMMARY CATEGORY */
        getFolder();
        function getFolder() {
            $scope.type = 'faq';
            var paramd = {
                eType: $scope.type
            };
            $http.post(webservice_path + 'folder/getFolder', paramd).success(function (res) {
                if (res.Status == 'True') {
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** BULK ALLOCATION CODE START */
        $scope.addTag = function()
        {
            var selectcondition = $scope.checkSelection();
            
            if (selectcondition == 1) {        
                
                angular.forEach($scope.rowCollection, function (value, key) {
                    if (document.getElementById('slider' + value.iPkFAQId)) {
                        if (document.getElementById('slider' + value.iPkFAQId).checked == true) {
                            allbids.push(value.iPkFAQId);
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

        $scope.saveTagName = function(fid){    
            
            var param = {
                fid:fid,                
                selectedIds: allbids
            };
            $http.post(webservice_path + 'faq/bulkallocation', param).success(function (res) {
                if (res.Status == 'True') {                            
                    toaster.pop('success', '', $scope.general.createbulkallocation);                           
                    getData();                           
                }
            });
            $('input:checkbox').removeAttr('checked');           

            $scope.addTagModal.dismiss();                        
        };

        /** BULK ALLOCATION CODE END */

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
                        if (document.getElementById('slider' + value.iPkFAQId)) {
                            if (document.getElementById('slider' + value.iPkFAQId).checked == true) {
                                allrecords.push(value.iPkFAQId);
                            }
                        }
                    });

                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'faq/createduplicate', param).success(function (res) {
                        if (res.Status == 'True') {                            
                            toaster.pop('success', '', $scope.general.createdduplicate);
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

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE FAQ */
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
                $http.post(webservice_path + 'Faq/delete', param).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success',vUserName, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }
                });
            });
        };

        /** CHANGE FAQ STATUS*/
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
                    $http.post(webservice_path + 'Faq/changeStatus',param).success(function (res) {
                        if (res.Status == 'True'){
                            toaster.pop('success','',$scope.general.changestatus);
                            getData();
                        }
                    });
                }else{
                    getData();
                }
            });
        };

        /** GET FAQ DETAILS IN CSV FORMATE*/
        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "FAQ": value.vFAQ,
                    "Answer": value.vFAQAnswer,
                    "dtFAQCreatedOn": value.dtFAQCreatedOn,
                    "eFAQStatus": value.eFAQStatus,

                });
            });
            return data;
        };


        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('slider' + value.iPkFAQId)) {
                    if (document.getElementById('slider' + value.iPkFAQId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".sliderstatus").prop('checked', this.checked);
        });

        /** REMOVE SELECTED FAQ*/
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

                        if (document.getElementById('slider' + value.iPkFAQId)){
                            if (document.getElementById('slider' + value.iPkFAQId).checked == true){
                                allrecords.push(value.iPkFAQId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'Faq/deleteAll',param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.removesuccess);
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

        /** ACTIVE SELECTED FAQ*/
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
                        if (document.getElementById('slider' + value.iPkFAQId)) {
                            if (document.getElementById('slider' + value.iPkFAQId).checked == true) {
                                allrecords.push(value.iPkFAQId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'Faq/changeStatusAll',param).success(function (res) {
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

        /** DEACTIVATE SELECTED FAQ*/
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
                        if (document.getElementById('slider' + value.iPkFAQId)) {
                            if (document.getElementById('slider' + value.iPkFAQId).checked == true) {
                                allrecords.push(value.iPkFAQId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'Faq/changeStatusAll',param).success(function (res) {
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