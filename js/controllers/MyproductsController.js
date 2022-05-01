angular.module('VeazyApp').controller('MyproductsController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {
    $scope.$on('$viewContentLoaded', function () {
        // initialize core components
        App.initAjax();
    });

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    getProduct();

    function getProduct() {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getUserProduct?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                .success(function (res) {
                    if (res.status == true) {
                        $scope.products = res.result.data;
                        console.log($scope.products);
                        $scope.total_products = res.result.total_products;
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }

    $scope.getStatus = function(status) {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getStatus?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all' + "&status=" + status).success(function (res) {
                if (res.status == true) {
                    $scope.products = res.result.data;
                    console.log(res.result.data);
                }
            }).error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
        }
    };

    /** LINK PRODUCT START */
    $scope.link = function (iPkUserProductId) {
        $scope.product_link_with = iPkUserProductId;
        $scope.confirm_product_id = '';
        var param = {
            'pid': iPkUserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };

        $http.post(webservice_path + 'getlinkapplication', param).success(function (res) {
            if (res.status == true) {
                $scope.link_products = res.result.data;
                $scope.total_link_products = res.result.total_products;
                if ($scope.total_link_products != 0) {
                    $scope.linkModal = $uibModal.open({
                        animation: true,
                        windowClass: 'modal fade veazy_modal link_modal',
                        templateUrl: "linkproduct.html",
                        scope: $scope,
                        size: 'md'
                    });
                } else {
                    toastr.error('No any product found to link');
                }
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };

    $scope.link_product = function (iPkUserProductId) {
        $scope.confirm_product_id = iPkUserProductId;
    };

    $scope.confirm_link = function () {
        var param = {
            'pid': $scope.product_link_with,
            'lpid': $scope.confirm_product_id,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'confirmlink', param).success(function (res) {
            if (res.status == true) {
                $scope.confirm_product_id = '';
                $scope.linkModal.dismiss();
                getProduct();
                toastr.success('Your product has been linked');
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };

    $scope.close_link = function () {
        $scope.linkModal.dismiss();
    };
    /** LINK PRODUCT END **/

    /** UNLINK PRODUCT START **/
    $scope.unlink = function (unlink_product_id) {
        $scope.unlink_product_id = unlink_product_id;
        $http.get(webservice_path + "getapplicationbyID?productID=" + unlink_product_id + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
            .success(function (res) {
                if (res.status == true) {
                    $scope.linked_product_name = res.result.data.product_name;
                    $scope.linked_product_image = res.result.data.vUserProductImage;
                    $scope.unlinkModal = $uibModal.open({
                        animation: true,
                        windowClass: 'modal fade veazy_modal confirm_link',
                        templateUrl: "unlinkproduct.html",
                        scope: $scope,
                        size: 'md'
                    });
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    $state.go('app.dashboard');
                }
            });
    };

    $scope.close_unlink = function () {
        $scope.unlinkModal.dismiss();
    };

    $scope.confirm_unlink = function () {
        $http.get(webservice_path + "confirmunlink?pid=" + $scope.unlink_product_id + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type).success(function (res) {
            if (res.status == true) {
                $scope.unlink_product_id = '';
                $scope.unlinkModal.dismiss();
                getProduct();
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };
    /** UNLINK PRODUCT END **/

    /** CANCEL SUBSCRIPTION */
    $scope.cancelSubscription = function (iPkUserProductId, title) {
        $scope.cancel_product_id = iPkUserProductId;
        $scope.product_title = title;
    };

    $scope.cancelSubscriptionConfirm = function () {
        var param = {
            'pid': $scope.cancel_product_id,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'cancelSubscription', param).success(function (res) {
            if (res.status == true) {
                $scope.cancel_product_id = '';
                $scope.product_title = '';
                getProduct();
                toastr.success('Your application has been deleted.');
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };
    /** CANCEL SUBSCRIPTION END */

    /** get Plan Details Start*/

        getPlan();
        $scope.is_plan_exists = true;
        function getPlan() {

            if($scope.token != undefined) {
                $http.get(webservice_path + "currentplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                    .success(function (res) {
                        console.log(res);
                        if (res.status == true) {
                            
                            if(res.result.data.is_plan_exists == 'no'){
                                $scope.is_plan_exists = false;                                
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

        $scope.noplan = function(){
            
            //toastr.error('You can not access this. Because you do not have any Plan!');
            toastr.error('Uh oh! In order to access this Application you must have a current active plan. Please click below choose the plan that is best for you');
        }

        $scope.upgradePlan = function(){

            setTimeout(
              function() 
              {                
                 $state.go('app.plan');
              }, 500);
            
        };

        /** get Plan Details End */

        /** DUE DATE */
    $scope.dateOptions = {
        showWeeks: false,
        formatYear: 'yy'
    };

    $scope.assignDueDate = function (pid, duedate) {
        
        $scope.dateparam = {};
        if (duedate == null || duedate == '' || duedate == '-') {
            $scope.dateparam.duedate = new Date();
        } else {
            $scope.dateparam.duedate = duedate;
        }        

        $scope.pid = pid;
        $scope.assignDueDateModal = $uibModal.open({
            animation: true,
            windowClass: 'modal fade veazy_modal link_modal',
            templateUrl: "assignDueDate.html",
            scope: $scope,
            size: 'sm'
        });
    };

    $scope.closeassignDueDate = function () {
        $scope.dateparam = {};
        $scope.assignDueDateModal.dismiss();
    };

    $scope.chooseDate = function () {
        $scope.dueDate = $scope.dateparam.duedate.getDate() + '/' + parseInt($scope.dateparam.duedate.getMonth() + 1) + '/' + $scope.dateparam.duedate.getFullYear();
    };

    $scope.updateDueDate = function () {
        var param = {
            'pid': $scope.pid,
            'dtDeadLineDate': $scope.dateparam.duedate,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        
        $http.post(webservice_path + 'updateDeadlineDate', param).success(function (res) {
            if (res.status == true) {
                $scope.dueDate = '';
                $scope.dateparam = {};
                $scope.pid = '';
                $scope.assignDueDateModal.dismiss();
                getProduct();
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };

        
});