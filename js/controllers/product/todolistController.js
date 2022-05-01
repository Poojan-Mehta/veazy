angular.module('VeazyApp').controller('todolistController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {
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
    $scope.is_todolist = false;

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
                        if ($rootScope.product.eAllowToDo == 'yes') {
                            $scope.is_todolist = true;
                            $scope.getToDo();
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

    /** GET TODO LIST
     *
     * @param iFkToDoId (array) is list of folders
     */
    $scope.getToDo = function () {
        var param = { 'fieldvalue': $rootScope.product.iFkToDoId, 'pid': $rootScope.product.iPkUserProductId, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type };
        $http.post(webservice_path + 'getUserToDo', param).success(function (res) {
            if (res.status == true) {
                $scope.todolist = res.result.data;
                $scope.satisfied = res.result.satisfied;
            }
        })
    };

    /**
     * CHANGE STATUS TO COMPLETED FOR PARTICULAR TODO
     * @param todoId
     * @param todo_type
     */
    $scope.updateToDoStatus = function(todoId){
        var param = { 'fieldvalue': todoId, 'pid': $rootScope.product.iPkUserProductId, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type };
        $http.post(webservice_path + 'updateToDoWatchedStatus', param).success(function (res) {
            if (res.status == true) {
                $scope.getToDo();
            }
        })
    };
});