'use strict';

/* Controllers */
app.controller('assigndeviceCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster)
    {
        $scope.pagename = $scope.assignpackage.ap;
        $scope.id=localStorage.getItem('aid');
        $scope.bid= $stateParams.bid;

        $scope.getbusinessinfo=function()
        {
            $http.get(webservice_path + '/business/getbusinessinfo/' + $stateParams.bid).success(function (res) {

                if (res.StatusCode == '999')
                {
                    $state.go('login');
                    toaster.pop('error','',"Your Session has been expired.Please login again !");
                }
                else if (res.Status == 'True')
                {
                    $scope.address= res.Response.vBusinessAddress;
                    $scope.email= res.Response.vBusinessEmail;
                    $scope.online= res.Response.eIsOnline;
                    $scope.businessname= res.Response.vBusinessName;
                }
            });
        }
        $scope.getbusinessinfo();

        if($stateParams.geoid){
            $http.get(webservice_path +'gps/getbyid/'+ $stateParams.geoid).success(function(res)
            {
                if (res.Status == 'True')
                {
                    $scope.geofencename=res.Response.vGeofenceName;
                    $scope.geotype=res.Response.vGeoType;
                }
            });
        }
        $scope.mapping=[];
        $scope.getBranch = function(id,f,id2) {
            $http.get(webservice_path + 'business/getbranch/'+id).success(function (res) {
                if (res.Status == 'True') {
                    $scope.branchdata = res.Response;
                    angular.forEach($scope.branchdata, function(q){
                        if (q.eIsMain=='yes' ) $scope.mapping.iBranchId= q.iBranchId;
                    });
                }
            });
            $http.get(webservice_path + 'business/selectassignpackage/'+id).success(function (res) {
                if (res.Status == 'True') {
                    $scope.pdata = res.Response;
                    if(f==true){
                        $scope.getdevice(id2);
                    }
                }
            });
        }
        $scope.getBranch($scope.bid);



        $scope.getdevice = function(id) {

            for(var i=0;i<$scope.pdata.length;i++){
                if(id==$scope.pdata[i].iPackageId){

                    //$scope.numberofdevice=$scope.pdata[i].vNumberOfDevice;
                    $scope.plantype=$scope.pdata[i].vPlanName;
                    $scope.iPlanId= $scope.pdata[i].iPlanId;
                }
            }

            $scope.pkg();
        }
        $scope.pkg = function(){
            var param = {
                iBusinessId: $scope.bid,
                iBranchId: $scope.mapping.iBranchId,
                iPackageId: $scope.mapping.iPackageId

            };
            $http.post(webservice_path + 'gps/getavailabledevice/',param).success(function (res) {
                if (res.Status == 'True') {
                    $scope.apakage = res.Response;
                }
            });
            $http.post(webservice_path + 'gps/getassingeddevice/',param).success(function (res) {
                if (res.Status == 'True') {
                    $scope.spakage = res.Response;
                }
            });
            $http.post(webservice_path + 'business/getcount/',param).success(function (res) {
                if (res.Status == 'True') {
                    $scope.numberofdevice= res.Response.iCount;
                }
            });
            $http.post(webservice_path + 'gps/check_plan_geofence',[{'BusinessId':$scope.bid,'planid':$scope.iPlanId}]).success(function (res) {
                if (res.Status == 'True') {
                    $scope.isPlanGeo = res.Response;
                }
            });

        }


        //New
        $scope.BusinessClick = function($event) {
            var checkbox = $event.target;
            if(checkbox.checked){
                angular.forEach($scope.spakage, function(q){
                    q.selected1 = true;
                });
            } else {
                angular.forEach($scope.spakage, function(q){
                    q.selected1 = false;
                });
            }
        };
        $scope.DeviceClick = function($event) {
            var checkbox = $event.target;
            if(checkbox.checked){
                angular.forEach($scope.apakage, function(p){
                    p.selected =true;
                });
            } else {
                angular.forEach($scope.apakage, function(p){
                    p.selected =false;
                });
            }
        };
        $scope.$watch('apakage', function(apakage) {
            $scope.acounts = [];
            angular.forEach($scope.apakage, function(p){
                if (p.selected) $scope.acounts.push(p.iTrackerId);
            });
        }, true);
        $scope.assignselecteddevice = function(){
            $scope.DeviceIdArray = [];
            angular.forEach($scope.apakage, function(p){
                if (p.selected) $scope.DeviceIdArray.push(p.iTrackerId);
            });


            var param = {
                iBusinessId: $scope.bid,
                iBranchId: $scope.mapping.iBranchId,
                iPackageId: $scope.mapping.iPackageId,
                iGeoId: $stateParams.geoid,
                Devices:$scope.DeviceIdArray
            };

            if($scope.DeviceIdArray.length==0){
                toaster.pop("error",$scope.business.atlistassign);
                return;
            }


            $http.post(webservice_path + 'gps/assigndevice/', param).success(function(res)
            {
                if (res.Status == "True")
                {
                    $rootScope.sucs_status = true;
                    $rootScope.message = res.Message;
                    toaster.pop('success', 'Success', $scope.installation.assignsuccessfully);
                    $scope.pkg($scope.iPlanId);
                }
                else if (res.Status == "False")
                {
                    $rootScope.status = true;
                    $rootScope.message = res.Message;
                }
                else
                {
                    toaster.pop('error',"Server Error",$scope.general.toastererror);

                }
            });
        };
        //Change interer and exterior
        $scope.changetype=function(id,type){
            var param = {
                iTrackerId: id,
                type: type
            };
            $http.post(webservice_path + 'gps/changetype/',param).success(function (res) {
                if (res.Status == 'True') {
                    $scope.pkg();
                }
            });
        }
        $scope.removeDeviceFromBusiness = function(){
            $scope.DeviceIdArray = [];
            angular.forEach($scope.spakage, function(q){
                if (q.selected1) $scope.DeviceIdArray.push(q.iTrackerId);
            });

            var param = {
                iBusinessId: $scope.bid,
                iBranchId: $scope.mapping.iBranchId,
                iPackageId: $scope.mapping.iPackageId,
                iGeoId: $stateParams.geoid,
                Devices:$scope.DeviceIdArray
            };

            if($scope.DeviceIdArray.length==0){
                toaster.pop("error",$scope.business.atlistassign);
                return;
            }
            $http.put( webservice_path +'gps/updateassign/'+ $scope.bid +'.json',param).success(function(res)
            {
                if (res.Status == "True")
                {
                    $rootScope.sucs_status = true;
                    $rootScope.message = res.Message;
                    toaster.pop('success', 'Success', $scope.installation.assignsuccessfully);
                    $scope.pkg($scope.iPlanId);
                }
                else if (res.Status == "False")
                {
                    $rootScope.status = true;
                    $rootScope.message = res.Message;
                    $rootScope.error.message=res.message;
                }
                else {
                    toaster.pop('error',"Server Error",$scope.general.toastererror);
                }
            });
        };
    }]);
