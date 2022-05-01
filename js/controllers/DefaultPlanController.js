angular.module('VeazyApp').controller('DefaultPlanController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal, $window)
{
    $scope.$on('$viewContentLoaded', function() {
        // initialize core components
        App.initAjax();
    });

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    getPlan();
    function getPlan() {
        if($scope.token != undefined) {
            $http.get(webservice_path + "checkdefaultplan")
                .success(function (res) {
                    if (res.status == true) {
                        $scope.plan = res.result.data;
                        $scope.Fee = $scope.plan.Plan_prices;
                        $scope.pid = $scope.plan.iPkPlanId;
                        $scope.Plan_Duration = $scope.plan.Plan_Duration;
                        console.log($scope.plan);
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }

    $scope.logout = function () {
        var uid = ipCookie('uid');
        var token = ipCookie('token');
        var param = {'uid': uid, 'token': token};
        $http.post(webservice_path + 'logout',param).success(function (res) {
            if(res.status == true){
                ipCookie.remove('uid');
                ipCookie.remove('token');
                $state.go('login');
            }
        }).error(function (res) {
            if(res.status == false){
                $scope.submitted = false;
                toastr.error(res.result.message);
            }
        });
    };

    checkTrial();
    function checkTrial() {
        if($scope.token != undefined) {
            $http.get(webservice_path + "checktrialday")
                .success(function (res) {
                    if (res.status == true) {
                        $scope.trial = res.result;

                        console.log($scope.trial);
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }

    $scope.checkoutPayment = function () {

        $scope.Fee =  $scope.Fee * 100;

        var k =
            '<form action="' + webservice_path + 'trialPayment" method="POST">' +
            '<input type="hidden" name="pid" value="' + $scope.pid + '">' +
            '<input type="hidden" name="token" value="' + $scope.token + '">' +
            '<input type="hidden" name="amount" value="' + $scope.Fee + '">' +
            '<input type="hidden" name="plantype" value="' + $scope.Plan_Duration + '">' +
            '<script src="https://checkout.stripe.com/checkout.js" class="stripe-button" ' +
            'data-key="' + publishable_key + '" data-amount="' + $scope.Fee + '" ' +
            'data-currency="' + currency + '" data-name="' + data_name + '" data-description="Plan Fee" ' +
            'data-email="' + $rootScope.email + '" data-image="' + $scope.settings.layoutPath + '/img/veazy_logo_stripe_icon.png" data-locale="auto" data-zip-code="false"></script></form>';
        $('.stripe_div').html(k);


        setTimeout(function () {
            $('.stripe-button-el').click();
        }, 1000);


    };

});