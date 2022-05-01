'use strict';
/* Controllers */
app.controller('advertiseCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt', 'ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt, ipCookie) {

        $scope.userId = localStorage.getItem('aid');

        $scope.getformateddate = function (dt) {
            var today = new Date(dt);
            return today;
        };

        getData();
        $scope.rowCollection = [];

        /** GET ADVETISMENT DETAILS*/
        function getData() {
            $http.get(webservice_path + 'advertisement?aid=' + $scope.userId).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE ADVERTISEMENT*/
        $scope.removeItem = function (id, vPostTitle){
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.userId,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'advertisement/delete', param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success',vPostTitle, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }
                });
            });
        };

        /*$scope.changestatus = function (id, eStatus) {
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
                if(name.label == 'Yes') {
                    $http.post(webservice_path + 'advertisement/changeStatus', param).success(function (res) {
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
        };*/

        /** GET CSV FOR ADVERTISMENT*/
        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Post Title": value.vPostTitle,
                    "Website Link":value.vUsersAdWebsiteLink,
                    "Post Type": value.ePostType,
                    "Created Date": value.dtPostDate

                });
            });
            return data;
        };

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('adt' + value.iPkPostId)) {
                    if (document.getElementById('adt' + value.iPkPostId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".adtstatus").prop('checked', this.checked);
        });

        /** REMOVE SELECTED ADVERTICE*/
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
                        if (document.getElementById('adt' + value.iPkPostId)){
                            if (document.getElementById('adt' + value.iPkPostId).checked == true){
                                allrecords.push(value.iPkPostId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'advertisement/deleteAll',param).success(function (res) {
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

        /*$scope.activeAll = function () {
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = ("Are you sure want to active selected records?");
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    var allrecords = [];
                    angular.forEach($scope.rowCollection, function (value, key) {
                        if (document.getElementById('adt' + value.iPkPostId)) {
                            if (document.getElementById('adt' + value.iPkPostId).checked == true) {
                                allrecords.push(value.iPkPackId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        status:'inactive',
                        selectedIds: allrecordsadvertisement
                    };
                    $http.post(webservice_path + 'adt/changeStatusAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {advertisement
                            toaster.pop('success','','Selected records are active successfully');
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
                        if (document.getElementById('adt' + value.iPkPostId)) {
                            if (document.getElementById('adt' + value.iPkPostId).checked == true) {
                                allrecords.push(value.iPkPostId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'advertisement/changeStatusAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','','Selected records are inactive successfully');
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
        };*/

    }]);