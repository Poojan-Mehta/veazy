angular.module('VeazyApp').controller('PlanController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal, $window)
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
    $scope.switchs = 'monthly';
    $scope.popoverIsVisible = true;
    $scope.desc = 'Pro-Features Include - Ability to set and manage your tasks for individual Applications'+
        ' - Ability to save Quick-Links for quick and easy access to important websites and resources';

    $scope.switchvalue = function(){

        if($scope.switchs == 'monthly'){
			$scope.switchs = 'yearly';
        }else{
        	$scope.switchs = 'monthly';
        }
    };

    $scope.showPopover = function() {

        $('[data-toggle="collapse"]').tooltip();
        $scope.popoverIsVisible = true;

    };

    if (localStorage.getItem('suc') == 'success') {
        toastr.success(localStorage.getItem('msg'));
        localStorage.removeItem('suc');
        localStorage.removeItem('msg');
    }
    if (localStorage.getItem('suc') == 'fail') {
        toastr.error(localStorage.getItem('msg'));
        localStorage.removeItem('suc');
        localStorage.removeItem('msg');
    }

    $scope.hidePopover = function () {
        $scope.popoverIsVisible = false;
        /*$scope.viewDescModal.close();*/
    };

    getPlan();

    $scope.ischecked = function(value){
        alert(value);
    };

    function getPlan() {
        if($scope.token != undefined) {
            $http.get(webservice_path + "getplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                .success(function (res) {
                    if (res.status == true) {
                        $scope.plan = res.result.data;
                        $scope.planmonthly = [];
                        $scope.planyearly = [];

                        angular.forEach($scope.plan, function(value, key) {
                            
                           if(value.ePlanFee == 'free'){
                                $scope.plan.splice(key,1);
                           }
                           if(value.ePlanFee == 'free' || value.Plan_Duration == 'monthly'){
                                //$scope.planmonthly.splice(key,1);
                                $scope.planmonthly.push($scope.plan[key]);
                           }
                           if(value.ePlanFee == 'free' || value.Plan_Duration == 'yearly'){
                                //$scope.planmonthly.splice(key,1);
                                $scope.planyearly.push($scope.plan[key]);
                           }
                        });
                          console.log($scope.planmonthly);                       
                        
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }

    /** check application is not greter then old plan*/
    $scope.checkapplication = function (pid,pfee,plantype) 
    {
        //alert('pid='+pid+' pfee='+pfee+' plantype='+plantype); return false;
        if($scope.token != undefined) {
            $http.get(webservice_path + "checkapplication?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all' + "&pid=" + pid + "&pfee=" + pfee + "&plantype=" + plantype)
                .success(function (res) 
                {
                	console.log(res.result.valid); //return false;
                    if (res.result.valid == 'true' || res.result.valid == true) {
                    	
                        if(plantype != 'free'){
                            $scope.createPayment(pid,pfee,plantype);
                        }else{
                            toastr.success("Your Free Plan Has been Activated");
                            $window.location.href = '/dashboard';
                            localStorage.setItem("suc","success");localStorage.setItem("msg","Your Free Plan has been Activated.");
                        }

                    }else{
						alert('else');
                        toastr.error(res.result.message);
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }



    };

    $scope.createPayment = function (pid,pfee,plantype) {
    		
            if(pfee != 'free'){
                $scope.Fee =  pfee * 100;
            }

            var k =
                '<form action="' + webservice_path + 'planPayment" method="POST" id="payment-form">' +
                '<input type="hidden" name="pid" value="' + pid + '">' +
                '<input type="hidden" name="token" value="' + $scope.token + '">' +
                '<input type="hidden" name="amount" value="' + $scope.Fee + '">' +
                '<input type="hidden" name="plantype" value="' + plantype + '">' +
                '<script src="https://checkout.stripe.com/checkout.js" class="stripe-button example2" ' +
                'data-key="' + publishable_key + '" data-amount="' + $scope.Fee + '" ' +
                'data-currency="' + currency + '" data-name="' + data_name + '" data-description="Plan Fee" ' +
                'data-email="' + $rootScope.email + '" data-image="' + $scope.settings.layoutPath + '/img/veazy_logo_stripe_icon.png" data-locale="auto" data-zip-code="false"></script></form>';
            $('.stripe_div').html(k);

            setTimeout(function () {
                $('.stripe-button-el').click();
            }, 1000);


    };

});