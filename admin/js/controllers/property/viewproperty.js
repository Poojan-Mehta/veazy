'use strict';
/* Controllers */
app.controller('viewpropertyCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt', 'ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt, ipCookie) {






        //$scope.pagename = $scope.property.addrole;
        $scope.id = $stateParams.propertyid;
        $scope.userId = localStorage.getItem('aid');
        $scope.image=[];

        if ($stateParams.propertyid) {
            //$scope.pagename = $scope.role.editrole;
            $http.get(webservice_path +'property/view?id=' + $scope.id).success(function(res){
                if (res.StatusCode == '999'){
                    $scope.logout();
                    toaster.pop('error','',res.Message);
                }else if (res.Status == 'True') {
                    $scope.propertydata = res.Response;
                    $("li").click(function() {
                        var myClass = $(this).attr("class");
                        if(myClass != ''){
                            $timeout(function () {
                                var myLatLng = {lat: parseFloat($scope.propertydata.vPropertyMapLat), lng: parseFloat($scope.propertydata.vPropertyMapLong)};
                                var map = new google.maps.Map(document.getElementById('map'), {
                                    zoom: 12,
                                    center: myLatLng
                                });
                                var marker = new google.maps.Marker({
                                    position: myLatLng,
                                    map: map,
                                    title: 'Hello World!'
                                });
                            });
                        }
                    });

                }else{
                    toaster.pop('error','',res.Message);
                }
            });


            //$scope.pagename = $scope.role.editrole;
            $http.get(webservice_path +'property/view1?id=' + $scope.id).success(function(res) {
                if (res.StatusCode == '999') {
                    $scope.logout();
                    toaster.pop('error', '', res.Message);
                } else if (res.Status == 'True') {
                    $scope.image = res.Response;
                    $scope.displayedCollection = [].concat($scope.image);
                }
            });
        }


    }]);