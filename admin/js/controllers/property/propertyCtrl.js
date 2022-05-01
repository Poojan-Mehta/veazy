'use strict';
/* Controllers */
app.controller('propertyCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt', 'ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt, ipCookie) {
        $scope.userId = localStorage.getItem('aid');
        $scope.type=$stateParams.type;
        $scope.getformateddate = function (dt) {
            var today = new Date(dt);
            return today;
        };

        getData();
        $scope.rowCollection = [];

        function getData() {
            var param = {
                type: $scope.type,
                aid: $scope.userId
            };
            $http.post(webservice_path + 'property',param).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    if($scope.type == 'verified')
                    {
                        $scope.pagetitle = 'Verified Properties'
                    } else if($scope.type == 'rejected') {
                        $scope.pagetitle = 'Rejected Properties'
                    } else if($scope.type == 'pending') {
                        $scope.pagetitle = 'Requested Properties'
                    } else {
                        $scope.pagetitle = 'All Properties'
                    }

                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        $scope.removeItem = function (id){
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.userId,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'property/delete', param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success', $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }
                });
            });
        };

        $scope.changestatus = function (id, ePropertyStatusV) {
         var param = {
         aid: $scope.userId,
         statusId: id,
         status: ePropertyStatusV
         };
         var status = 'inactive';
         if(ePropertyStatusV == status){
         status = 'active';
         }
         $scope.promtmsg = ("Are you sure want to " + status + " this record?");
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
         if(name.label == 'Yes') {
         $http.post(webservice_path + 'property/changeStatus', param).success(function (res) {
         if (res.StatusCode == '999') {
         $scope.logout();
         toaster.pop('error', '', res.Message);
         } else if (res.Status == 'True') {
         toaster.pop('success', '', 'Status changed successfully');
         getData();
         }
         });
         }else{
         getData();
         }
         });
         };

        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Property Relation": value.ePropertyUsertype,
                    "Property Type":value.iFkPropertyTypeId,
                    "Property For": value.ePropertyFor,
                    "Property Post Date": value.vPropertyPostDate,
                    "Status" : value.ePropertyStatusV

                });
            });
            return data;
        };

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('property' + value.iPkPropertyId)) {
                    if (document.getElementById('property' + value.iPkPropertyId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".propertystatus").prop('checked', this.checked);
        });

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
                        if (document.getElementById('property' + value.iPkPropertyId)){
                            if (document.getElementById('property' + value.iPkPropertyId).checked == true){
                                allrecords.push(value.iPkPropertyId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'property/deleteAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
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

        $scope.activeAll = function () {
         var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ("Are you sure want to active selected records?");
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('property' + value.iPkPropertyId)) {
                            if (document.getElementById('property' + value.iPkPropertyId).checked == true) {
                                allrecords.push(value.iPkPropertyId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'property/changeStatusAll', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == 'True') {
                            toaster.pop('success', '', 'Selected records are active successfully');
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

        $scope.verifyAll = function () {
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ("Are you sure want to Verify selected records?");
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('property' + value.iPkPropertyId)) {
                            if (document.getElementById('property' + value.iPkPropertyId).checked == true) {
                                allrecords.push(value.iPkPropertyId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'property/verifyAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','','Selected records are Verified successfully');
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

         $scope.deactiveAll = function () {
         var selectcondition = $scope.checkSelection();

         if (selectcondition == 1) {
             $scope.promtmsg = ("Are you sure want to inactive selected records?");
             prompt({
                 message: $scope.promtmsg,
                 input: false
             }).then(function (name) {
                 var allrecords = [];
                 angular.forEach($scope.rowCollection, function (value, key) {
                     if (document.getElementById('property' + value.iPkPropertyId)) {
                         if (document.getElementById('property' + value.iPkPropertyId).checked == true) {
                             allrecords.push(value.iPkPropertyId);
                         }
                     }
                 });
                 var param = {
                     aid: $scope.userId,
                     status: 'active',
                     selectedIds: allrecords
                 };
                 $http.post(webservice_path + 'property/changeStatusAll', param).success(function (res) {
                     if (res.StatusCode == '999') {
                         $scope.logout();
                         toaster.pop('error', '', res.Message);
                     } else if (res.Status == 'True') {
                         toaster.pop('success', '', 'Selected records are inactive successfully');
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

        $scope.rejectAll = function () {
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ("Are you sure want to Reject selected records?");
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('property' + value.iPkPropertyId)) {
                            if (document.getElementById('property' + value.iPkPropertyId).checked == true) {
                                allrecords.push(value.iPkPropertyId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        status:'verified',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'property/verifyAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','','Selected records are Rejected successfully');
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