'use strict';
/* Controllers */
app.controller('addadminCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster','ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster,ipCookie) {
        $scope.pagename = $scope.admin.addpagename;
        $scope.userId = localStorage.getItem('aid');
        $scope.id = $stateParams.adminid;

        /** PERMISSION*/
        getrole();
        function getrole() {
            $http.get(webservice_path + 'permission').success(function (res) {
                if (res.Status == 'True'){
                    $scope.role_details = res.Response;
                }
            });
        }

        /** VIEW ADMIN*/
        if ($stateParams.adminid){
            if ($stateParams.adminid == 1){
                $scope.pagename = $scope.admin.updateprofile;
            }else {
                $scope.pagename = $scope.admin.editpagename;
            }
            $http.get(webservice_path + 'admin/view?aid=' + $stateParams.adminid).success(function (res) {
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True'){
                    $scope.vFirstName = res.Response.vAdminFirstName;
                    $scope.vLastName = res.Response.vAdminLastName;
                    $scope.vEmail = res.Response.vAdminEmail;
                    $scope.vMobile = res.Response.vAdminMobile;
                    $scope.vDescription = res.Response.vAdminAddress;
                    $scope.RoleId = res.Response.iFkRoleId;
                    $scope.vRolName = res.Response.vRoleName;
                }
            });
        }
            /** ADD & EDIT ADMIN*/
            $scope.add_admin_form = function (isValid) {
            $scope.submitted = true;
            if(isValid){
                var param = {
                    id: $scope.id ,
                    vFirstName: $scope.vFirstName,
                    vLastName: $scope.vLastName,
                    vEmail: $scope.vEmail,
                    vMobile: $scope.vMobile,
                    vDescription: $scope.vDescription,
                    iRoleId: $scope.RoleId,
                    userId: $stateParams.adminid
                };
                if ($stateParams.adminid) {
                    $http.post(webservice_path + 'admin/edit', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == "True") {
                            $scope.eRoleName = localStorage.getItem('rol');
                            if($scope.eRoleName != 'superadmin') {
                                localStorage.setItem('username', res.Response);
                                $rootScope.username = localStorage.getItem('username');
                                $state.go("app.dashboard-v1", {}, {reload: true});
                            } else {
                                localStorage.setItem('username', res.Response);
                                $rootScope.username = localStorage.getItem('username');
                                $state.go("app.admin", {}, {reload: true});

                            }
                            toaster.pop('success', '', res.Message);
                        } else if (res.Status == "False") {
                            toaster.pop('error', '', res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'admin/add', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == "True") {
                            $scope.eRoleName = localStorage.getItem('rol');
                            if($scope.eRoleName != 'superadmin') {
                                $state.go("app.dashboard-v1");
                            } else {
                                $state.go("app.admin");
                            }
                            toaster.pop('success', '', res.Message);
                        } else if (res.Status == "False") {
                            toaster.pop('error', '', res.Message);
                        }
                    });
                }
            }
        };
    }]);
