'use strict';

/* Controllers */

app.controller('geofanceCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt) {


        $scope.getData=function(){
            $http.get(webservice_path +'/gps/index').success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }
        $scope.getData();
        $scope.business=function(){
            $http.get(webservice_path + 'business/index').success(function (res) {
                if (res.Status == 'True') {
                    $scope.bdata = res.Response;
                }
            });
        }
        $scope.business();
        $scope.getSelected=function(status){
            if(status=='active'){
                return true;
            }else{
                return false;
            }
        }
        $scope.bybusiness = function () {
            if($scope.mapping.iBusinessId>0) {
                $http.get(webservice_path + 'gps/bybusiness/' + $scope.mapping.iBusinessId + '.json').success(function (res) {
                    if (res.Status == 'True') {
                        $scope.rowCollection = res.Response;
                    }
                });

                $http.post(webservice_path + 'gps/check_plan_geofence',[{'BusinessId':$scope.mapping.iBusinessId}]).success(function (res) {
                    if (res.Status == 'True') {
                        $scope.isPlanGeo = res.Response;
                    }
                });
            }else{
                $scope.getData();
            }
        }
        $scope.chanagestatus = function (id, eStatus) {
            $scope.eStatus=eStatus;
            $scope.id=id;
            var param = {idd1 : $scope.idd,
                id:$scope.id,
                eStatus:$scope.eStatus
            };
            if(eStatus=='inactive')
            {
                $scope.promtmsg = ($scope.general.activechangestatusmsg);
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    $http.post(webservice_path +'gps/changestatusinactive/' + id + '.json',param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success', 'Geofence', $scope.general.activeted);
                            $scope.getData();
                            $scope.mapping.iBusinessId=0;
                        }

                    });
                },function(){
                    $scope.getData();
                });
            }
            else
            {
                $scope.promtmsg = ($scope.general.inactivechangestatusmsg);
                $scope.eStatus=eStatus;
                $scope.id=id;
                var param = {idd1 : $scope.idd,
                    id:$scope.id,
                    eStatus:$scope.eStatus
                };
                prompt({
                    message: $scope.promtmsg,
                    input: false
                }).then(function (name) {
                    $http.post(webservice_path +'gps/changestatusactive/' + id + '.json',param).success(function (res) {
                        if (res.Status == 'True') {
                            toaster.pop('success','Geofence', $scope.general.inactivated);
                            $scope.getData();
                            $scope.mapping.iBusinessId=0;
                        }
                    });
                },function(){
                    $scope.getData();
                });
            }
        }
        $scope.removeItem = function (id) {
            $scope.promtmsg = ($scope.general.deletepopupsingle);
            var param = {id  : id};
            prompt({

                message: $scope.promtmsg,
                input: false

            }).then(function (name) {

                $http.post(webservice_path +'gps/delete/',param).success(function (res) {

                    if (res.Status == 'True') {
                        toaster.pop('success', '', $scope.package.packagedelete);
                        $scope.getData();
                        $('input:checkbox').removeAttr('checked');
                    }
                });

            });
        }
    }]);