var VeazyApp = angular.module("VeazyApp", [
    "ui.router", 
    "ui.bootstrap", 
    "oc.lazyLoad",  
    "ngSanitize",
    'ipCookie',
    'textAngular'    
]);

/* Configure ocLazyLoader(refer: https://github.com/ocombe/ocLazyLoad) */
VeazyApp.config(['$ocLazyLoadProvider', function($ocLazyLoadProvider) {
    $ocLazyLoadProvider.config({
        // global configs go here
    });
}]);

//AngularJS v1.3.x workaround for old style controller declarition in HTML
VeazyApp.config(['$controllerProvider', function($controllerProvider) {
  // this option might be handy for migrating old apps, but please don't use it
  // in new ones!
  $controllerProvider.allowGlobals();
}]);

/* Setup global settings */
VeazyApp.factory('settings', ['$rootScope', function($rootScope) {
    // supported languages
    var settings = {
        layout: {
            pageSidebarClosed: false, // sidebar menu state
            pageContentWhite: true, // set page content layout
            pageBodySolid: false, // solid body color state
            pageAutoScrollOnLoad: 100 // auto scroll to top on page load
        },
        assetsPath: 'assets',
        globalPath: 'assets/global',
        layoutPath: 'assets/layouts/layout',
        avatarPath: 'api/avatar'
    };
    $rootScope.settings = settings;

    return settings;
}]);

/* Setup App Main Controller */
VeazyApp.controller('AppController', ['$location','$scope', '$filter', '$rootScope', '$http', 'ipCookie', '$state', function($location,$scope, $filter, $rootScope, $http, ipCookie, $state) {
    $rootScope.lang_trans = {};
    $rootScope.multiLanguage = function (lang) {
        $http.get(base_url+"lang/en.php")
            .success(function(response) {
                $rootScope.lang_trans =response;
            });
    };
    
    $(document).on('change', '.goog-te-combo', function() {
        toastr.success('<b>Note:</b> Translation is not accurate');
    });

    
    /*var absUrl = $location.absUrl();
    var check_login = absUrl.includes('login');
    if(check_login == true){
        setTimeout(
          function() 
          {
            $(".intercom-app").css('display','none');
            //do something special
          }, 1000);
        //$(".intercom-app").attr('style', 'display: none !important');
    }else{
        setTimeout(
          function() 
          {
            $(".intercom-app").css('display','block');
            //do something special
          }, 5000);
    }*/
}]);



