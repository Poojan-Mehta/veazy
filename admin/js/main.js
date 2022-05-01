'use strict';
/* Controllers */
angular.module('app').controller('AppCtrl', ['$scope', '$state', '$http', '$rootScope', '$translate', '$localStorage', '$timeout', '$window','$filter',
        function ($scope, $state, $http, $rootScope, $translate, $localStorage, $timeout, $window,$filter) {

            // add 'ie' classes to html
            var isIE = !!navigator.userAgent.match(/MSIE/i);
            isIE && angular.element($window.document.body).addClass('ie');
            isSmartDevice($window) && angular.element($window.document.body).addClass('smart');
            $scope.flag_path = '';
            $rootScope.image_path = webservice_path + 'webroot/img/';

            // config
            $scope.app = {
                name: 'Angulr',
                version: '2.0.1',
                // for chart colors
                color: {
                    primary: '#7266ba',
                    info: '#23b7e5',
                    success: '#27c24c',
                    warning: '#fad733',
                    danger: '#f05050',
                    light: '#e8eff0',
                    dark: '#3a3f51',
                    black: '#1c2b36'
                }, settings: {
                    themeID: 1,
                    navbarHeaderColor: 'bg-black',
                    navbarCollapseColor: 'bg-white-only',
                    asideColor: 'bg-black',
                    headerFixed: true,
                    asideFixed: false,
                    asideFolded: false,
                    asideDock: false,
                    container: false
                }
            };

            if (angular.isDefined($localStorage.settings)) {
                $scope.app.settings = $localStorage.settings;
            } else {
                $localStorage.settings = $scope.app.settings;
            }

            $scope.$watch('app.settings', function () {
                if ($scope.app.settings.asideDock && $scope.app.settings.asideFixed) {
                    $scope.app.settings.headerFixed = true;
                }
                // save to local storage
                $localStorage.settings = $scope.app.settings;
            }, true);

            /***  HERE START LANGUAGE SELECTION CODE ***/

            if (!localStorage.getItem("language_selection")) {
                localStorage.setItem("language_selection", 1);
                $http.get(base_url + "lang/english/english.php")
                    .success(function (response) {
                        $scope.setlanguagevar(response);
                    });
            }

            if (localStorage.getItem("language_selection") == 1) {
                localStorage.setItem("language_selection", 1);
                $http.get(base_url + "lang/english/english.php")
                    .success(function (response) {
                        $scope.setlanguagevar(response);
                    });
                /*get the menu json for display.*/
                $http.get(base_url + "lang/english/menu.json").success(function (response) {
                    $scope.menu_describe_in_order = response.MAINMENU;
                });
            }

            $scope.lang = function (val) {
                $timeout(function () {
                    if (val == 1) {
                        localStorage.setItem("language_selection", 1);
                        $http.get(base_url + "lang/english/english.php")
                            .success(function (response) {
                                $scope.setlanguagevar(response);
                                window.location.reload();
                            });
                    }
                }, 1000);
            };

            $scope.setlanguagevar = function (response) {
                $scope.general = response.general[0];
                $scope.admin = response.admin[0];
                $scope.menu = response.menu[0];
                $scope.cms = response.cms[0];
                $scope.plans = response.plans[0];
                $scope.group = response.group[0];
                $scope.package = response.package[0];
                $scope.category = response.category[0];
                $scope.advertisement = response.advertisement[0];
                $scope.property = response.property[0];
                $scope.homeslider = response.homeslider[0];
                $scope.settings = response.settings[0];
                $scope.role = response.role[0];
                $scope.permission = response.permission[0];
                $scope.users = response.users[0];
                $scope.staff = response.staff[0];
                $scope.summary=response.summary[0];
                $scope.folder=response.folder[0];
                $scope.marketplace=response.marketplace[0];
                $scope.todolist=response.todolist[0];
                $scope.faq=response.faq[0];
                $scope.lession=response.lession[0];
                $scope.documentCategory=response.documentCategory[0];
                $scope.documenttemplate=response.documenttemplate[0];
                $scope.documents=response.documents[0];
                $scope.coverletter=response.coverletter[0];
                $scope.plan_package=response.plan_package[0];

            };
            /***  HERE END LANGUAGE SELECTION CODE ***/

            $scope.logout = function () {
                var param = {
                    role: 'admin',
                    aid: localStorage.getItem('aid')
                };
                $http.post(webservice_path + '/login/logout', param).success(function (res) {
                    localStorage.setItem('','aid');
                    localStorage.setItem('','token');
                    $state.go('login');
                });
            };

            function isSmartDevice($window) {
                // Adapted from http://www.detectmobilebrowsers.com
                var ua = $window['navigator']['userAgent'] || $window['navigator']['vendor'] || $window['opera'];
                // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
                return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
            }

            /*set the menu details in angularjs*/
            if (localStorage.getItem('is_main_user') != 1){
                var param = {};
                param['rid'] = localStorage.getItem('rid');
                $http.post(webservice_path + 'permission/viewselected',param).success(function (res){
                    if(res.Status == 'True'){
                        $scope.permission_menu_details = res.Response;
                    }else{
                        $scope.permission_menu_details = {};
                    }
                });
            }
            
            $scope.dismenu = function (id) {
                var suc = 0;
                if (localStorage.getItem('is_main_user') == 0){
                    $rootScope.is_main_user = 0;
                    angular.forEach($scope.permission_menu_details, function (mat1) {
                        var menu_name_str = eval(mat1);
                        for (var i = 0; i < menu_name_str.length; i++) {
                            if (menu_name_str[i].main_menu_id == id) {
                                suc = 1;
                                if (id == 1) {
                                    $rootScope.dash_dis_permission = menu_name_str[i];
                                }
                                if (id == 2) {
                                    $rootScope.users_dis_permission = menu_name_str[i];
                                }
                                if (id == 2.1) {
                                    $rootScope.staff_dis_permission = menu_name_str[i];
                                }
                                if (id == 2.2) {
                                    $rootScope.frontusers_dis_permission = menu_name_str[i];
                                }
                                if (id == 3) {
                                    $rootScope.permission_dis_permission = menu_name_str[i];
                                }
                                if (id == 3.1) {
                                    $rootScope.role_dis_permission = menu_name_str[i];
                                }
                                if (id == 3.2) {
                                    $rootScope.userpermission_dis_permission = menu_name_str[i];
                                }
                                if (id == 4) {
                                    $rootScope.gsetting_permission_dis_permission = menu_name_str[i];
                                }
                                if (id == 5) {
                                    $rootScope.cms_dis_permission = menu_name_str[i];
                                }
                                if (id == 5.1) {
                                    $rootScope.menu_dis_permission = menu_name_str[i];
                                }
                                if (id == 5.2) {
                                    $rootScope.cms_page_dis_permission = menu_name_str[i];
                                }
				                if (id == 6) {
                                    $rootScope.plans_dis_permission = menu_name_str[i];
                                }
                                if (id == 7.1) {
                                    $rootScope.market_place_permission = menu_name_str[i];
                                }
                                if (id == 7.2) {
                                    $rootScope.product_categories = menu_name_str[i];
                                }
                                if (id == 7.3) {
                                    $rootScope.product_listing_permission = menu_name_str[i];
                                }
                                if (id == 8.1) {
                                    $rootScope.lession_folder_permission = menu_name_str[i];
                                }
                                if (id == 8.2) {
                                    $rootScope.lesson_listing_permission = menu_name_str[i];
                                }
                                if (id == 9.1) {
                                    $rootScope.summary_folder_permission = menu_name_str[i];
                                }
                                if (id == 9.2) {
                                    $rootScope.summary_categories_permission = menu_name_str[i];
                                }
                                if (id == 9.3) {
                                    $rootScope.summary_list_permission = menu_name_str[i];
                                }
                                if (id == 10.1) {
                                    $rootScope.document_folder_permission = menu_name_str[i];
                                }
                                if (id == 10.2) {
                                    $rootScope.document_categories_permission = menu_name_str[i];
                                }
                                if (id == 10.3) {
                                    $rootScope.document_templates_permission = menu_name_str[i];
                                }
                                if (id == 10.4) {
                                    $rootScope.document_list_permission = menu_name_str[i];
                                }
                                if (id == 11.1) {
                                    $rootScope.todo_folder_permission = menu_name_str[i];
                                }
                                if (id == 11.2) {
                                    $rootScope.todo_list_permission = menu_name_str[i];
                                }
                                if (id == 11.3) {
                                    $rootScope.todo_cat_permission = menu_name_str[i];
                                }
                                if (id == 12.1) {
                                    $rootScope.coverletter_folder_permission = menu_name_str[i];
                                }
                                if (id == 12.2) {
                                    $rootScope.coverletter_list_permission = menu_name_str[i];
                                }
                                if (id == 13.1) {
                                    $rootScope.faq_folder_permission = menu_name_str[i];
                                }
                                if (id == 13.2) {
                                    $rootScope.faq_list_permission = menu_name_str[i];
                                }
                                if (id == 14) {
                                    $rootScope.plan_package_list_permission = menu_name_str[i];
                                }
                            }
                        }
                    });
                } else {
                    suc = 1;
                    $rootScope.is_main_user = 1;
                }
                if (suc == 1){
                    return true;
                }
            };
            
            $scope.formatDate = function(date){
                var dateOut = new Date(date.replace(/-/g, '/'));
                return moment(dateOut).format("DD/MM/YYYY hh:mm:ss");
            };

            $scope.formatShortDate = function(date){
                var dateOut = new Date(date.replace(/-/g, '/'));
                return moment(dateOut).format("DD/MM/YYYY");
            };
        }]);