'use strict';

/* Controllers */
app.controller('homesliderCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster','ipCookie','$modal','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster,ipCookie,$modal,prompt) {

        $scope.sliderId = localStorage.getItem('aid');
        $scope.tok = ipCookie('tok');
        $scope.iPkFolderId = "";
        var allbids = [];

        /* SUMMARY INDEX START */
        getData();
        function getData() {
            $http.get(webservice_path + 'homeslider').success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
                if (res.StatusCode == '999') {
                    $scope.logout();
                    toaster.pop('error', '', res.Message);
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** ON BLUR PRIORITY CHANGE */
        $scope.onBlur = function($event,pid,prio) {            
            var paramd = {
                pid: pid,
                prio: prio
            };
            if(paramd.prio != undefined){
                $http.post(webservice_path + 'homeslider/changePriority', paramd).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success','','Priority has been Changed');
                        $scope.SearchbyCriteria();
                    }
                });
            }              
        }

        /* DROPDOWN FOLDER & SUMMARY CATEGORY */
        getFolder();
        function getFolder() {
            $scope.type = 'summary';
            var paramd = {
                eType: $scope.type
            };
            $http.post(webservice_path + 'folder/getFolder', paramd).success(function (res) {
                if (res.Status == 'True') {
                    $scope.getFolder = res.Response;
                }
            });
        }

        /** GET CATEGORY IN ORDER TO CHANGE FOLDER*/
        $scope.getCategoryData = function (id) {
            $scope.iDocumentCategoryId = '';
            $scope.getDocumentCategory = '';
            $scope.type = 'summary';
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
            $http.post(webservice_path + 'homeslider/getSearchData', param).success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        };

        /* DROPDOWN FOLDER & SUMMARY CATEGORY END */

        /** BULK ALLOCATION CODE START */
        $scope.addTag = function()
        {
            var selectcondition = $scope.checkSelection();
            
            if (selectcondition == 1) {        
                
                angular.forEach($scope.rowCollection, function (value, key) {
                    if (document.getElementById('slider' + value.iPkSummaryId)) {
                        if (document.getElementById('slider' + value.iPkSummaryId).checked == true) {
                            allbids.push(value.iPkSummaryId);
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
            $http.post(webservice_path + 'homeslider/bulkallocation', param).success(function (res) {
                if (res.Status == 'True') {                            
                    toaster.pop('success', '', $scope.general.createbulkallocation);                           
                    $scope.SearchbyCriteria();                            
                }
            });
            $('input:checkbox').removeAttr('checked');           

            $scope.addTagModal.dismiss();                        
        };

        /** BULK ALLOCATION CODE END */

        /** REMOVE SUMMARY*/
        $scope.removeItem = function (id, vUserName) {
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
                $http.post(webservice_path + 'homeslider/delete', param).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success', vUserName, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        $scope.SearchbyCriteria();
                    }
                });
            });
        };

        /** CHAGNE STATUS */
        $scope.changestatus = function (id, eStatus) {
            var param = {
                aid: $scope.sliderId,
                token: $scope.tok,
                statusId: id,
                status: eStatus
            };
            var status = 'inactive';
            if (eStatus == status) {
                status = 'active';
            }
            $scope.promtmsg = ($scope.general.ask + '   ' + status + '   ' + $scope.general.record);
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
                if (name.label == 'Yes') {
                    $http.post(webservice_path + 'homeslider/changeStatus', param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success', '', $scope.general.changestatus);
                            $scope.SearchbyCriteria();
                        }
                    });
                } else {
                    $scope.SearchbyCriteria();
                }
            });
        };

        /** GET DATA IN CSV FORMAT*/
        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Title": value.vSummaryTitle,
                    "Description": value.vSummaryDescription,
                    "Created Date": value.dtSummaryCreatedDate,
                    "Status": value.eSummaryStatus
                });
            });
            return data;
        };

        $scope.checkSelection = function () {
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('slider' + value.iPkSummaryId)) {
                    if (document.getElementById('slider' + value.iPkSummaryId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".sliderstatus").prop('checked', this.checked);
        });

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
                        if (document.getElementById('slider' + value.iPkSummaryId)) {
                            if (document.getElementById('slider' + value.iPkSummaryId).checked == true) {
                                allrecords.push(value.iPkSummaryId);
                            }
                        }
                    });

                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'homeslider/createduplicate', param).success(function (res) {
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

        /** REMOVE MULTIPLE SUMMARY*/
        $scope.removeAll = function () {
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ($scope.general.removerecords);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {

                        if (document.getElementById('slider' + value.iPkSummaryId)) {
                            if (document.getElementById('slider' + value.iPkSummaryId).checked == true) {
                                allrecords.push(value.iPkSummaryId);
                            }
                        }
                    });

                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'homeslider/deleteAll', param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success', '', $scope.general.removesuccess);
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

        /** ACTIVE ALL SUMMARY */
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
                        if (document.getElementById('slider' + value.iPkSummaryId)) {
                            if (document.getElementById('slider' + value.iPkSummaryId).checked == true) {
                                allrecords.push(value.iPkSummaryId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'homeslider/changeStatusAll', param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success', '', $scope.general.activatedrecords);
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

        /** INACTIVE ALL SUMMARY*/
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
                        if (document.getElementById('slider' + value.iPkSummaryId)) {
                            if (document.getElementById('slider' + value.iPkSummaryId).checked == true) {
                                allrecords.push(value.iPkSummaryId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status: 'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'homeslider/changeStatusAll', param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success', '', $scope.general.inactivatedrecords);
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