/* Setup Layout Part - Header */
VeazyApp.controller('HeaderController', ['$location','$scope', '$filter', '$rootScope', '$http', 'ipCookie', '$state', function($location,$scope, $filter, $rootScope, $http, ipCookie, $state) {
    /*$scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');*/

    $scope.uid = window.localStorage.getItem('uid');
    $scope.token = window.localStorage.getItem('token');
    $rootScope.maindashboard = window.localStorage.getItem('maindashboard');
    
    $scope.$on('$includeContentLoaded', function() {
        Layout.initHeader(); // init header
        $scope.logout = function () {
            /*var uid = ipCookie('uid');
            var token = ipCookie('token');*/

            var uid = window.localStorage.getItem('uid');
            var token = window.localStorage.getItem('token');
            var iPkUserId = window.localStorage.getItem('iPkUserId');
            var param = {'uid': uid, 'token': token};
            $http.post(webservice_path + 'logout',param).success(function (res) {

                if(res.status == true){
                    ipCookie.remove('uid');
                    ipCookie.remove('token');
                    localStorage.clear(); 
                    //$state.go('login');
                    window.location.href = "/login";

                }
            }).error(function (res) {
                if(res.status == false){
                    $scope.submitted = false;
                    toastr.error(res.result.message);
                }
            });
        };

	$rootScope.refreshintercom = function(){

        angular.element(function()
        	{
        		var w=window;var ic=w.Intercom;
        		if(typeof ic==="function")
        			{
        				ic('reattach_activator');
        				ic('update',w.intercomSettings);
        			}else{
        				var d=document;var i=function()
        				{
        					i.c(arguments);};i.q=[];i.c=function(args)
        					{
        						i.q.push(args);
        					};
        					w.Intercom=i;
        					var l=function()
        					{
        						var s=d.createElement('script');
        						s.type='text/javascript';
        						s.async=true;s.src='https://widget.intercom.io/widget/i5egnyy7';
        						var x=d.getElementsByTagName('script')[0];
        						x.parentNode.insertBefore(s,x);
        					};
        					if(w.attachEvent)
        						{
        							w.attachEvent('onload',l);
        						}else{
        							w.addEventListener('load',l,false);
        						}
        					}
        				});
    }

    $rootScope.refreshintercom();

        $rootScope.intercom = function(){

	        var full_name = window.localStorage.getItem('full_name');
	        var user_email = window.localStorage.getItem('user_email');
	        var iPkUserId = window.localStorage.getItem('iPkUserId');	        
	        /*setTimeout(
	          function() 
	          {        

	            window.intercomSettings = {
	                app_id: 'i5egnyy7',        
	                name: full_name, // Full name
	                email: user_email, // Email address
	                user_id:iPkUserId
	              };

	            window.dataLayer = window.dataLayer || [];
	            window.dataLayer.push({
	             'event': 'user',
	             'logged_in': true,
	             'email': user_email,
	             'name':full_name,
	             'user_id':iPkUserId
	             });        

	            console.log(window.intercomSettings);

	        }, 5000); */ 
			 angular.element(
	          function() 
	          { 
		        window.dataLayer = window.dataLayer || [];
		        window.dataLayer.push({
		         'event': 'user',
		         'logged_in': true,
		         'email': user_email,
		         'name':full_name,
		         'user_id':iPkUserId
		         });

		        /*window.intercomSettings = {
		            app_id: 'i5egnyy7',        
		            name: full_name, // Full name
		            email: user_email, // Email address
		            user_id:iPkUserId
		          };   */  
	        });

	         /*console.log(window.intercomSettings);*/
	     }

	    $rootScope.intercom();

        setTimeout(function()
         {
            getPlan();
         }, 1000);        

        function getPlan() {
            
            if($scope.token != undefined) {
                $http.get(webservice_path + "currentplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                    .success(function (res) {
                        //console.log(res); return false;
                        if (res.status == true) {
                            $scope.plan = res.result.data;
                            $scope.dtPaymentOn = $scope.plan.dtPaymentOn;
                            $rootScope.Pro_Features = $scope.plan.Pro_Features;
                            $rootScope.AllowLessons = $scope.plan.AllowLessons;
                            $rootScope.AllowTemplates = $scope.plan.AllowTemplates;
                            $rootScope.AllowDC = $scope.plan.AllowDC;
                            $rootScope.is_plan_exists = $scope.plan.is_plan_exists;                  
                            
                            $scope.dtExpireDate = $scope.plan.dtExpireDate;
                            $scope.iPkPlanPaymentId = $scope.plan.iPkPlanPaymentId;
                            $scope.ePaymentStatus = $scope.plan.ePaymentStatus;
                            $scope.dPaymentAmount = $scope.plan.dPaymentAmount;
                            $scope.vPlanType = $scope.plan.vPlanType;
                            $scope.vPaymentCurrency = $scope.plan.vPaymentCurrency;
                            $scope.brand = $scope.plan.brand;
                            $rootScope.already_has_plan = $scope.plan.already_has_plan;
                            $rootScope.Plan_names = $scope.plan.Plan_names;
                            
                            if($rootScope.Plan_names == '' || $rootScope.Plan_names == null){                                
                                $rootScope.Plan_names = 'No Current Plan Selected';
                                /*swal("Currently you do not have any plan.", {
                                    buttons: {
                                        cancel: "Ok",
                                        ok:"Subscribe"
                                    }
                                }).then(function(isConfirm) {
                                    
                                    if (isConfirm) {                                        
                                        window.location.href = "/Plans";
                                    } else {

                                    }
                                })*/
                            }

                            if($scope.brand == '' || $scope.brand == undefined){
                                $scope.brand = '-';
                            }

                            if($scope.ePaymentStatus == 'success'){
                                $scope.ePaymentStatus = 'paid';
                            }

                            if($scope.vPlanType == 'yearly'){
                                $scope.vPlanType = 'Annual';
                            }

                            $scope.dateAsString1 = $filter('date')(new Date($scope.dtPaymentOn), "longDate");
                            $scope.dateAsString2 = $filter('date')(new Date($scope.dtExpireDate), "longDate");

                            if($scope.dateAsString1 == null || $scope.dateAsString1 == 'Invalid Date'){
                                $scope.dateAsString1 = '-';
                            }

                            if($scope.dateAsString2 == null || $scope.dateAsString2 == 'Invalid Date' || $scope.dateAsString2 == 'undefined'){
                                $scope.dateAsString2 = '-';
                            }
                        }
                    })
                    /*.error(function (res) {
                        if (res.status == false) {
                            toastr.error(res.result.message);
                        }
                    });*/
            }
        }

        $scope.changeLanguage = function (lang) {
            /*var uid = ipCookie('uid');
            var token = ipCookie('token');*/

            var uid = window.localStorage.getItem('uid');
            var token = window.localStorage.getItem('token');
            var iPkUserId = window.localStorage.getItem('iPkUserId');
            var param = {'uid': uid, 'token': token,'lang': lang };
            $http.post(webservice_path + 'changeLanguage',param).success(function (res) {
                if(res.status == true){
                    $rootScope.multiLanguage(lang);
                }
            });
        };

        /*var absUrl = $location.absUrl();
        var check_login = absUrl.includes('login');
        if(check_login == true){
            setTimeout(
              function() 
              {
                $(".intercom-app").css('display','none !important');
                //do something special
              }, 1000);
            //$(".intercom-app").attr('style', 'display: none !important');
        }else{
            $(".intercom-app").css("");
        }*/

        /** CheckTrial Period*/

        /*checkPlan();

        function checkPlan() {

            if($scope.token != undefined) {
                $http.get(webservice_path + "logindefaultplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                    .success(function (res) {
                        if (res.status == true) {
                            console.log(res);
                            if(res.result.flag != 'yes'){
                                $state.go('defaultplan');
                            }else{
                                $state.go('dashboard');
                            }
                        }
                    });

            }
        }*/



        $scope.search = function(){
            $scope.searchparam = {};
            $scope.searchparam.searchText = '';
        };

        $(function() {
            var settings = {
                // these are required:
                suggestUrl: webservice_path + "searchProduct?uid=" +ipCookie('uid') + "&token=" + ipCookie('token') + "&type=" + app_type + '&query=', // the URL that provides the data for the suggest
                //ivfImagePath: 'http://yourserver.com/images/ivf/', // the base path for instant visual feedback images
                //// these are optional:
                instantVisualFeedback: 'all', // where the instant visual feedback should be shown, 'top', 'bottom', 'all', or 'none', default: 'all'
                throttleTime: 100, // the number of milliseconds before the suggest is triggered after finished input, default: 300ms
                extraHtml: undefined, // extra HTML code that is shown in each search suggest
                highlight: true, // whether matched words should be highlighted, default: true
                queryVisualizationHeadline: '', // A headline for the image visualization, default: empty
                animationSpeed: 200, // speed of the animations, default: 300ms
                enterCallback: function(text,link){console.log('enter callback: '+text);}, // callback on what should happen when enter is pressed, default: undefined, meaning the link will be followed
                enterCallbackResult: function(text,link){console.log('enter callback result: ' + text);window.location = link;}, // callback on what should happen when enter is pressed on a result or a suggest is clicked
                placeholder: 'Search for something',
                minChars: 0, // minimum number of characters before the suggests shows, default: 3
                suggestOrder: [], // the order of the suggests
                suggestSelectionOrder: [], // the order of how they should be selected
                noSuggests: '<span style="padding: 10px;display: block;text-align: center;"><b>We haven\'t found anything for you</b></span>',
                emptyQuerySuggests: {}
                //maxWidth: 400 // the maximum width of the suggest box, default: as wide as the input box
            };

            // apply the settings to an input that should get the unibox
            $("#searchInput").unibox(settings);

            //$http.get(webservice_path + "getUserProduct?uid=" +ipCookie('uid') + "&token=" + ipCookie('token') + "&type=" + app_type + '&limit=2')
            //    .success(function (res) {
            //        if (res.status == true) {
            //            var productlistArray=[];
            //            angular.forEach(res.result.data, function(data){
            //                var listing = {"id":data.pid,"name":data.vUserProductTitle,"link":"product?vpid="+data.iPkUserProductId,"image":data.vUserProductImage};
            //                productlistArray.push(listing);
            //            });
            //            $rootScope.recent_product = productlistArray;
            //
            //        }
            //    })
            //    .error(function (res) {
            //        if (res.status == false) {
            //            toastr.error(res.result.message);
            //        }
            //    });
        });
    });
}]);

