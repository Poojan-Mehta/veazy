'use strict';
/* Controllers */
app.controller('mplaceCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt) {
        $scope.id = localStorage.getItem('aid');
        $scope.rowCollection = [];
        $scope.type = "product";

        /** GET MARKETPLACE DETAILS */
        function getData() {
            var paramd = {
                eType: $scope.type
            };
            $http.post(webservice_path + 'marketplace', paramd).success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }

        getData();

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE MARKETPLACE*/
        $scope.removeItem = function (id, vMPName) {
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.id,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'marketplace/delete', param).success(function (res) {
                    if (res.StatusCode == '999') {
                        $scope.logout();
                        toaster.pop('error', '', res.Message);
                    } else if (res.Status == 'True') {
                        toaster.pop('success', vMPName, res.Message);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    } else {
                        toaster.pop('error', '', res.Message);
                    }
                });

            });
        };

        /** CHANGE STATUS OF MARKET PLACE */
        $scope.changestatus = function (id, eStatus) {
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
                    $http.post(webservice_path + 'marketplace/changeStatus', param).success(function (res) {
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

        $scope.checkSelection = function () {
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('cat' + value.iPKMPId)) {
                    if (document.getElementById('cat' + value.iPKMPId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            $('.catstatus').not(this).not(':disabled').prop('checked', this.checked);
        });

        /** REMOVE SELECTED MARKETPLACE*/
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
                        if (document.getElementById('cat' + value.iPKMPId)) {
                            if (document.getElementById('cat' + value.iPKMPId).checked == true) {
                                allrecords.push(value.iPKMPId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'marketplace/deleteAll', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == 'True') {
                            toaster.pop('success', '', $scope.general.removesuccess);
                            getData();
                        } else {
                            toaster.pop('error', '', res.Message);
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

        /** ACTIVE SELECTED MARKETPLACE*/
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
                        if (document.getElementById('cat' + value.iPkDocCatId)) {
                            if (document.getElementById('cat' + value.iPkDocCatId).checked == true) {
                                allrecords.push(value.iPkDocCatId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        status: 'inactive',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'documentCategory/changeStatusAll', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == 'True') {
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

        /** DEACTIVATE SELECTED MARKETPLACE*/
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
                        if (document.getElementById('cat' + value.iPkDocCatId)) {
                            if (document.getElementById('cat' + value.iPkDocCatId).checked == true) {
                                allrecords.push(value.iPkDocCatId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        status: 'active',
                        selectedIds: allrecords
                    };
                    $http.post(webservice_path + 'documentCategory/changeStatusAll', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == 'True') {
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
