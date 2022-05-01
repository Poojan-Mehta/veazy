angular.module('VeazyApp').controller('BillController', function($rootScope, $filter, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal, $window)
{
    $scope.$on('$viewContentLoaded', function() {
        // initialize core components
        App.initAjax();
    });

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');
    $rootScope.maindashboard = 'true';
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
                        $scope.vPackageName = $scope.plan.vPackageName;
                        $scope.dtCreatedOn = $scope.plan.dtCreatedOn;
                        $scope.is_plan_exists = $scope.plan.is_plan_exists;
                        
                        $scope.is_cancelVisible = true;
                        if($scope.Plan_names == '' || $scope.Plan_names == null){
                            $scope.Plan_names = 'No Current Plan Selected';
                            $scope.is_cancelVisible = false;
                        }
                        
                        $scope.is_trial = false;
                        if($scope.plan.is_trial == true){
                            $scope.is_trial = true;
                            $scope.Trial_End_Date = $scope.plan.Trial_End_Date;
                        }

                        if($scope.brand == '' || $scope.brand == undefined){
                            $scope.brand = '-';
                        }

                        if($scope.dtCreatedOn == '1st January 1970'){
                            $scope.dtCreatedOn = '-';
                        }

                        if($scope.ePaymentStatus == 'success'){
                            $scope.ePaymentStatus = 'paid';
                        }

                        if($scope.vPlanType == 'yearly'){
                            $scope.vPlanType = 'Annual';
                        }

                        if($scope.dtExpireDate == null){
                            $scope.dateAsString2 = '-';
                        }else{
                            $scope.dateAsString2 =  $scope.dtExpireDate;
                        }


                        $scope.dateAsString1 = $scope.dtPaymentOn;
                        //$scope.dateAsString1 = $filter('date')(new Date($scope.paymentdate), "mediumDate");
                        //$scope.dateAsString1 = $scope.dtPaymentOn;


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

    $scope.redirectplan = function () {
        $state.go("app.plan");
    };

    $scope.cancelplan = function () {
        if($scope.token != undefined) {
            swal("Are you sure you want to cancel your plan ?", {
                buttons: {
                    cancel: "No",
                    ok:"Yes"
                }
            }).then(function(isConfirm) {
                if (isConfirm) {
                    //alert('jgkfslgk'); return false;
                    $http.get(webservice_path + "cancleplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                        .success(function (res) {
                            if (res.status == 'true') {
                                toastr.success(res.result.message);
                                $window.localStorage.setItem('plan_cancel','yes');
                                $state.go('app.dashboard');
                            }else{
                                toastr.success(res.result.message);
                                $window.localStorage.setItem('plan_cancel','yes');
                                $state.go('app.dashboard');
                            }
                        })
                        .error(function (res) {
                            if (res.status == false) {
                                toastr.error(res.result.message);
                            }
                        });

                } else {

                }
            }) 
            $('.swal-button--ok').css('background','#6049dd');
            $('.swal-button--ok').css('border-radius','7px !important');
            $('.swal-button--cancel').css('border-radius','7px !important');         
        }
    };

});