/* Setup Layout Part - Sidebar */
VeazyApp.controller('SidebarController', ['$state', '$scope', function($state, $scope) {
    $scope.$on('$includeContentLoaded', function() {
        Layout.initSidebar($state); // init sidebar
    });
}]);

/* Setup Layout Part - Sidebar */
VeazyApp.controller('PageHeadController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        Demo.init(); // init theme panel
    });
}]);

/* Setup Layout Part - Theme Panel */
VeazyApp.controller('ThemePanelController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        Demo.init(); // init theme panel
    });
}]);

/* Setup Layout Part - Footer */
VeazyApp.controller('FooterController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        Layout.initFooter(); // init footer
    });
}]);
    
/* Setup Rounting For All Pages */
VeazyApp.config(['$stateProvider', '$urlRouterProvider','$locationProvider', function($stateProvider, $urlRouterProvider,$locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');

    /*var uid = window.localStorage.getItem('uid');
    var token = window.localStorage.getItem('token');

    if(uid == undefined && token == undefined){
        
        // Redirect any unmatched url
        $urlRouterProvider.otherwise("/login");        
    }*/
    
    // Redirect any unmatched url
    $urlRouterProvider.otherwise("/login");        

    $stateProvider
        .state('app', {
            abstract: true,
            url: '',
            templateUrl: page_url + "app.html"
        })

        /* Login */
        .state('login', {
            url: "/login",
            templateUrl: page_url + "login.html",
            data: {pageTitle: 'Login', bodyClasses: 'login' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                        files: [
                            'assets/pages/css/login.min.css',
                            angular_controller_url + 'controllers/LoginController.js'
                        ]
                    });
                }]
            }
        })

	.state('terms', {
            url: "/terms",
            templateUrl: page_url + "terms.html",
            data: {pageTitle: 'Terms', bodyClasses: 'login' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'assets/pages/css/login.min.css',
                            angular_controller_url + 'controllers/TermsController.js'
                        ]
                    });
                }]
            }
        })

        /* Register */
        .state('hiddenreg', {
            url: "/hiddenreg",
            templateUrl: page_url + "register.html",
            data: {pageTitle: 'Register', bodyClasses: 'login' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'assets/pages/css/login.min.css',
                            angular_controller_url + 'controllers/RegisterController.js'
                        ]
                    });
                }]
            }
        })

        /* Forgot Password */
        .state('forgotpassword', {
            url: "/forgotpassword",
            templateUrl: page_url + "forgotpassword.html",
            data: {pageTitle: 'Forgot Password', bodyClasses: 'login' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'assets/pages/css/login.min.css',
                            angular_controller_url + 'controllers/ForgotController.js'
                        ]
                    });
                }]
            }
        })

        /* Reset Password */
        .state('resetpassword', {
            url: "/resetpassword?key",
            templateUrl: page_url + "resetpassword.html",
            data: {pageTitle: 'Reset Your Password', bodyClasses: 'login' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'assets/pages/css/login.min.css',
                            angular_controller_url + 'controllers/ResetPasswordController.js'
                        ]
                    });
                }]
            }
        })

        /* One time Password */
        .state('otp', {
            url: "/match-otp",
            templateUrl: page_url + "otp.html",
            data: {pageTitle: 'Confirm OTP', bodyClasses: 'otp' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'assets/pages/css/login.min.css',
                            angular_controller_url + 'controllers/OtpController.js'
                        ]
                    });
                }]
            }
        })

        /* Dashboard */
        .state('app.dashboard', {
            url: "/dashboard",
            templateUrl: page_url + "dashboard.html",
            data: {pageTitle: 'Dashboard',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/DashboardController.js'
                        ]
                    });
                }]
            }
        })

        /* Forgot Password */
        .state('defaultplan', {
            url: "/defaultplan",
            templateUrl: page_url + "defaultplan.html",
            data: {pageTitle: 'Defaultplan',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'assets/pages/css/login.min.css',
                            angular_controller_url + 'controllers/DefaultPlanController.js'
                        ]
                    });
                }]
            }
        })

        // plans
        /* Dashboard */
        .state('app.plan', {
            url: "/Plans",
            templateUrl: page_url + "plan.html",
            data: {pageTitle: 'Plans',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/PlanController.js'
                        ]
                    });
                }]
            }
        })

        /* invoice */
        .state('app.invoice', {
            url: "/invoice",
            templateUrl: page_url + "invoice.html",
            data: {pageTitle: 'invoice',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/InvoiceController.js'
                        ]
                    });
                }]
            }
        })

        /** bill*/
        .state('app.bill', {
            url: "/bill",
            templateUrl: page_url + "bill.html",
            data: {pageTitle: 'bill',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/BillController.js'
                        ]
                    });
                }]
            }
        })

        /* All Tasks */
        .state('app.alltasks', {
            url: "/alltasks",
            templateUrl: page_url + "alltasks.html",
            data: {pageTitle: 'Tasks',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'css/colorSelect.css',
                            angular_controller_url + 'colorSelect.js',
                            angular_controller_url + 'controllers/AlltasksController.js'
                        ]
                    });
                }]
            }
        })
        /* Timeline */
        .state('app.timeline', {
            url: "/timeline",
            templateUrl: page_url + "timeline.html",
            data: {pageTitle: 'Timeline',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'css/colorSelect.css',
                            angular_controller_url + 'colorSelect.js',
                            angular_controller_url + 'controllers/TimelineController.js'
                        ]
                    });
                }]
            }
        })
        /* Add Edit Timeline Case */
        .state('app.addeditcase', {
            url: "/timeline/addeditcase?:caseid",
            templateUrl: page_url + "addeditcase.html",
            data: {pageTitle: 'Case',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'css/colorSelect.css',
                            angular_controller_url + 'colorSelect.js',
                            angular_controller_url + 'controllers/AddEditCaseController.js'
                        ]
                    });
                }]
            }
        })
        /* Main Dashboard */
        .state('app.maindashboard', {
            url: "/maindashboard",
            templateUrl: page_url + "maindashboard.html",
            data: {pageTitle: 'Main dashboard',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'css/colorSelect.css',
                            angular_controller_url + 'colorSelect.js',
                            angular_controller_url + 'controllers/MainDashboardController.js'
                        ]
                    });
                }]
            }
        })
        /* My Product */
        .state('app.myproducts', {
            url: "/myproducts",
            templateUrl: page_url + "myproducts.html",
            data: {pageTitle: 'My Products',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/MyproductsController.js'
                        ]
                    });
                }]
            }
        })
        /* Product List */
        .state('app.application', {
            url: "/applications",
            templateUrl: page_url + "applications.html",
            data: {pageTitle: 'Product List',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/ApplicationController.js'
                        ]
                    });
                }]
            }
        })
        
        /* Quick Links*/
        .state("app.quick_link", {
            url: "/quick_link",
            templateUrl: page_url + "quicklink.html",
            data: {pageTitle: 'Quick Links', bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/QuickLinksController.js'
                        ]
                    });
                }]
            }
        })
        /* Profile */
        .state("app.profile", {
            url: "/profile",
            templateUrl: page_url + "profile.html",
            data: {pageTitle: 'User Profile', bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.css',
                            'assets/global/plugins/jquery.sparkline.min.js',
                            'assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.js',
                            angular_controller_url + 'controllers/UserProfileController.js'
                        ]
                    });
                }]
            }
        })
        /* Product */
        .state('product_app', {
            abstract: true,
            url: '',
            templateUrl: page_url + "product_app.html"
        })
        /* Product Dashboard */
        .state('product_app.home', {
            url: "/product?:vpid",
            templateUrl: page_url + "product/dashboard.html",
            data: {pageTitle: 'Product',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/product/DashboardController.js'
                        ]
                    });
                }]
            }
        })
        /* Lessons */
        .state('product_app.lessons', {
            url: "/product/lessons?:vpid",
            templateUrl: page_url + "product/lessons.html",
            data: {pageTitle: 'Product',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'download.js',
                            angular_controller_url + 'controllers/product/LessonsController.js'
                        ]
                    });
                }]
            }
        })
        /* Lessons */
        .state('product_app.document_checklist', {
            url: "/product/document_checklist?:vpid",
            templateUrl: page_url + "product/document.html",
            data: {pageTitle: 'Product',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'download.js',
                            angular_controller_url + 'controllers/product/documentController.js'
                        ]
                    });
                }]
            }
        })
        /* Summary of Criteria */
        .state('product_app.soc', {
            url: "/product/soc?:vpid",
            templateUrl: page_url + "product/soc.html",
            data: {pageTitle: 'Product',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [                            
                            angular_controller_url + 'controllers/product/socController.js'
                        ]
                    });
                }]
            }
        })
        /* To Do List */
        .state('product_app.todolist', {
            url: "/product/todolist?:vpid",
            templateUrl: page_url + "product/todolist.html",
            data: {pageTitle: 'Product',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/product/todolistController.js'
                        ]
                    });
                }]
            }
        })
        /* FAQ */
        .state('product_app.faq', {
            url: "/product/faq?:vpid",
            templateUrl: page_url + "product/faq.html",
            data: {pageTitle: 'Product',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/product/faqController.js'
                        ]
                    });
                }]
            }
        })
        /* Coverletter */
        .state('product_app.coverletter', {
            url: "/product/coverletter?:vpid",
            templateUrl: page_url + "product/coverletter.html",
            data: {pageTitle: 'Product',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'download.js', //Download js required for download functionality
                            angular_controller_url + 'controllers/product/coverletterController.js'
                        ]
                    });
                }]
            }
        })
        /* Notes */
        .state('product_app.notes', {
            url: "/product/notes?:vpid",
            templateUrl: page_url + "product/notes.html",
            data: {pageTitle: 'Product',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            angular_controller_url + 'controllers/product/notesController.js'
                        ]
                    });
                }]
            }
        })
        /* Tasks */
        .state('product_app.tasks', {
            url: "/product/tasks?:vpid",
            templateUrl: page_url + "product/tasks.html",
            data: {pageTitle: 'Tasks',bodyClasses: '' },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'VeazyApp',
                        insertBefore: '#ng_load_plugins_before',
                        files: [
                            'css/colorSelect.css',
                            angular_controller_url + 'colorSelect.js',
                            angular_controller_url + 'controllers/product/TasksController.js'
                        ]
                    });
                }]
            }
        })
}]);

