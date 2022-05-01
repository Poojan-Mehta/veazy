'use strict';
/* Controllers */
app.controller('addplanCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {

        $scope.pagename = "Add Plan";
        $scope.id = $stateParams.pid;
        $scope.userId = localStorage.getItem('aid');
        $scope.AllowLessons = false;        
        $scope.AllowTemplates = false;
        $scope.AllowDC = false;
        $scope.payment_type = 'free';
        $scope.productfeetype =['free','recurring'];
        $scope.Plan_Duration = 'monthly';
        $scope.duration =['lifetime','monthly','yearly'];
        $scope.Pro_Features = false;
        $scope.Plan_Duration = 'lifetime';

        // getPackage();
        function getPackage() {
            $http
            .get(webservice_path + "planpackage/getPackage")
            .success(function (res) {
                if (res.Status == "True") {
                    $scope.packageListing = res.Response;
                }
            });
        }

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.plans");
        }

        /** VIEW SUMMARY CATEGORY DATA BY ID*/
        if ($stateParams.pid) {

            var param = {
                id:$stateParams.pid
            };
            $scope.pagename = "Edit Plan";
            
            $http.post(webservice_path +'plans/view/', param).success(function(res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True') {

                    $scope.Unique_Plan_ID = res.Response.Unique_Plan_ID;
                    $scope.Plan_names = res.Response.Plan_names;
                    $scope.packageId = res.Response.iFkPackageId;
                    // $scope.payment_type =res.Response.ePlanFee;
                    // $scope.Plan_prices =parseInt(res.Response.Plan_prices);
                    $scope.Plan_Duration =res.Response.Plan_Duration;
                    $scope.duration_number = parseInt(res.Response.Duration_Number);
                    // $scope.monthly_price =res.Response.dPlanMonthlyPrice;
                    // $scope.yearly_price =res.Response.dPlanYearlyPrice;
                    $scope.no_application = parseInt(res.Response.no_application);
                    
                    if(res.Response.AllowLessons == 'yes'){
                        $scope.AllowLessons = true;
                    }

                    if(res.Response.AllowTemplates == 'yes'){
                        $scope.AllowTemplates = true;
                    }

                    if(res.Response.AllowDC == 'yes'){
                        $scope.AllowDC = true;
                    }

                    if(res.Response.Pro_Features == 'yes'){
                        $scope.Pro_Features = true;
                    }

                }else if (res.StatusCode == '0') {
                    $state.go("app.plans");
                    toaster.pop('error','',res.Message);
                }
            });
        }

        $scope.checkspace = function($event){
            var key = $event.keyCode;
            if(key == 32){
                $event.preventDefault();
                toaster.pop('error','',"Blank Space is Not Allowed in Plan Id");
                return false;
            }else{
                return true;
            }

        };
        
        /** ADD & EDIT SUMMARY CATEGORY */
        $scope.add_plans_form = function (isValid) {

            $scope.submitted = true;
            console.log(isValid);
            if (isValid) {

                // if($scope.payment_type == 'free'){
                //     $scope.Plan_Duration = '';
                // }
                var param = {
                    aid:$scope.userId,
                    Unique_Plan_ID: $scope.Unique_Plan_ID,
                    Plan_names: $scope.Plan_names,
                    // payment_type:$scope.payment_type,

                    // monthly_price:$scope.monthly_price,
                    // yearly_price: $scope.yearly_price,
                    Plan_Duration: $scope.Plan_Duration,
                    Duration_Number: $scope.duration_number,
                    // Plan_prices: $scope.Plan_prices,
                    no_application: $scope.no_application,
                    AllowLessons: $scope.AllowLessons,
                    AllowTemplates: $scope.AllowTemplates,
                    AllowDC: $scope.AllowDC,
                    Pro_Features:$scope.Pro_Features,
                    pid:$stateParams.pid,
                    packageId: ''
                    // packageId:$scope.packageId
                };

                if ($stateParams.pid) {
                    $http.post( webservice_path +'plans/edit',param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.plans");
                            toaster.pop('success','',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'plans/add', param).success(function(res) {
                        if (res.StatusCode == '999'){
                            $scope.logout();
                            toaster.pop('error','',res.Message);
                        }else if (res.Status == 'True') {
                            $state.go("app.plans");
                            toaster.pop('success', '',res.Message);
                        }else{
                            toaster.pop('error','',res.Message);
                        }
                    });
                }
            }
        }
    }]);
