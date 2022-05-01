'use strict';
/* Controllers */
app.controller('addmenuCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename=$scope.menu.addmenu;

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($stateParams.menuid == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.menu");
        }

        if ($stateParams.menuid) {
            $scope.pagename=$scope.menu.editmenu;
            /** VIEW MENU DATA BY ID */
            $http.get(webservice_path +'menu/view/' + $stateParams.menuid).success(function(res) {
                if (res.StatusCode == '999') {
                    $state.go('login');
                    toaster.pop('error','',$scope.general.sessionexpire);
                } else if (res.Status == 'True') {
                    $scope.MenuName = res.Response.vMenuName;
                    $scope.MenuOrder = res.Response.iMenuOrder;
                    $scope.MenuStatus = res.Response.eMenuStatus;
                }else if (res.StatusCode == '0') {
                    $state.go("app.menu");
                    toaster.pop('error','',res.Message);
                }
            });
        }

        /** ADD & EDIT MENU*/
        $scope.add_menu_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                var param = {
                    vMenuName: $scope.MenuName,
                    iMenuOrder: $scope.MenuOrder,
                    vMenuSlug: $scope.MenuOrder,
                    eMenuStatus: $scope.MenuStatus,
                    menuId: $stateParams.menuid
                };

                if ($stateParams.menuid) {
                    $http.post(webservice_path + 'menu/edit', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == "True") {
                            $state.go("app.menu");
                            toaster.pop('success', '', res.Message);
                        } else if (res.Status == "False") {
                            toaster.pop('error', '', res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'menu/add', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == "True") {
                            $state.go("app.menu");
                            toaster.pop('success', '', res.Message);
                        } else if (res.Status == "False") {
                            toaster.pop('error', '', res.Message);
                        }
                    });
                }
            }
        }

    }]);
