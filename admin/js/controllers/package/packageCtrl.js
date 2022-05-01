'use strict';
/* Controllers */
app.controller('packageCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt', 'ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt, ipCookie) {

        $scope.userId = localStorage.getItem('aid');

        getData();
        $scope.rowCollection = [];

        /**
         * @method getData return all packages
         */
        function getData() {
            $http.get(webservice_path + 'package?aid=' + $scope.userId).success(function (res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if(res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                }
            });
        }
        $scope.displayedCollection = [].concat($scope.rowCollection);

        /**
         * @method removeItem remove product from listing
         * @param id is belong to product id
         * @param vPackName is belong to Product name
         */

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
                    $http.post(webservice_path + 'package/changevisiblity', param).success(function (res) {
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



        $scope.removeItem = function (id, vPackName){
            $scope.promtmsg = 'Are you sure want to permanently remove this product?';
            var param = {
                userId: $scope.userId,
                productId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false,
                "buttons": [
                    {"label": "Yes", "cancel": false, "primary": false},
                    {"label": "No", "cancel": false, "primary": false}
                ]
            }).then(function (name) {
                if(name.label == 'Yes') {
                    $http.post(webservice_path + 'package/delete', param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success',vPackName, res.Message);
                            $('input:checkbox').removeAttr('checked');
                            getData();
                        }
                        if(res.StatusCode == 0){
                            toaster.pop('error',vPackName, res.Message);
                        }
                    });
                }
            });
        };

        /**
         * @method changestatus change the status of product
         * @param id (Product ID)
         * @param eStatus ('active'/'inactive')
         */
        $scope.changestatus = function (id, eStatus) {
            var status = 'inactive';
            var param = { userId: $scope.userId, productId: id, status: eStatus};

            if(eStatus == status){
                status = 'active';
            }
            $scope.promtmsg = ("Are you sure want to " + status + " this product?");

            prompt({
                message: $scope.promtmsg,
                input: false,
                "buttons": [
                    {"label": "Yes", "cancel": false, "primary": false},
                    {"label": "No", "cancel": false, "primary": false}
                ]
            }).then(function (name) {
                if(name.label == 'Yes') {
                    $http.post(webservice_path + 'package/changeStatus', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == 'True') {
                            toaster.pop('success', '', res.Message);
                            getData();
                        }
                    });
                }else {
                    getData();
                }
            });
        };

        $scope.getcsv = function () {
            var data = [];
            angular.forEach($scope.rowCollection, function (value, key) {
                data.push({
                    "Market Place": value.vMPName,
                    "Product Name": value.vVisaProductTitle,
                    "Product Fee": value.eVisaproductFee
                });
            });
            return data;
        };

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('package' + value.iPkVisaProductId)) {
                    if (document.getElementById('package' + value.iPkVisaProductId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            $('.packagestatus').not(this).not(':disabled').prop('checked', this.checked);
        });

        $scope.removeAll = function (){
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = 'Are you sure want to permanently delete selected products?';
                prompt({
                    message: $scope.promtmsg,
                    input: false,
                    "buttons": [
                        {"label": "Yes", "cancel": false, "primary": false},
                        {"label": "No", "cancel": false, "primary": false}
                    ]
                }).then(function (name) {
                    if(name.label == 'Yes') {
                        var allrecords = [];
                        angular.forEach($scope.rowCollection, function (value, key) {
                            if (document.getElementById('package' + value.iPkVisaProductId)) {
                                if (document.getElementById('package' + value.iPkVisaProductId).checked == true) {
                                    allrecords.push(value.iPkVisaProductId);
                                }
                            }
                        });
                        var param = {
                            userId: $scope.userId,
                            productIds: allrecords
                        };
                        $http.post(webservice_path + 'package/deleteAll',param).success(function (res) {
                            if (res.StatusCode == '999'){
                                $scope.logout();
                                toaster.pop('error','',res.Message);
                            }else if (res.Status == 'True') {
                                toaster.pop('success','',res.Message);
                                getData();
                            }
                        });
                        $('input:checkbox').removeAttr('checked');
                    }
                });
            } else {
                $scope.promtmsg = 'Select atleast one product to delete';
                prompt({
                    message: $scope.promtmsg,
                    input: false
                });
            }
        };

        $scope.activeAll = function () {
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = 'Are you sure want to activate selected products?';
                prompt({
                    message: $scope.promtmsg,
                    input: false,
                    "buttons": [
                        {"label": "Yes", "cancel": false, "primary": false},
                        {"label": "No", "cancel": false, "primary": false}
                    ]
                }).then(function (name) {
                    if(name.label == 'Yes') {
                        var allrecords = [];
                        angular.forEach($scope.rowCollection, function (value, key) {
                            if (document.getElementById('package' + value.iPkVisaProductId)) {
                                if (document.getElementById('package' + value.iPkVisaProductId).checked == true) {
                                    allrecords.push(value.iPkVisaProductId);
                                }
                            }
                        });
                        var param = {
                            userId: $scope.userId,
                            status: 'inactive',
                            productIds: allrecords
                        };
                        $http.post(webservice_path + 'package/changeStatusAll',param).success(function (res) {
                            if (res.StatusCode == '999'){
                                $scope.logout();
                                toaster.pop('error','',res.Message);
                            }else if (res.Status == 'True') {
                                toaster.pop('success','',res.Message);
                                getData();
                            }
                        });
                        $('input:checkbox').removeAttr('checked');
                    }
                });
            } else {
                $scope.promtmsg = 'Select atleast one product to activate';
                prompt({
                    message: $scope.promtmsg,
                    input: false
                });
            }
        };

        $scope.deactiveAll = function () {
            var selectcondition = $scope.checkSelection();

            if (selectcondition == 1) {
                $scope.promtmsg = 'Are you sure want to inactivate selected products?';
                prompt({
                    message: $scope.promtmsg,
                    input: false,
                    "buttons": [
                        {"label": "Yes", "cancel": false, "primary": false},
                        {"label": "No", "cancel": false, "primary": false}
                    ]
                }).then(function (name) {
                    if(name.label == 'Yes') {
                        var allrecords = [];
                        angular.forEach($scope.rowCollection, function (value, key) {
                            if (document.getElementById('package' + value.iPkVisaProductId)) {
                                if (document.getElementById('package' + value.iPkVisaProductId).checked == true) {
                                    allrecords.push(value.iPkVisaProductId);
                                }
                            }
                        });
                        var param = {
                            userId: $scope.userId,
                            status: 'active',
                            productIds: allrecords
                        };
                        $http.post(webservice_path + 'package/changeStatusAll',param).success(function (res) {
                            if (res.StatusCode == '999'){
                                $scope.logout();
                                toaster.pop('error','',res.Message);
                            }else if (res.Status == 'True') {
                                toaster.pop('success','',res.Message);
                                getData();
                            }
                        });
                        $('input:checkbox').removeAttr('checked');
                    }
                });
            } else {
                $scope.promtmsg = 'Select atleast one product to inactivate';
                prompt({
                    message: $scope.promtmsg,
                    input: false
                });
            }
        };

    }]);