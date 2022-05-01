'use strict';
/* Controllers */
app.controller('addcmsCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster) {
        $scope.pagename = $scope.cms.addcms;
        $scope.userId = localStorage.getItem('aid');
        $scope.id = $stateParams.cmsid;

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.cms");
        }

        getmenu();
        $scope.rowCollection = [];

        /** GET MENU DETAILS*/
        function getmenu() {
            $http.get(webservice_path + 'cms/getmenu').success(function (res) {
                if (res.StatusCode == '999') {
                    $scope.logout();
                    toaster.pop('error', '', res.Message);
                }else if (res.Status == 'True'){
                    $scope.rowCollection = res.Response;
                    $scope.displayedoption = [].concat($scope.rowCollection);
                }
            });
        }

        /** VIEW CMS DETAILS BY ID*/
        if ($stateParams.cmsid){
            $scope.pagename = $scope.cms.editcms;
            $http.get(webservice_path + 'cms/view?cmsId=' + $stateParams.cmsid).success(function (res) {
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True'){
                    $scope.PageMenu = res.Response.vCmsPageName;
                    $scope.PageTitle = res.Response.vCmsPageTitle;
                    $scope.PageDes = res.Response.vCmsPageContent;
                    $scope.PageMTitle = res.Response.vCmsPageMetaTitle;
                    $scope.PageMKey = res.Response.vCmsPageMetaKeyword;
                    $scope.PageMDes = res.Response.vCmsPageMetaDescription;
                    $scope.PageStatus = res.Response.eCmsPageStatus;
                }else if (res.StatusCode == '0') {
                    $state.go("app.cms");
                    toaster.pop('error','',res.Message);
                }
            });
        }

        /** ADD & EDIT CMS*/
        $scope.add_cms_form = function (isValid) {
            $scope.submitted = true;
            if(isValid){
                var param = {
                    id: $scope.userId,
                    vCmsPageMenu: $scope.PageMenu,
                    vCmsPageTitle: $scope.PageTitle,
                    vCmsPageContent: $scope.PageDes,
                    vCmsPageMetaTitle: $scope.PageMTitle,
                    vCmsPageMetaKeyword: $scope.PageMKey,
                    vCmsPageMetaDescription: $scope.PageMDes,
                    eCmsPageStatus: $scope.PageStatus,
                    cmsId: $stateParams.cmsid
                };

                if ($stateParams.cmsid) {
                    $http.post(webservice_path + 'cms/edit', param).success(function (res) {
                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == "True") {
                            $scope.eRoleName = localStorage.getItem('rol');
                            if($scope.eRoleName != 'superadmin') {
                                $state.go("app.cms");
                            } else {
                                $state.go("app.cms");
                            }
                            toaster.pop('success', '', res.Message);
                        } else if (res.Status == "False") {
                            toaster.pop('error', '', res.Message);
                        }
                    });
                } else {
                    $http.post(webservice_path + 'cms/add', param).success(function (res) {

                        if (res.StatusCode == '999') {
                            $scope.logout();
                            toaster.pop('error', '', res.Message);
                        } else if (res.Status == "True") {
                            $scope.eRoleName = localStorage.getItem('rol');
                            if ($scope.eRoleName != 'superadmin') {
                                $state.go("app.cms");
                            } else {
                                $state.go("app.cms");
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
