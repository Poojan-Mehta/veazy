'use strict';

/* Controllers */
app.controller('lessionCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster','ipCookie','$modal','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster,ipCookie,$modal,prompt) {

        $scope.sliderId = localStorage.getItem('aid');
        $scope.path='../api/webroot/videos/thumbnail/';
        $scope.tok = ipCookie('tok');

        $scope.getformateddate = function (dt) {
            var today = new Date(dt);
            return today;
        };

        getData();
        $scope.rowCollection = [];

        /** GET LESSON DATA*/
        function getData() {

            $http.get(webservice_path + 'lession/index').success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }

        /** ON BLUR PRIORITY CHANGE */
        $scope.onBlur = function($event,pid,prio) {            
            var paramd = {
                pid: pid,
                prio: prio
            };
            if(paramd.prio != undefined){
                $http.post(webservice_path + 'lession/changePriority', paramd).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success','','Priority has been Changed');
                        getData();
                    }
                });
            }  
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
                        if (document.getElementById('slider' + value.iPkLessonId)) {
                            if (document.getElementById('slider' + value.iPkLessonId).checked == true) {
                                allrecords.push(value.iPkLessonId);
                            }
                        }
                    });

                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'lession/createduplicate', param).success(function (res) {
                        if (res.Status == 'True') {                            
                            toaster.pop('success', '', $scope.general.createdduplicate);
                            getData();
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

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE PERTICULAR LESSON*/
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
                $http.post(webservice_path + 'lession/delete', param).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success',vUserName, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }
                });
            });
        };

        /**CHANGE LESSON*/
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
                    $http.post(webservice_path + 'lession/changeStatus',param).success(function (res) {
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

        /** GET LESSON DATA IN CSV*/
        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Slider Image Title": value.vLessonTitle,
                    "Slider Image Description": value.vLessonDescription,
                    "Slider Image": value.dtLessonCreatedDate,
                    "Slider Image Website Link": value.eLessonStatus

                });
            });
            return data;
        };

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('slider' + value.iPkLessonId)) {
                    if (document.getElementById('slider' + value.iPkLessonId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".sliderstatus").prop('checked', this.checked);
        });

        /** REMOVE MULTIPLE LESSON ID WISE*/
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

                        if (document.getElementById('slider' + value.iPkLessonId)){
                            if (document.getElementById('slider' + value.iPkLessonId).checked == true){
                                allrecords.push(value.iPkLessonId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'lession/deleteAll',param).success(function (res) {
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

        /** ACTIVE ALL LESSON*/
        $scope.activeAll = function () {

            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ('Are you sure want to active selected records!');
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('slider' + value.iPkLessonId)) {
                            if (document.getElementById('slider' + value.iPkLessonId).checked == true) {
                                allrecords.push(value.iPkLessonId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'lession/changeStatusAll',param).success(function (res) {
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

        /** INACTIVE ALL LESSON*/
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
                        if (document.getElementById('slider' + value.iPkLessonId)) {
                            if (document.getElementById('slider' + value.iPkLessonId).checked == true) {
                                allrecords.push(value.iPkLessonId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.sliderId,
                        token: $scope.tok,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'lession/changeStatusAll',param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success','','selected record are inactive successfully');
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