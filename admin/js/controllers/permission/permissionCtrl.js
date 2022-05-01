'use strict';

/* Controllers */
app.controller('permissionCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt) {

        $scope.submitted = false;

        /*Roles List*/
        $http.post(webservice_path + 'permission/getrole').success(function (res) {
            $scope.role_details = res.Response;
        });

        /*Display menu Based on role*/
        $scope.display_menu=function(){
            angular.forEach($scope.menu_describe_in_order, function(mat){
                document.getElementById('disoption'+mat.id).checked=false;
                document.getElementById('add'+mat.id).checked=false;
                document.getElementById('delete'+mat.id).checked=false;
                document.getElementById('update'+mat.id).checked=false;
                document.getElementById('active'+mat.id).checked=false;
                document.getElementById('inactive'+mat.id).checked=false;
                document.getElementById('verify'+mat.id).checked=false;
                document.getElementById('reject'+mat.id).checked=false;
                document.getElementById('disoptiondiv'+mat.id).className='ng-binding ng-hide';
            });
            var param = { rid : $scope.main_role };
            $http.post(webservice_path + 'permission/viewselected',param).success(function(res){
                $scope.permission_details1 = res.Response;
                var menu_name_str='';
                angular.forEach($scope.permission_details1, function(mat1){
                    menu_name_str=JSON.parse(mat1);

                    for(var i = 0; i <menu_name_str.length; i++) {
                        angular.forEach($scope.menu_describe_in_order, function(mat){
                            if(mat.id==menu_name_str[i].main_menu_id){
                                document.getElementById('disoption'+mat.id).checked=true;
                                document.getElementById('disoptiondiv'+mat.id).className='ng-binding';
                                if(menu_name_str[i].add=='1')
                                    document.getElementById('add'+mat.id).checked=true;
                                if(menu_name_str[i].delete=='1')
                                    document.getElementById('delete'+mat.id).checked=true;
                                if(menu_name_str[i].update=='1')
                                    document.getElementById('update'+mat.id).checked=true;
                                if(menu_name_str[i].active=='1')
                                    document.getElementById('active'+mat.id).checked=true;
                                if(menu_name_str[i].inactive=='1')
                                    document.getElementById('inactive'+mat.id).checked=true;
                                if(menu_name_str[i].verify=='1')
                                    document.getElementById('verify'+mat.id).checked=true;
                                if(menu_name_str[i].reject=='1')
                                    document.getElementById('reject'+mat.id).checked=true;
                            }
                        });
                    }
                });
            });
        };

        /*Save Permission*/
        $scope.add_permission_form=function(isValid){
            $scope.submitted=true;

            if(isValid){
                $scope.maindata=[];
                angular.forEach($scope.menu_describe_in_order, function(mat){
                    var jsonarr={};
                    var mainarr=[];
                    if(document.getElementById('disoption'+mat.id).checked==true){
                        jsonarr['main_menu_id']=mat.id;
                        if(document.getElementById('add'+mat.id).checked==true){
                            jsonarr['add'] = '1';
                        } else
                            jsonarr['add'] = '0';

                        if(document.getElementById('delete'+mat.id).checked==true){
                            jsonarr['delete'] = '1';
                        } else
                            jsonarr['delete'] = '0';

                        if(document.getElementById('update'+mat.id).checked==true){
                            jsonarr['update'] = '1';
                        } else
                            jsonarr['update'] = '0';

                        if(document.getElementById('active'+mat.id).checked==true){
                            jsonarr['active'] = '1';
                        } else
                            jsonarr['active'] = '0';

                        if(document.getElementById('inactive'+mat.id).checked==true){
                            jsonarr['inactive'] = '1';
                        } else
                            jsonarr['inactive'] = '0';
                        if(document.getElementById('verify'+mat.id).checked==true){
                            jsonarr['verify'] = '1';
                        } else
                            jsonarr['verify'] = '0';

                        if(document.getElementById('reject'+mat.id).checked==true){
                            jsonarr['reject'] = '1';
                        } else
                            jsonarr['reject'] = '0';

                        mainarr.push(jsonarr);
                        $scope.maindata.push(jsonarr);
                    }
                });

                var param={
                    main_menu : JSON.stringify($scope.maindata),
                    role_id : $scope.main_role
                };
                $http.post(webservice_path + 'permission/saverole',param).success(function(res) {
                    if (res.Status == "True") {
                        //$scope.submitted = false;
                        toaster.pop('success','','Permission Added Successfully');
                    }
                });
            }
        };
        $scope.showhide=function(id){
            if(document.getElementById('disoption'+id).checked==true){
                document.getElementById('disoptiondiv'+id).className='ng-binding';
            }else{
                document.getElementById('disoptiondiv'+id).className='ng-binding ng-hide';
            }
        }

    }]);