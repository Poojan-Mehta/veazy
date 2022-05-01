angular.module('VeazyApp').controller('LoginController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $window) {

    //var is_session_expired = ipCookie('is_session_expired');

    /*if(is_session_expired){
        toastr.error('Your session has been expired. Please login again');
         ipCookie.remove('is_session_expired');
    }*/

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    var current_url = window.location.href;

    var str_include = current_url.includes('https://app.veazy.com.au/login?token=');
    
    if(str_include == true){
            
        }
    else if($scope.uid == undefined && $scope.token == undefined){

        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
        
        if(str_include == true){
            
        }
        else if($scope.uid == null && $scope.token == null){

        }
        else if($scope.uid != '' && $scope.token != '' && str_include == false){            
            $state.go('app.dashboard');
        }
    }



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

    var getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
            }
        }
    };
    $(".intercom-app").hide();
    $scope.submit = function (isValid) {
        
        $scope.submitted = true;
        if (isValid) {
            $scope.disabled = true;
            $scope.email = $scope.email.trim();
            $scope.password = $scope.password.trim();
            var token = getUrlParameter('token');
            var d = new Date();
            var param = {'email': $scope.email, 'password': $scope.password,'token':token};
            $http.post(webservice_path + 'login', param).success(function (res) {
                
                if(res.status == true){  

                    $(".intercom-app").css('display','block');
                    /*$(".intercom-app").show();
                    alert('hiii');*/

                    if($scope.switch == true){
                        
                        /*ipCookie('uid', res.result.user_id, d.getTime() + (10 * 365 * 24 * 60 * 60));
                        ipCookie('token', res.result.api_token, d.getTime() + (10 * 365 * 24 * 60 * 60));*/                       

                        $window.localStorage.setItem('uid',res.result.user_id);
                        $window.localStorage.setItem('token',res.result.api_token);    
                    }else{
                        /*ipCookie('uid', res.result.user_id, {expires: 12, expirationUnit: 'hours'});
                        ipCookie('token', res.result.api_token, {expires: 12, expirationUnit: 'hours'});*/
                        $window.localStorage.setItem('uid',res.result.user_id);
                        $window.localStorage.setItem('token',res.result.api_token);
                    }
                    
                    //ipCookie.remove('is_session_expired');

                    $scope.full_name = res.result.fname+' '+res.result.lname;
                    $scope.email = res.result.email;
                    $scope.iPkUserId = res.result.iPkUserId;

                    /** intercom script start */
                        
                    
                        $window.localStorage.setItem('full_name',$scope.full_name);
                        $window.localStorage.setItem('user_email',$scope.email);
                        $window.localStorage.setItem('iPkUserId',$scope.iPkUserId);

                        window.intercomSettings = {
                            app_id: 'i5egnyy7',        
                            name: $scope.full_name, // Full name
                            email: $scope.email, // Email address
                            user_id:$scope.iPkUserId
                          };

                        window.dataLayer = window.dataLayer || [];
                        window.dataLayer.push({
                         'event': 'user',
                         'logged_in': true,
                         'email': $scope.email,
                         'name':$scope.full_name,
                         'user_id':$scope.iPkUserId
                         });

                         //$state.go('app.dashboard');  // comment by poojan
                        $state.go('app.maindashboard'); // added by poojan

                        $rootScope.refreshintercom();

                        if(res.result.is_plan == 'no'){

                            swal("Uh oh! In order to access this Application you must have a current active plan. Please click below choose the plan that is best for you!",
                             {
                                    buttons: {
                                        cancel: "Cancel",
                                        ok:"Subscribe"
                                    },toast: true
                                }).then(function(isConfirm) {
                                    
                                    if (isConfirm) {                                        
                                        window.location.href = "/Plans";
                                    } else {

                                    }
                                })

                                $('.swal-button--ok').css('background','#6049dd');
                                $('.swal-button--ok').css('border-radius','7px !important');
                                $('.swal-button--cancel').css('border-radius','7px !important');
                        }

                        //location.reload();
                        
                    /** intercom script end */                                      
                    
                    
                }else{
                    toastr.error(res.result.message);
                }
            }).error(function (res) {
                if(res.status == false){
                    $scope.submitted = false;
                    $scope.disabled = false;
                    toastr.error(res.result.message);
                }
            });
        }
    }

});
