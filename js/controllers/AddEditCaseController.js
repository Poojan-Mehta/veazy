angular.module('VeazyApp').controller('AddEditCaseController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $rootScope.user_caseID = $stateParams.caseid;
    /** added by poojan start*/
    $scope.maindashboard = true;
    $rootScope.maindashboard = true;
    /*setTimeout(function () {
        if($scope.is_plan_exists == 'no' || $scope.is_plan_exists == false){
            $state.go('app.dashboard');
        }
    }, 1500);*/
     
    getPlan();
    $scope.is_plan_exists = true;
    function getPlan() {
        if($scope.token != undefined) {
            $http.get(webservice_path + "currentplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                .success(function (res) {
                    console.clear();
                    console.log(res);
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
    $scope.countries_loc_lodg = [];
   function getCountry(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "getCountries?uid=" + $scope.uid + "&token=" + $scope.token)
                .success(function (res) {
                    if (res.status == true) {
                        $scope.countries = res.result.data;
                        $scope.countries_loc_lodg = res.result.data;
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
    /** LODGEMENT DETAILS END */
    
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
    $scope.paramtimeline = {DocumentReqDate: '',MedicalCompDate: '', dtGrantedOn: ''};
    $scope.user_timeline_exists = 'no';
    $scope.saveCase = function(isValid){
        
        if(($scope.paramtimeline.DocumentReqDate || $scope.paramtimeline.MedicalCompDate || $scope.paramtimeline.dtGrantedOn) != null){
            
            if(($scope.paramtimeline.DateOfLodgement) >= ($scope.paramtimeline.DocumentReqDate || $scope.paramtimeline.MedicalCompDate || $scope.paramtimeline.dtGrantedOn)){
                toastr.error('Lodgement date should be less than all dates');
                return false;
            }
        }
        $scope.submittedcase = true;
        if($scope.token != undefined && isValid) {
            $scope.disabledcase = true;
            var param = {
                'case_data': $scope.paramtimeline,
                'uid': $scope.uid,
                'token': $scope.token
            };
            $http.post(webservice_path + 'saveTimelineCase', param).success(function (res) {
                if (res.status == true) {
                    //$scope.getUserTimeline();
                    //$scope.paramtimeline = {};
                    $rootScope.allcase = false;
                    $state.go('app.timeline');
                    toastr.success(res.result.message);
                }else{
                    toastr.error(res.result.message);
                }
            }).error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                    $rootScope.allcase = false;
                    $state.go('app.timeline');
                }
            });
        }
    };
    
    getAllUserTimeline();
    function getAllUserTimeline(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "getAllTimelineCase?uid=" + $scope.uid + "&token=" + $scope.token)
                .success(function (res) {
                    if (res.status == true) {
                        if(res.result.is_exists == 'yes'){
                            $scope.alltimelinecase = res.result.data;
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
    if($rootScope.user_caseID != undefined){
        getUserTimeline();    
    }
    
    function getUserTimeline(){
        if($scope.token != undefined && $rootScope.user_caseID != undefined) {
            $http.get(webservice_path + "getUserCase?uid=" + $scope.uid + "&token=" + $scope.token+ "&iPkTimelineId=" + $rootScope.user_caseID)
                .success(function (res) {
                    if (res.status == true) {
                        if(res.result.is_exists == 'yes'){
                            $scope.paramtimeline = res.result.data;
                            if($scope.paramtimeline.IsAnonymous == 1){
                                $scope.IsAnonymous = true;
                            }else{
                                $scope.IsAnonymous = false;
                            }
                            if($scope.paramtimeline.DateOfLodgement != null){
                                $scope.paramtimeline.DateOfLodgement = new Date($scope.paramtimeline.DateOfLodgement);
                            }else{
                                $scope.paramtimeline.DateOfLodgement = '';
                            }
                            
                            if($scope.paramtimeline.DocumentReqDate != null){
                                $scope.paramtimeline.DocumentReqDate = new Date($scope.paramtimeline.DocumentReqDate);
                            }else{
                                $scope.paramtimeline.DocumentReqDate = '';
                            }
                            
                            if($scope.paramtimeline.MedicalCompDate != null){
                                $scope.paramtimeline.MedicalCompDate = new Date($scope.paramtimeline.MedicalCompDate);
                            }else{
                                $scope.paramtimeline.MedicalCompDate = '';
                            }
                            
                            if($scope.paramtimeline.dtGrantedOn != null){
                                $scope.paramtimeline.dtGrantedOn = new Date($scope.paramtimeline.dtGrantedOn);
                            }else{
                                $scope.paramtimeline.dtGrantedOn = '';
                            }
                            
                            $scope.user_timeline_exists = res.result.is_exists;
                            $scope.iPkTimelineId = res.result.data.iPkTimelineId;
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
    
    $scope.locationShow = function(countries_loc_lodg){
        if($scope.paramtimeline.ApplicationSubclass == '1'){
            return countries_loc_lodg.iPkCountryId == '13';
        }
        if($scope.paramtimeline.ApplicationSubclass == '23' || $scope.paramtimeline.ApplicationSubclass == '24'){
            return countries_loc_lodg.iPkCountryId != '13';
        }
        return countries_loc_lodg.iPkCountryId != '';
    }
    
    $scope.IsAnonymousUpdate = function(value){
        if(value == true){
            $scope.paramtimeline.IsAnonymous = 0;
            $scope.IsAnonymous = false;
        }else{
            $scope.paramtimeline.IsAnonymous = 1;
            $scope.IsAnonymous = true;
        }
    }

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
