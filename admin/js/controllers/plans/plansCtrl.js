'use strict';

/* Controllers */
app.controller('plansCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster','ipCookie','$modal','prompt',
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
        $scope.view = [];

        /** GET Plans */
        function getData() {            
            $http.get(webservice_path + 'plans?aid=' + $scope.sliderId +'&token=' + $scope.tok).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){

                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        $scope.view = function(id)
        {
            var param = {
                id:id
            };
            $http.post(webservice_path + 'plans/view', param).success(function (res){
                if (res.StatusCode == '1'){
                    $scope.viewplan = res.Response;
                    if($scope.viewplan.AllowDC == ''){
                        $scope.viewplan.AllowDC = 'No';
                    }
                    if($scope.viewplan.AllowLessons == ''){
                        $scope.viewplan.AllowLessons = 'No';
                    }
                    if($scope.viewplan.AllowTemplates == ''){
                        $scope.viewplan.AllowTemplates = 'No';
                    }
                    if($scope.viewplan.Pro_Features == ''){
                        $scope.viewplan.Pro_Features = 'No';
                    }
                    console.log(res.Response);
                }
            });
            $scope.viewModal = $modal.open({
                animation: true,
                templateUrl: "viewModal.html",
                scope:$scope,
                size: 's',
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.cancelViewModal = function(){

            $scope.viewModal.dismiss();
        };
        

        /** REMOVE Plan*/
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
                $http.post(webservice_path + 'plans/delete', param).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success',vUserName, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }else{
                        toaster.pop('error',res.Message);
                    }
                });
            });
        };

        /** CHANGE STATUS OF Plan*/
        $scope.changestatus = function (id, eStatus) {
            var param = {
                aid: $scope.sliderId,
                token: $scope.tok,
                pid: id,
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
                    $http.post(webservice_path + 'plans/changeStatus',param).success(function (res) {
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

        /** CHANGE STATUS OF MARKET PLACE */
        $scope.changevisiblity = function (id, eStatus) {
            var param = {
                aid: $scope.id,
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
                    $http.post(webservice_path + 'plans/changevisiblity', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == 'True') {
                            toaster.pop('success', '', $scope.general.changestatus);
                            getData();
                        }
                    });
                } else {
                    getData();
                }
            });
        };

        /** GET Plan DETAILS IN CSV FORMAT*/
        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Slider Image Title": value.Plan_names,
                    "Created Date": value.dtCreatedOn,
                    "Status": value.ePlanStatus

                });
            });
            return data;
        };       

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('slider' + value.iPkPlanId)) {
                    if (document.getElementById('slider' + value.iPkPlanId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            $('.sliderstatus').not(this).not(':disabled').prop('checked', this.checked);
        });

        /** REMOVE SELECTED Plan*/
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

                        if (document.getElementById('slider' + value.iPkPlanId)){
                            if (document.getElementById('slider' + value.iPkPlanId).checked == true){
                                allrecords.push(value.iPkPlanId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'plans/deleteAll',param).success(function (res) {
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

        /** ACTIVE SELECTED Plan */
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
                        if (document.getElementById('slider' + value.iPkPlanId)) {
                            if (document.getElementById('slider' + value.iPkPlanId).checked == true) {
                                allrecords.push(value.iPkPlanId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'plans/changeStatusAll',param).success(function (res) {
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

        /** DEACTIVE SELECTED Plan*/
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
                        if (document.getElementById('slider' + value.iPkPlanId)) {
                            if (document.getElementById('slider' + value.iPkPlanId).checked == true) {
                                allrecords.push(value.iPkPlanId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'plans/changeStatusAll',param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.inactivated);
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