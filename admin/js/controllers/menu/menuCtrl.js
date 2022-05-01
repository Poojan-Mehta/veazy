'use strict';
/* Controllers */
app.controller('menuCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt', 'ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt, ipCookie) {

        $scope.userId = localStorage.getItem('aid');
        $scope.tok = ipCookie('tok');

        getData();
        $scope.rowCollection = [];

        /** GET MENU DETAILS*/
        function getData() {
            $http.get(webservice_path + 'menu?aid=' + $scope.userId +'&token=' + $scope.tok).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }
        $scope.displayedCollection = [].concat($scope.rowCollection);

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('menu' + value.iPkMenuId)) {
                    if (document.getElementById('menu' + value.iPkMenuId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            $('.menustatus').not(this).not(':disabled').prop('checked', this.checked);
        });

        /** ACTIVE SELECTED MENU*/
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
                        if (document.getElementById('menu' + value.iPkMenuId)) {
                            if (document.getElementById('menu' + value.iPkMenuId).checked == true) {
                                allrecords.push(value.iPkMenuId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        token: $scope.tok,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    
                    $http.post(webservice_path + 'menu/changeStatusAll',param).success(function (res) {
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

        /** CHANGE STATUS OF MENU*/
        $scope.changestatus = function (id, eStatus) {
            var param = {
                aid: $scope.userId,
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
                    $http.post(webservice_path + 'menu/changeStatus',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True'){
                            toaster.pop('success','',$scope.general.changestatus);
                            getData();
                        }
                    });
                }else{
                    getData();
                }
            });
        };

        /** DEACTIVE SELECTED MENU*/
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
                        if (document.getElementById('menu' + value.iPkMenuId)) {
                            if (document.getElementById('menu' + value.iPkMenuId).checked == true) {
                                allrecords.push(value.iPkMenuId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        token: $scope.tok,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'menu/changeStatusAll',param).success(function (res) {
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

        /** REMOVE SELECTED MENU*/
        $scope.removeItem = function (id, vMenuName){

            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.userId,
                token: $scope.tok,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'menu/delete', param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success','Deleted Successfully');
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    } else {
                        toaster.pop('error','',res.Message);
                    }
                });
            });
        };

        /** REMOVE SELECTED MENU*/
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
                        if (document.getElementById('menu' + value.iPkMenuId)){
                            if (document.getElementById('menu' + value.iPkMenuId).checked == true){
                                allrecords.push(value.iPkMenuId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        token: $scope.tok,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'menu/deleteAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','Deleted Successfully');
                            getData();
                        } else {
                            toaster.pop('error','',res.Message);
                            $state.go($state.current, {}, { reload: true });
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