'use strict';
/* Controllers */
app.controller('rolelistCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt) {
        $scope.id = localStorage.getItem('aid');
        $scope.rowCollection = [];
        getData();
	
        /** GET PERMISSION DETAILS*/
        function getData() {
            $http.get(webservice_path +'permission').success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE PERMISSION*/
        $scope.removeItem = function (id, vRolName) {
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.id,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'permission/delete',param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success',vRolName, res.Message);
                        $('input:checkbox').removeAttr('checked');
                        getData();
                    }else{
                        toaster.pop('error','',res.Message);
                    }
                });

            });
        };

        $scope.checkSelection = function (){
            var suc = 0;
            angular.forEach($scope.rowCollection, function (value, key) {
                if (document.getElementById('role' + value.iPkRoleId)) {
                    if (document.getElementById('role' + value.iPkRoleId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            jQuery(".rolestatus").prop('checked', this.checked);
        });

        /** REMOVE SELECTED PERMISSION*/
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
                        if (document.getElementById('role' + value.iPkRoleId)){
                            if (document.getElementById('role' + value.iPkRoleId).checked == true){
                                allrecords.push(value.iPkRoleId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'permission/deleteAll',param).success(function (res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            toaster.pop('success','',$scope.general.removesuccess);
                            getData();
                        }else{
                            toaster.pop('error','',res.Message);
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
