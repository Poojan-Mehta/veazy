angular.module('VeazyApp').controller('faqController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {
    $scope.$on('$viewContentLoaded', function () {
        // initialize core components
        App.initAjax();
    });

    /** BASIC VARIABLE INITIALIZE */
    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $rootScope.user_productID = $stateParams.vpid;
    $scope.is_faq = false;

    if ($rootScope.user_productID != undefined) {
        getProduct();    
    } else {
        $state.go('app.dashboard');
    }

    /** GET PRODUCT INFORMATIOON USING PRODUCT ID */
    function getProduct() {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getapplicationbyID?productID=" + $rootScope.user_productID + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
                .success(function (res) {
                    if (res.status == true) {
                        $rootScope.product = res.result.data;
                        /** CHECK WHEATHER TODO ALLOW OR NOT */
                        if ($rootScope.product.eAllowFaq == 'yes') {
                            $scope.is_faq = true;
                            $scope.getFAQ($rootScope.product.iFkFAQId);
                        } else {
                            /** IF TODO NOT ALLOW RETURN TO PRODUCT DASHBOARD */
                            $state.go('product_app.home', { 'vpid': $rootScope.user_productID });
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        /** IF INVALID PRODUCT ID RETURN TO PRODUCT DASHBOARD */
                        $state.go('product_app.home', { 'vpid': $rootScope.user_productID });
                    }
                });
        }
    }

    /** GET FAQ LIST
     *
     * @param iFkFAQId (array) is list of folders
     */
    $scope.getFAQ = function (iFkFAQId) {
        var param = { 'fieldvalue': iFkFAQId, 'pid': $rootScope.product.iPkUserProductId, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type };
        $http.post(webservice_path + 'getUserFAQ', param).success(function (res) {
            if (res.status == true) {
                $scope.faqlist = res.result.data;
            }
        })
    };
});