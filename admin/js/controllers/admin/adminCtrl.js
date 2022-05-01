'use strict';
/* Controllers */
app.controller('adminCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt', 'ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt, ipCookie) {

        $scope.userId = localStorage.getItem('aid');

        /** GET ADMIN DATA*/
        getData();
        $scope.rowCollection = [];
        function getData() {
            $http.get(webservice_path + 'admin?aid=' + $scope.userId).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE ADMIN BY ID*/
        $scope.removeItem = function (id, vUserName){
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.userId,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'admin/delete', param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success',vUserName, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }
                });
            });
        };

        /** CHANGE ADMIN STATUS*/
        $scope.changestatus = function (id, eStatus) {
            var param = {
                aid: $scope.userId,
                statusId: id,
                status: eStatus
            };
            var status = 'inactive';
            if(eStatus == status){
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
                if(name.label == 'Yes'){
                    $http.post(webservice_path + 'admin/changeStatus',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True'){
                            getData();
                            toaster.pop('success','',$scope.general.changestatus);
                        }
                    });
                }else{
                    getData();
                }
            });
        };

        /** GET ALL ADMIN CSV*/
        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Role Name": value.vRoleName,
                    "First Name": value.vAdminFirstName,
                    "Last Name": value.vAdminLastName,
                    "Email": value.vAdminEmail,
                    "Mobile": value.vAdminMobile,
                    "Status": value.eAdminStatus,
                    "Created Date": value.dtAdminCreatedOn
                });
            });
            return data;
        };


        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('user' + value.iPkAdminId)) {
                    if (document.getElementById('user' + value.iPkAdminId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".adminstatus").prop('checked', this.checked);
        });

        /** REMOVE SELECTED DATA*/
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
                        if (document.getElementById('user' + value.iPkAdminId)){
                            if (document.getElementById('user' + value.iPkAdminId).checked == true){
                                allrecords.push(value.iPkAdminId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'admin/deleteAll',param).success(function (res) {
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

        /** ACTIVE SELECTED ADMIN DATA*/
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
                        if (document.getElementById('user' + value.iPkAdminId)) {
                            if (document.getElementById('user' + value.iPkAdminId).checked == true) {
                                allrecords.push(value.iPkAdminId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'admin/changeStatusAll',param).success(function (res) {
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

        /** DEACVIVATE SELECTED ADMIN DATA*/
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
                        if (document.getElementById('user' + value.iPkAdminId)) {
                            if (document.getElementById('user' + value.iPkAdminId).checked == true) {
                                allrecords.push(value.iPkAdminId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'admin/changeStatusAll',param).success(function (res) {
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