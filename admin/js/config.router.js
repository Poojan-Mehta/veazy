"use strict";

angular
  .module("app")
  .run([
    "$rootScope",
    "$state",
    "$stateParams",
    "$timeout",
    "ipCookie",
    "toaster",
    "$http",
    function (
      $rootScope,
      $state,
      $stateParams,
      $timeout,
      ipCookie,
      toaster,
      $http
    ) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      /*  $rootScope.username  = localStorage.getItem('username');*/
      $rootScope.lastlogin = localStorage.getItem("lld");
      $rootScope.aid = localStorage.getItem("aid");
      $rootScope.country = localStorage.getItem("cn");
      $rootScope.state = localStorage.getItem("st");
      $rootScope.city = localStorage.getItem("ct");
      $rootScope.eRoleName = localStorage.getItem("rol");
      $rootScope.iRoleId = localStorage.getItem("rid");
      $rootScope.dtLastLogin = localStorage.getItem("lastlogindate");
      $rootScope.$on("$stateChangeStart", function (event, next, current) {
        setTimeout(function () {
          var islogin = ipCookie("isla");
          if (islogin == "false" || islogin == undefined || islogin == "") {
            if (
              next.templateUrl == page_url + "login.html" ||
              next.templateUrl == page_url + "forgot_password.html" ||
              next.templateUrl == page_url + "reset_password.html"
            ) {
            } else {
              toaster.pop(
                "error",
                "",
                "Your Session has been expired.Please login again!"
              );
              $state.go("login");
              event.preventDefault();
            }
          } else if (
            localStorage.getItem("aid") == null ||
            localStorage.getItem("token") == null
          ) {
            $state.go("login");
            event.preventDefault();
          } else {
            if (
              next.templateUrl == page_url + "login.html" ||
              next.templateUrl == page_url + "forgot_password.html" ||
              next.templateUrl == page_url + "reset_password.html"
            ) {
            } else {
              var param = {
                aid: localStorage.getItem("aid"),
                token: localStorage.getItem("token"),
              };
              $http
                .post(webservice_path + "login/checkValidToken", param)
                .success(function (res) {
                  if (res.Status == "True") {
                    $rootScope.username = res.Response.vAdminFirstName;
                  } else {
                    $state.go("login");
                    event.preventDefault();
                  }
                });
            }
          }
        });
      });
    },
  ])
  .config([
    "$stateProvider",
    "$urlRouterProvider",
    "JQ_CONFIG",
    "$locationProvider",
    "$httpProvider",
    function (
      $stateProvider,
      $urlRouterProvider,
      JQ_CONFIG,
      $locationProvider,
      $httpProvider
    ) {
      $locationProvider.html5Mode(true);
      $urlRouterProvider.otherwise("/login");

      $stateProvider
        .state("app", {
          abstract: true,
          url: "",
          templateUrl: theme_path + "pages/blocks/app.html",
        })
        /* Login Screen */
        .state("login", {
          url: "/login",
          templateUrl: theme_path + "pages/login.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/signin.js",
                ]);
              },
            ],
          },
        })
        /* Dashboard Screen */
        .state("app.dashboard-v1", {
          url: "/dashboard",
          templateUrl: theme_path + "pages/app_dashboard_v1.html",
          resolve: {
            deps: [
              "uiLoad",
              function (uiLoad) {
                return uiLoad.load([
                  theme_path + "js/controllers/dashboardCtrl.js",
                ]);
              },
            ],
          },
        })
        /* Start: Staff */
        .state("app.admin", {
          url: "/staff",
          templateUrl: theme_path + "pages/admin/admin.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/admin/adminCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.addadmin", {
          url: "/staff/add",
          templateUrl: theme_path + "pages/admin/addadmin.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/admin/addadminCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("app.editadmin", {
          url: "/staff/edit/:adminid",
          templateUrl: theme_path + "pages/admin/addadmin.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/admin/addadminCtrl.js",
                ]);
              },
            ],
          },
        })
        /* End: Staff */

        /* Start: Users */
        .state("app.users", {
          url: "/users",
          templateUrl: theme_path + "pages/user/users.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/user/usersCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.adduser", {
          url: "/users/add",
          templateUrl: theme_path + "pages/user/adduser.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/user/adduserCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("app.edituser", {
          url: "/users/edit/:userid",
          templateUrl: theme_path + "pages/user/edituser.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/user/adduserCtrl.js",
                ]);
              },
            ],
          },
        })
        /* End: Users */

        .state("app.changepassword", {
          url: "/staff/changepassword/:adminid",
          templateUrl: theme_path + "pages/admin/changepassword.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/admin/changepasswordCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("app.changepasswordmust", {
          url: "/staff/changepassword",
          templateUrl: theme_path + "pages/admin/changepasswordpopup.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/admin/changepasswordCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("forgotpassword", {
          url: "/forgotpassword",
          templateUrl: theme_path + "pages/forgot_password.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/forgotpasswordCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("resetpassword", {
          url: "/resetpassword",
          templateUrl: theme_path + "pages/reset_password.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/resetpasswordCtrl.js",
                ]);
              },
            ],
          },
        })

        /* Start: Role Permission Related Routing */
        .state("app.rolelist", {
          url: "/permission/rolelist",
          templateUrl: theme_path + "pages/permission/rolelist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/permission/rolelistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.addrole", {
          url: "/permission/add",
          templateUrl: theme_path + "pages/permission/addrole.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/permission/addroleCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("app.editrole", {
          url: "/permission/edit/:roleid",
          templateUrl: theme_path + "pages/permission/addrole.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/permission/addroleCtrl.js",
                ]);
              },
            ],
          },
        })

        /* Menu Permission Screen */
        .state("app.userpermission", {
          url: "/permission/menupermission",
          templateUrl: theme_path + "pages/permission/userpermission.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/permission/permissionCtrl.js",
                ]);
              },
            ],
          },
        })
        /* End: Role Permission Related Routing */

        .state("app.generalsetting", {
          url: "/generalsetting",
          templateUrl: theme_path + "pages/general/setting.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/general/setting.js",
                ]);
              },
            ],
          },
        })

        .state("app.summery", {
          url: "/summarycriteria",
          templateUrl: theme_path + "pages/summery/summery.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/summery/summeryCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addsummery", {
          url: "/summarycriteria/add",
          templateUrl: theme_path + "pages/summery/addsummery.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/summery/addsummeryCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.editsummery", {
          url: "/summarycriteria/edit/:suid",
          templateUrl: theme_path + "pages/summery/addsummery.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/summery/addsummeryCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        //summary folder start

        .state("app.summaryfolder", {
          url: "/summarycriteria/folder",
          templateUrl: theme_path + "pages/summery/summaryfolder.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/summery/summaryfolderCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addsummeryfolder", {
          url: "/summarycriteria/folder/add",
          templateUrl: theme_path + "pages/summery/addsummeryfolder.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/summery/addsummeryfolderCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.editsummeryfolder", {
          url: "/summarycriteria/folder/edit/:fid",
          templateUrl: theme_path + "pages/summery/addsummeryfolder.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/summery/addsummeryfolderCtrl.js",
                ]);
              },
            ],
          },
        })

        //summary folder end

        .state("app.menu", {
          url: "/menu",
          templateUrl: theme_path + "pages/menu/menu.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/menu/menuCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addmenu", {
          url: "/menu/add",
          templateUrl: theme_path + "pages/menu/addmenu.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/menu/addmenuCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.editmenu", {
          url: "/menu/edit/:menuid",
          templateUrl: theme_path + "pages/menu/addmenu.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/menu/addmenuCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.cms", {
          url: "/cms",
          templateUrl: theme_path + "pages/cms/cms.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/cms/cmsCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addcms", {
          url: "/cms/add",
          templateUrl: theme_path + "pages/cms/addcms.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/cms/addcmsCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.editcms", {
          url: "/cms/edit/:cmsid",
          templateUrl: theme_path + "pages/cms/addcms.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/cms/addcmsCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        // plans

        .state("app.plans", {
          url: "/plans",
          templateUrl: theme_path + "pages/plans/plans.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/plans/plansCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.addplan", {
          url: "/plans/add",
          templateUrl: theme_path + "pages/plans/addplan.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/plans/addplanCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.editplan", {
          url: "/plans/edit/:pid",
          templateUrl: theme_path + "pages/plans/addplan.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/plans/addplanCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.plan_package", {
          url: "/plan_package",
          templateUrl: theme_path + "pages/plan_package/package.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/plan_package/packageCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.addplan_package", {
          url: "/plan_package/add",
          templateUrl: theme_path + "pages/plan_package/addpackage.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/plan_package/addpackageCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.editplan_package", {
          url: "/plan_package/edit/:pid",
          templateUrl: theme_path + "pages/plan_package/addpackage.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/plan_package/addpackageCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        //Category Related Routing
        .state("app.category", {
          url: "/category",
          templateUrl: theme_path + "pages/category/categorylist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/category/categorylistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addcat", {
          url: "/category/add",
          templateUrl: theme_path + "pages/category/addcat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/category/addcatCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.editcat", {
          url: "/category/edit/:catid",
          templateUrl: theme_path + "pages/category/addcat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/category/addcatCtrl.js",
                ]);
              },
            ],
          },
        })

        // MARKETPLACE START

        .state("app.mplace", {
          url: "/market_place",
          templateUrl: theme_path + "pages/market_place/mplace.html",
          headers: {
            "Cache-Control": "no-cache",
          },
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/market_place/mplaceCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addmplace", {
          url: "/market_place/add",
          templateUrl: theme_path + "pages/market_place/addmplace.html",
          headers: {
            "Cache-Control": "no-cache",
          },
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/market_place/addmplaceCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.editmplace", {
          url: "/market_place/edit/:mpid",
          templateUrl: theme_path + "pages/market_place/addmplace.html",
          headers: {
            "Cache-Control": "no-cache",
          },
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/market_place/addmplaceCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        //Package Related Routing

        .state("app.package", {
          url: "/package",
          templateUrl: theme_path + "pages/package/package.html",
          headers: {
            "Cache-Control": "no-cache",
          },
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/package/packageCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addpkg", {
          url: "/package/add",
          templateUrl: theme_path + "pages/package/addpkg.html",
          headers: {
            "Cache-Control": "no-cache",
          },
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad
                    .load("angularBootstrapNavTree")
                    .then(function () {
                      return $ocLazyLoad.load([
                        theme_path + "js/controllers/package/addpkgCtrl.js",
                      ]);
                    });
                });
              },
            ],
          },
        })
        .state("app.editpkg", {
          url: "/package/edit/:pkgid",
          templateUrl: theme_path + "pages/package/addpkg.html",
          headers: {
            "Cache-Control": "no-cache",
          },
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad
                    .load("angularBootstrapNavTree")
                    .then(function () {
                      return $ocLazyLoad.load([
                        theme_path + "js/controllers/package/addpkgCtrl.js",
                      ]);
                    });
                });
              },
            ],
          },
        })
        .state("app.todolist", {
          url: "/todo",
          templateUrl: theme_path + "pages/todo/todo.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/todo/todolistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addtodo", {
          url: "/todo/add",
          templateUrl: theme_path + "pages/todo/addtodo.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/todo/addtodoCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("app.edittodo", {
          url: "/todo/edit/:tdid",
          templateUrl: theme_path + "pages/todo/addtodo.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/todo/addtodoCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.faq", {
          url: "/faq",
          templateUrl: theme_path + "pages/faq/faq.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/faq/faqCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addfaq", {
          url: "/faq/add",
          templateUrl: theme_path + "pages/faq/addfaq.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/faq/addfaqCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.editfaq", {
          url: "/faq/edit/:fid",
          templateUrl: theme_path + "pages/faq/addfaq.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/faq/addfaqCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.lession", {
          url: "/lesson",
          templateUrl: theme_path + "pages/lession/lessionlist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/lession/lessionCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.addlession", {
          url: "/lesson/add",
          templateUrl: theme_path + "pages/lession/addlession.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad
                    .load("angularBootstrapNavTree")
                    .then(function () {
                      return $ocLazyLoad.load([
                        theme_path + "js/controllers/lession/addlessionCtrl.js",
                      ]);
                    });
                });
              },
            ],
          },
        })
        .state("app.editlession", {
          url: "/lesson/edit/:lid",
          templateUrl: theme_path + "pages/lession/addlession.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad
                    .load("angularBootstrapNavTree")
                    .then(function () {
                      return $ocLazyLoad.load([
                        theme_path + "js/controllers/lession/addlessionCtrl.js",
                      ]);
                    });
                });
              },
            ],
          },
        })
        .state("app.lessonfolder", {
          url: "/lesson/folder",
          templateUrl: theme_path + "pages/lession/lessonfolderlist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/lession/lessonfolderlistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.addlessonfolder", {
          url: "/lesson/folder/add",
          templateUrl: theme_path + "pages/lession/addlessonfolder.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/lession/addlessonfolderCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("app.editlessonfolder", {
          url: "/lesson/folder/edit/:fid",
          templateUrl: theme_path + "pages/lession/addlessonfolder.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/lession/addlessonfolderCtrl.js",
                ]);
              },
            ],
          },
        })

        /** app.docfolder for Document folder listing */
        .state("app.docfolder", {
          url: "/document/folders",
          templateUrl: theme_path + "pages/document/folder_index.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/document/docFolderCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.adddocfolder", {
          url: "/document/folder/add",
          templateUrl: theme_path + "pages/document/folder_create.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/document/addDocFolderCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("app.editdocfolder", {
          url: "/document/folder/edit/:fid",
          templateUrl: theme_path + "pages/document/folder_create.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/document/addDocFolderCtrl.js",
                ]);
              },
            ],
          },
        })

        //document Category Related Routing
        .state("app.businesscategory", {
          url: "/doccategory",
          templateUrl:
            theme_path + "pages/businesscategory/businesscategorylist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/businesscategory/businesscategorylistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addbusinesscat", {
          url: "/doccategory/add",
          templateUrl:
            theme_path + "pages/businesscategory/addbusinesscat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/businesscategory/addbusinesscatCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.editbusinesscat", {
          url: "/doccategory/edit/:dcatid",
          templateUrl:
            theme_path + "pages/businesscategory/addbusinesscat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/businesscategory/addbusinesscatCtrl.js",
                ]);
              },
            ],
          },
        })
        //Document Template Related Routing
        .state("app.doctemplate", {
          url: "/doctemplate",
          templateUrl: theme_path + "pages/doctemplate/doctemplatelist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/doctemplate/doctemplatelistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.adddoctemplate", {
          url: "/doctemplate/add",
          templateUrl: theme_path + "pages/doctemplate/adddoctemplate.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/doctemplate/adddoctemplateCtrl.js",
                ]);
              },
            ],
          },
        })
        .state("app.editdoctemplate", {
          url: "/doctemplate/edit/:tempid",
          templateUrl: theme_path + "pages/doctemplate/adddoctemplate.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/doctemplate/adddoctemplateCtrl.js",
                ]);
              },
            ],
          },
        })

        //document Mapping Related Routing
        .state("app.document", {
          url: "/document",
          templateUrl: theme_path + "pages/document/documentlist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/document/documentlistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.adddocument", {
          url: "/document/add",
          templateUrl: theme_path + "pages/document/adddocument.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/document/adddocumentCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        .state("app.editdocument", {
          url: "/document/edit/:did",
          templateUrl: theme_path + "pages/document/adddocument.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("textAngular").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/document/adddocumentCtrl.js",
                  ]);
                });
              },
            ],
          },
        })
        // coverletter related routing
        .state("app.coverletter", {
          url: "/coverletter",
          templateUrl: theme_path + "pages/coverletter/coverletterlist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/coverletter/coverletterCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addcoverletter", {
          url: "/coverletter/add",
          templateUrl: theme_path + "pages/coverletter/addcoverletter.html",
          resolve: {
            deps: [
              "$ocLazyLoad",

              function ($ocLazyLoad) {
                return $ocLazyLoad.load("angularFileUpload").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/coverletter/addcoverletterCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.editcoverletter", {
          url: "/coverletter/edit/:cid",
          templateUrl: theme_path + "pages/coverletter/addcoverletter.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/coverletter/addcoverletterCtrl.js",
                ]);
              },
            ],
          },
        })

        //Summary Category Related Routing
        .state("app.summarycategory", {
          url: "/summarycategory",
          templateUrl:
            theme_path + "pages/summarycategory/summarycategorylist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/summarycategory/summarycategorylistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addsummarycat", {
          url: "/summarycategory/add",
          templateUrl: theme_path + "pages/summarycategory/addsummarycat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/summarycategory/addsummarycatCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.editsummarycat", {
          url: "/summarycategory/edit/:scid",
          templateUrl: theme_path + "pages/summarycategory/addsummarycat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/summarycategory/addsummarycatCtrl.js",
                ]);
              },
            ],
          },
        })

        //todo_Folder Related Routing
        .state("app.todofolder", {
          url: "/todo/folders",
          templateUrl: theme_path + "pages/todofolder/todofolderlist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/todofolder/todofolderlistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addtodofolder", {
          url: "/todo/folder/add",
          templateUrl: theme_path + "pages/todofolder/addtodofolder.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/todofolder/addtodoCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.edittodofolder", {
          url: "/todo/folder/edit/:fid",
          templateUrl: theme_path + "pages/todofolder/addtodofolder.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/todofolder/addtodoCtrl.js",
                ]);
              },
            ],
          },
        })

        //TO DO Category Related Routing
        .state("app.todocategory", {
          url: "/todocategory",
          templateUrl: theme_path + "pages/todo/todocategorylist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path + "js/controllers/todo/todocategorylistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addtodocat", {
          url: "/todocategory/add",
          templateUrl: theme_path + "pages/todo/addtodocat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/todo/addtodocatCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.edittodocat", {
          url: "/todocategory/edit/:scid",
          templateUrl: theme_path + "pages/todo/addtodocat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/todo/addtodocatCtrl.js",
                ]);
              },
            ],
          },
        })

        //coverletter_Category Related Routing
        .state("app.covletcategory", {
          url: "/coverletter/folders",
          templateUrl:
            theme_path + "pages/coverlettercategory/covlecategorylist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/coverlettercategory/covlecategorylistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addcoverocat", {
          url: "/coverletter/folder/add",
          templateUrl:
            theme_path + "pages/coverlettercategory/addcoverlettercat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/coverlettercategory/addcovlecategoryCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.editcoverlettercat", {
          url: "/coverletter/folder/edit/:fid",
          templateUrl:
            theme_path + "pages/coverlettercategory/addcoverlettercat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/coverlettercategory/addcovlecategoryCtrl.js",
                ]);
              },
            ],
          },
        })

        //FAQ_Category Related Routing
        .state("app.faqcategory", {
          url: "/faq/folder",
          templateUrl: theme_path + "pages/faqcategory/faqcategorylist.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load("smart-table").then(function () {
                  return $ocLazyLoad.load([
                    theme_path +
                      "js/controllers/faqcategory/faqcategorylistCtrl.js",
                  ]);
                });
              },
            ],
          },
        })

        .state("app.addfaqcat", {
          url: "/faq/folder/add",
          templateUrl: theme_path + "pages/faqcategory/addfaqcat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/faqcategory/addfaqcategoryCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.editfaqcat", {
          url: "/faq/folder/edit/:fid",
          templateUrl: theme_path + "pages/faqcategory/addfaqcat.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path +
                    "js/controllers/faqcategory/addfaqcategoryCtrl.js",
                ]);
              },
            ],
          },
        })

        .state("app.view", {
          url: "/users/viewmore/:uid",
          templateUrl: theme_path + "pages/user/viewmore.html",
          resolve: {
            deps: [
              "$ocLazyLoad",
              function ($ocLazyLoad) {
                return $ocLazyLoad.load([
                  theme_path + "js/controllers/user/viewmoreCtrl.js",
                ]);
              },
            ],
          },
        });
    },
  ]);