/* Init global settings and run the app */
VeazyApp.run(["$rootScope", "settings", "$state", "$stateParams", "ipCookie", "$http", function($rootScope, settings, $state, $stateParams, ipCookie, $http, $window) {
    $rootScope.$state = $state; // state to be accessed from view
    $rootScope.$settings = settings; // state to be accessed from view
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    $rootScope.$on("$stateChangeStart", function (event, next, current) {
        setTimeout(function () {
            function allow(dat, arr) { //"allow" function
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] == dat) { return true; }
                }
                return false;
            }
            var generalPages = [page_url + 'login.html', page_url + 'register.html' , page_url + 'terms.html', page_url + 'forgotpassword.html',  page_url + 'resetpassword.html',  page_url + 'otp.html'];
            if (allow(next.templateUrl, generalPages))
            {}
            else
            {
                /*var uid = ipCookie('uid');
                var token = ipCookie('token');*/

                var uid = window.localStorage.getItem('uid');
                var token = window.localStorage.getItem('token');
                var iPkUserId = window.localStorage.getItem('iPkUserId');                

                /*var uid = ipCookie('uid');
                var token = ipCookie('token');*/
                
                if (uid == undefined || token == undefined) {
                    $state.go('login');
                    ipCookie('is_session_expired', true);
                    event.preventDefault();
                } else {
                    
                    var param = {uid: uid, token: token, iPkUserId:iPkUserId};
                    $http.post(webservice_path + 'checklogin', param).success(function (res) {               
                        console.log(res);
                        if(res.status == true){                            
                            $rootScope.fname = res.result.fname;
                            $rootScope.lname = res.result.lname;
                            $rootScope.email = res.result.email;
                            $rootScope.vProfileImage = res.result.vProfileImage;
                            $rootScope.selected_lang = res.result.lang;
                            $rootScope.credit_call = res.result.classis_call;
                            $rootScope.multiLanguage($rootScope.selected_lang);
                        }
                    })/*.error(function (res) {
                        if(res.status == false){
                            ipCookie.remove('uid');
                            ipCookie.remove('token');
                            $state.go('login');                        
                            ipCookie('is_session_expired', true);
                        }
                    });*/
                }
            }
        });

    });
}]);
