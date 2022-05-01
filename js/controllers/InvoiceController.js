angular.module('VeazyApp').controller('InvoiceController', function($rootScope, $filter, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal)
{
    $scope.$on('$viewContentLoaded', function() {
        // initialize core components
        App.initAjax();
    });

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $scope.Fee = 0;
    getPlan();

    function getPlan() {
        if($scope.token != undefined) {
            $http.get(webservice_path + "currentplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                .success(function (res) {
                    if (res.status == true) {
                        $scope.plan = res.result.data;
                        $scope.dtPaymentOn = $scope.plan.paymentdate;
                        $scope.dtExpireDate = $scope.plan.Expiredate;
                        $scope.iPkPlanPaymentId = $scope.plan.iPkPlanPaymentId;
                        $scope.ePaymentStatus = $scope.plan.ePaymentStatus;
                        $scope.dPaymentAmount = $scope.plan.dPaymentAmount;
                        $scope.vPlanType = $scope.plan.vPlanType;
                        $scope.vPaymentCurrency = $scope.plan.vPaymentCurrency;
                        $scope.brand = $scope.plan.brand;
                        $scope.Plan_names = $scope.plan.Plan_names;
                        $scope.vEmail = $scope.plan.vEmail;
                        $scope.is_plan_exists = $scope.plan.is_plan_exists;
                        $scope.dtCreatedOn = $scope.plan.dtCreatedOn;
                        if($scope.ePaymentStatus == 'success'){
                            $scope.ePaymentStatus = 'paid';
                        }

                        if($scope.ePaymentStatus == null){
                            $scope.ePaymentStatus = '-';
                        }

                        if($scope.vPlanType == 'yearly'){
                            $scope.vPlanType = 'Annual';
                        }

                        if($scope.dtCreatedOn == '1st January 1970'){
                            $scope.dtCreatedOn = '-';
                        }

                        if($scope.brand == '' || $scope.brand == null){
                            $scope.brand = '-';
                        }

                        if($scope.dtExpireDate == null){
                            $scope.dateAsString2 = '-';
                        }else{
                            $scope.dateAsString2 = $scope.dtExpireDate;
                        }



                        //$scope.dateAsString1 = $filter('date')(new Date($scope.dtPaymentOn), "longDate");
                        $scope.dateAsString1 = $scope.dtPaymentOn;


                        if($scope.dateAsString1 == null || $scope.dateAsString1 == 'Invalid Date' || $scope.dateAsString1 == '1st January 1970'){
                            $scope.dateAsString1 = '-';
                        }

                        if($scope.dateAsString2 == null || $scope.dateAsString2 == 'Invalid Date' || $scope.dateAsString2 == 'undefined' || $scope.dateAsString2 == ''){
                            $scope.dateAsString2 = '-';
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }

});