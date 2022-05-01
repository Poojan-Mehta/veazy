angular.module('VeazyApp').controller('TimelineController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    /** added by poojan start*/
    $scope.showfilter = false;
    $scope.maindashboard = true;
    $rootScope.maindashboard = true;
    /*setTimeout(function () {
        if($scope.is_plan_exists == 'no' || $scope.is_plan_exists == false){
            $state.go('app.dashboard');
        }
    }, 1500);*/
    $scope.allcase = true;
    if($rootScope.allcase != undefined){
        $scope.allcase = $rootScope.allcase;
    }
    getPlan();
    $scope.is_plan_exists = true;
    function getPlan() {
        if($scope.token != undefined) {
            $http.get(webservice_path + "currentplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                .success(function (res) {
                    if (res.status == true) {

                        $scope.plan_cancel = localStorage.getItem('plan_cancel');
                        if($scope.plan_cancel == 'yes'){
                            swal("Currently you do not have any plan.",
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
                            $('.swal-button').css('border-radius','7px !important');
                            localStorage.setItem('plan_cancel','');
                        }
                        
                        if(res.result.data.is_plan_exists == 'no'){
                            $scope.is_plan_exists = false;
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    
    /*GET COUNTRY RECORDS START*/
    getCountry();
    $scope.countries = [];
    $scope.lal_country = [];
   function getCountry(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "getCountries?uid=" + $scope.uid + "&token=" + $scope.token)
                .success(function (res) {
                    if (res.status == true) {
                        $scope.countries = res.result.data;
                        $scope.lal_country = res.result.data;
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    /*GET COUNTRY RECORDS END*/
    
    /** LODGEMENT DETAILS START */
    $scope.dateOptions = {
        showWeeks: false,
        formatYear: 'yy'
    };
    $scope.open1 = function() {
        $scope.popup1.opened = true;
    };

    $scope.popup1 = {
        opened: false
    };
    
    $scope.open2 = function() {
        $scope.popup2.opened = true;
    };
    $scope.popup2 = {
        opened: false
    };
    /** LODGEMENT DETAILS END */
    
    $scope.open3 = function() {
        $scope.popup3.opened = true;
    };

    $scope.popup3 = {
        opened: false
    };
    
    $scope.open4 = function() {
        $scope.popup4.opened = true;
    };
    $scope.popup4 = {
        opened: false
    };
    
    /** added by poojan end */
    
    /* ADD CASE START */
    $scope.addCase = function(){
        $scope.addCaseModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_case_modal',
            templateUrl: "add_case.html",
            scope:$scope,
            size: 'md'
        });
    };
    
    $scope.deleteCase = function(iPkTimelineId){
        $scope.delete_case_ID = iPkTimelineId;
        $scope.deleteCaseModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade note_confirm',
            templateUrl: "delete_case.html",
            scope:$scope,
            size: 'md'
        });
    };
    
    $scope.deleteCaseConfirm = function(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "deleteTimelineCase?uid=" + $scope.uid + "&token=" + $scope.token + "&iPkTimelineId=" + $scope.delete_case_ID)
                .success(function (res) {
                    if (res.status == true) {
                        if(res.result.valid == true){
                            $scope.deleteCaseModal.dismiss();
                            getAllUserTimeline();
                            toastr.success(res.result.message);
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    
    $scope.deleteCaseNo = function(){
        $scope.deleteCaseModal.dismiss();
    };
    
    getAllUserTimeline();
    $scope.search_field = [];
    $scope.search_field_string = " ";
    $scope.disable_add_case_btn = 'no';
    function getAllUserTimeline(){
        $scope.disable_add_case_btn = 'no';
        if($scope.token != undefined && $scope.search_field_string == undefined) {
            $http.get(webservice_path + "getAllTimelineCase?uid=" + $scope.uid + "&token=" + $scope.token)
                .success(function (res) {
                    if (res.status == true) {
                        if(res.result.is_exists == 'yes'){
                            $scope.alltimelinecase = res.result.data;
                            $scope.login_user_id = res.result.login_user_id;
                            angular.forEach($scope.alltimelinecase, function(value, key) {
                              if(value.iFkUserId == $scope.login_user_id){
                                  $scope.disable_add_case_btn = 'yes';
                              }
                            });
                        }else if(res.result.is_exists == 'no'){
                            $scope.alltimelinecase = [];
                            $scope.login_user_id = res.result.login_user_id;
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }else if($scope.token != undefined && $scope.search_field_string != undefined) {
            $http.get(webservice_path + "getAllTimelineCase?uid=" + $scope.uid + "&token=" + $scope.token+''+$scope.search_field_string)
                .success(function (res) {
                    if (res.status == true) {
                        if(res.result.is_exists == 'yes'){
                            $scope.alltimelinecase = res.result.data;
                            $scope.login_user_id = res.result.login_user_id;
                            angular.forEach($scope.alltimelinecase, function(value, key) {
                              if(value.iFkUserId == $scope.login_user_id){
                                  $scope.disable_add_case_btn = 'yes';
                              }
                            });
                        }else if(res.result.is_exists == 'no'){
                            $scope.alltimelinecase = [];
                            $scope.login_user_id = res.result.login_user_id;
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    
    $scope.myCase = function(){
        $scope.allcase = false;
        getAllUserTimeline();
    }
    
    $scope.allCase = function(){
        $scope.allcase = true;
        getAllUserTimeline();
    }
    
    $scope.filterHideShow = function(value){
        $scope.showfilter = value;
    }
    $scope.resetSearchFilter = function(){
        $scope.search_field = [];
        $scope.search_field_string = " ";
        getAllUserTimeline();
    }
    
    /*GET APPLICAITON SUBCLASS START*/
    applicationSubclassforCase();
    $scope.applicationsubclass = [];
   function applicationSubclassforCase(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "applicationSubclassforCase?uid=" + $scope.uid + "&token=" + $scope.token)
                .success(function (res) {
                    if (res.status == true) {
                        $scope.applicationsubclass= res.result.data;
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    /*GET APPLICAITON SUBCLASS END*/
    /*GET noOfNewCases START*/
    noOfNewCases();
    $scope.noOfNewCases = {};
   function noOfNewCases(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "noOfNewCases?uid=" + $scope.uid + "&token=" + $scope.token)
                .success(function (res) {
                    if (res.status == true) {
                        $scope.noOfNewCases= res.result.data;
                        console.clear();
                        console.log($scope.noOfNewCases);
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    /*GET noOfNewCases END*/
    $scope.searchFilter = function(){
        if($scope.search_field != undefined && $scope.token != undefined){
            $scope.search_field_string = '&Nationality='+$scope.search_field.Nationality+'&ApplicationSubclass='+$scope.search_field.ApplicationSubclass+'&OnOffShore='+$scope.search_field.OnOffShore+'&CurrentStatus='+$scope.search_field.CurrentStatus+'&VisaOffice='+$scope.search_field.VisaOffice;
            
            getAllUserTimeline();
        }else{
            toastr.error("Please search something..");
        }
    }
    
    $scope.locationShow = function(countries_loc_lodg){
        if($scope.search_field.ApplicationSubclass == '1'){
            return countries_loc_lodg.iPkCountryId == '13';
        }
        if($scope.search_field.ApplicationSubclass == '23' || $scope.search_field.ApplicationSubclass == '24'){
            return countries_loc_lodg.iPkCountryId != '13';
        }
        return countries_loc_lodg.iPkCountryId != '';
    }
    
    // get graph data start
    getGraphData();
    function getGraphData(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "getGraphData?uid=" + $scope.uid + "&token=" + $scope.token)
                .success(function (res) {
                    if (res.status == true) {
                        $scope.graph_data= res.result.data;
                        $scope.total_cases = $scope.graph_data.subclass800 + $scope.graph_data.subclass300 + $scope.graph_data.subclass309;
                        console.clear();
                        console.log('graph_data=>',$scope.graph_data);
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    // get graph data end
    $scope.graph_search = {};
    $scope.country_vise_case_count = 0;
    $scope.searchGraphFilter = function(){
        var param = {
            'graph_data': $scope.graph_search,
            'uid': $scope.uid,
            'token': $scope.token
        };
        if($scope.token != undefined) {
            $http.post(webservice_path + "searchGraphData",param)
                .success(function (res) {
                    console.clear();
                    console.log(res.result);
                    if (res.result.valid == true) {
                        $scope.Nationality = res.result.Nationality;
                        $scope.Subclass = res.result.Subclass;
                        $scope.NoofCase = res.result.case_count;
                        
                        if($scope.graph_search.applicationsubclass == 1){
                            $scope.country_vise_case_count = res.result.avg_days.avgtimefor820;
                        }else if($scope.graph_search.applicationsubclass == 23){
                            $scope.country_vise_case_count = res.result.avg_days.avgtimefor300;
                        }else if($scope.graph_search.applicationsubclass == 24){
                            $scope.country_vise_case_count = res.result.avg_days.avgtimefor309;
                        }else{
                            $scope.country_vise_case_count = res.result.avg_days.avgtimefor820 + res.result.avg_days.avgtimefor300 + res.result.avg_days.avgtimefor309;
                        }
                        
                        
                        console.log($scope.country_vise_case_count);
                        
                    }
                })
                .error(function (res) {
                    if (res.valid == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
        
    }
    
    $scope.graphdates = {};
    $scope.graphDatesWise = function(){
        var param = {
            'daterange' : $scope.graphdates.daterange,
            'uid' : $scope.uid,
            'token' : $scope.token
        };
        if($scope.token != undefined) {
            $http.post(webservice_path + "searchGraphDateWise",param)
                .success(function (res) {
                    var options = {
                    	data: [{
                    			type: "pie",
                    			//startAngle: 45,
                    			showInLegend: "true",
                    			legendText: "{label}",
                    			indexLabel: "{label} ({y})",
                    			yValueFormatString:"#,##0.#"%"",
                    			dataPoints: [
                    				{ label: "820", y: !isNaN(parseInt(res.result.counts.countsfor820)) ? parseInt(res.result.counts.countsfor820) : 0 },
                    				{ label: "300", y: !isNaN(parseInt(res.result.counts.countsfor300)) ? parseInt(res.result.counts.countsfor300) : 0 },
                    				{ label: "309", y: !isNaN(parseInt(res.result.counts.countsfor309)) ? parseInt(res.result.counts.countsfor309) : 0 }
                    			]
                    	}]
                    };
                    $("#chartContainer").CanvasJSChart(options);
                })
                .error(function (res) {
                    if (res.valid == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    
    //daterange
    $('input[name="daterange"]').daterangepicker({
        opens: 'left',
        maxDate: new Date()
      }, function(start, end, label) {
        console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
      });

}).directive('focusMe', ['$timeout', '$parse', function ($timeout, $parse) {
    return {
        link: function (scope, element, attrs) {
            var model = $parse(attrs.focusMe);
            scope.$watch(model, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
        }
    };
}]);
