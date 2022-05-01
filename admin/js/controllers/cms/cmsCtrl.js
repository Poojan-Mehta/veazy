'use strict';
/* Controllers */
app.controller('cmsCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt', 'ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt, ipCookie) {

        $scope.userId = localStorage.getItem('aid');

        getData();
        $scope.rowCollection = [];

        /** GET CMS DETAILS*/
        function getData() {
            $http.get(webservice_path + 'cms?aid=' + $scope.userId).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }
        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** CHAGNE SMS STATUS */
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
                    $http.post(webservice_path + 'cms/changeStatus',param).success(function (res) {
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

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('cms' + value.iPkCmsPageId)) {
                    if (document.getElementById('cms' + value.iPkCmsPageId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };
        jQuery('#checkAll').click(function () {
            jQuery(".cmsstatus").prop('checked', this.checked);
        });

        /** REMOVE CMS DATA*/
        $scope.removeItem = function (id, vCmsPageTitle){
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.userId,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'cms/delete', param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success',vCmsPageTitle, $scope.general.toasterdelete);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }
                });
            });
        };

        /** REMOVE SELECTED CMS DATA */
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

                        if (document.getElementById('cms' + value.iPkCmsPageId)){
                            if (document.getElementById('cms' + value.iPkCmsPageId).checked == true){
                                allrecords.push(value.iPkCmsPageId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        token: $scope.tok,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'cms/deleteAll',param).success(function (res) {
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

        /** ACTIVE SELECTED CMS*/
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
                        if (document.getElementById('cms' + value.iPkCmsPageId)) {
                            if (document.getElementById('cms' + value.iPkCmsPageId).checked == true) {
                                allrecords.push(value.iPkCmsPageId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        token: $scope.tok,
                        status:'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'cms/changeStatusAll',param).success(function (res) {
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

        /** DEACTIVE SELECTED CMS */
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
                        if (document.getElementById('cms' + value.iPkCmsPageId)) {
                            if (document.getElementById('cms' + value.iPkCmsPageId).checked == true) {
                                allrecords.push(value.iPkCmsPageId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.userId,
                        token: $scope.tok,
                        status:'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'cms/changeStatusAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.inactivaterecords);
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