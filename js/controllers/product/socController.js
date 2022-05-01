angular.module('VeazyApp').controller('socController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {
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
    $rootScope.user_productID = $stateParams.vpid;
    $scope.is_soc = false;

    if ($rootScope.user_productID != undefined) {
        getProduct();    
    } else {
        $state.go('app.dashboard');
    }

    function getProduct() {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getapplicationbyID?productID=" + $rootScope.user_productID + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
                .success(function (res) {
                    if (res.status == true) {
                        $rootScope.product = res.result.data;
                        if ($rootScope.product.eAllowSummary == 'yes') {                        
                            $scope.is_soc = true;
                            $scope.getSOC();
                        } else {
                            $state.go('product_app.home', { 'vpid': $rootScope.user_productID });
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        $state.go('product_app.home', { 'vpid': $rootScope.user_productID });
                    }
                });
        }
    }

    $scope.getSOC = function () {
        var param = { 'fieldvalue': $rootScope.product.iFkSummaryId, 'pid': $rootScope.product.iPkUserProductId, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type };
        $http.post(webservice_path + 'getUserSOC', param).success(function (res) {
            if (res.status == true) {
                $scope.soclist = res.result.data;
            }
        })
    };

    $scope.updateSummaryStatus = function(summaryId,summaryFolderId){    
        var param = { 'fieldvalue': summaryId, 'sfid':summaryFolderId, 'pid': $rootScope.product.iPkUserProductId, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type };
        $http.post(webservice_path + 'updateSummaryWatchedStatus', param).success(function (res) {
            if (res.status == true) {
                $scope.getSOC();
            }
        })
    };

    $scope.viewDesc = function(desc){
        $scope.desc = desc;
        $scope.viewDescModal = $uibModal.open({
            animation: true,
            windowClass : "fade veazy_modal soc_modal",
            templateUrl: "viewdescription.html",
            scope:$scope,
            size: 'md'
        });
    };

});