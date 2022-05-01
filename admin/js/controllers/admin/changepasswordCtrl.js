'use strict';

/* Controllers */
app.controller('changepasswordCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster)
    {

        $scope.pagename = $scope.admin.addpagename;

        /** CHANGE PASSWORD FORM*/
        $scope.change_admin_form = function (isValid)
        {
            $scope.submitted = true;

            if (isValid)
            {
                 var param = {
                     userid:localStorage.getItem('aid'),
                     currentpassword: $scope.currentpassword,
                     newpassword: $scope.newpassword,
                     confirmpassword: $scope.confirmpassword
                 };

                /** CHANGE PASSWORD FORM ADD*/
                if ($stateParams.adminid)
                {
                    $http.put( webservice_path +'/admin/changepassword',param).success(function(res)
                    {
                        if (res.Status == "True")
                        {
                            $rootScope.sucs_status = true;
                            $rootScope.message = res.Message;
                            $state.go('login');
                            toaster.pop('success', '', $scope.general.tosterchangepassword);

                        }
                        else if (res.Status == "False")
                        {
                            $rootScope.status = true;
                            $rootScope.message = res.Message;
                            $rootScope.error.message=res.message;
                        }
                        else {
                            toaster.pop('error', '', $scope.general.tosterchangepasswordwrong);

                        }
                    });
                }
            }
        }
    }]);
