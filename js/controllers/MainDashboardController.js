angular.module('VeazyApp').controller('MainDashboardController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie) {
    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }

    getProduct();
    $rootScope.maindashboard = true;
    function getProduct() {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getProductByCategories?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
                .success(function (res) {
                    if (res.status == true) {
                        $scope.products = res.result.data;
                        console.log($scope.products);
                        $('.nav-tabs').tabdrop({align: 'left'});
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }

    $scope.freePurchase = function (productID) {
    	
        var param = {'productID': productID, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type};
        $http.post(webservice_path + 'checkoutfreeproduct', param)
            .success(function (res) {
                if (res.status == true) {
                    toastr.success(res.result.message);
                    $state.go('app.dashboard');
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };

});