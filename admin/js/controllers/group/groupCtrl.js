'use strict';

/* Controllers */

app.controller('groupCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt','ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt,ipCookie) {


        $scope.GroupId = localStorage.getItem('aid');
        $scope.tok = ipCookie('tok');

        $scope.getformateddate = function (dt) {
            var today = new Date(dt);
            return today;
        };

        getData();
        $scope.rowCollection = [];

        function getData() {
            $http.get(webservice_path + 'group?aid=' + $scope.GroupId +'&token=' + $scope.tok).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        $scope.removeItem = function (id, vUserName){
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.GroupId,
                token: $scope.tok,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'group/delete', param).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success',vUserName, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }
                });
            });
        };

        $scope.changestatus = function (id,GStatus) {
            var param = {
                aid: $scope.GroupId,
                token: $scope.tok,
                statusId: id,
                status: GStatus
            };
            var status = 'inactive';
            if(GStatus == status){
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
                    $http.post(webservice_path + 'group/changeStatus',param).success(function (res) {
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

        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Group Name": value.vGroupName,
                    "Group Description": value.vGroupDescription,
                    "Group Image": value.vGroupImage,
                    "Group Created Date": value.tsGroupTime,
                    "Status": value.eGroupStatus
                });
            });
            return data;
        };


        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('group' + value.iPkGroupId)) {
                    if (document.getElementById('group' + value.iPkGroupId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".groupstatus").prop('checked', this.checked);
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

                        if (document.getElementById('group' + value.iPkGroupId)){
                            if (document.getElementById('group' + value.iPkGroupId).checked == true){
                                allrecords.push(value.iPkGroupId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.GroupId,
                        token: $scope.tok,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'group/deleteAll',param).success(function (res) {
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
                        if (document.getElementById('group' + value.iPkGroupId)) {
                            if (document.getElementById('group' + value.iPkGroupId).checked == true) {
                                allrecords.push(value.iPkGroupId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.GroupId,
                        token: $scope.tok,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'group/changeStatusAll',param).success(function (res) {
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
                        if (document.getElementById('group' + value.iPkGroupId)) {
                            if (document.getElementById('group' + value.iPkGroupId).checked == true) {
                                allrecords.push(value.iPkGroupId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.GroupId,
                        token: $scope.tok,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'group/changeStatusAll',param).success(function (res) {
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