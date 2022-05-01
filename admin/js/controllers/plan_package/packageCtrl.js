'use strict';
/* Controllers */
app.controller('packageCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt) {
        $scope.id = localStorage.getItem('aid');
        $scope.rowCollection = [];
        
        /** GET LESSON FOLDER LIST*/
        function getData() {            
            $http.post(webservice_path +'planpackage').success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }
        getData();

        $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE LESSON FOLDER*/
        $scope.removeItem = function (id, vPackageName) {
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {
                aid: $scope.id,
                deleteId: id
            };
            prompt({
                message: $scope.promtmsg,
                input: false
            }).then(function (name) {
                $http.post(webservice_path + 'planpackage/delete',param).success(function (res) {
                    if (res.StatusCode == '999'){
                        $scope.logout();
                        toaster.pop('error','',res.Message);
                    }else if (res.Status == 'True') {
                        toaster.pop('success',vPackageName, res.Message);
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
                if (document.getElementById('cat' + value.iPkPackageId)) {
                    if (document.getElementById('cat' + value.iPkPackageId).checked == true) {
                        suc = 1;
                    }
                }
            });
            return suc;
        };

        jQuery('#checkAll').click(function () {
            $('.catstatus').not(this).not(':disabled').prop('checked', this.checked);
        });

        /** REMOVE MULTIPLE LESSON FOLDER*/
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
                        if (document.getElementById('cat' + value.iPkPackageId)){
                            if (document.getElementById('cat' + value.iPkPackageId).checked == true){
                                allrecords.push(value.iPkPackageId);
                            }
                        }
                    });
                    var param = {
                        aid: $scope.id,
                        deleteIds: allrecords
                    };
                    $http.post(webservice_path + 'planpackage/deleteAll',param).success(function (res) {
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
