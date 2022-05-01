'use strict';

/* Controllers */

app.controller('addgeofenceCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt) {

        $scope.staff=$stateParams.bid;
        $scope.isgeo=false;

        var newpoint1,getradius1;

        $scope.drowshape=function(point,radius,interior,geofenceid,geofencename){
            featureGroup.clearLayers();
            var onlypoint,newpoint,position;
            var type = point.split(" ", 1);
            if(type=="POLYGON")
            {

                onlypoint=point.substring(8).replace("((", "[[").replace("))", "]]");
                newpoint=onlypoint.split(",").join("],").split(", ").join(",[");
                newpoint=newpoint.split(" ").join(", ");
                position=newpoint.substring(2).split("]",1).toString();
                var a=position.split(",");
                $scope.showshape(type,newpoint,a[0],a[1],geofenceid,interior,0,geofencename);
            }if(type=="LINESTRING")
            {

                onlypoint=point.substring(11).replace("(", "[[").replace(")", "]]");
                newpoint=onlypoint.split(",").join("],").split(", ").join(",[");
                newpoint=newpoint.split(" ").join(", ");
                position=newpoint.substring(2).split("]",1).toString();
                var a=position.split(",");
                $scope.showshape(type,newpoint,a[0],a[1],geofenceid,interior,0,geofencename);
            }if(type=="POINT")
            {

                onlypoint=point.substring(6).replace("(","").replace(")","");
                var newpoint = onlypoint.split(" ");
                position=newpoint.toString();
                var a=position.split(",");
                console.log(newpoint);
                $scope.showshape(type,newpoint,a[0],a[1],geofenceid,interior,radius,geofencename);
            }

        }

        if($stateParams.geoid){
            $http.get(webservice_path +'gps/getbyid/'+ $stateParams.geoid).success(function(res)
            {
                if (res.Status == 'True')
                {
                     $scope.geofencename=res.Response.vGeofenceName;
                     var point=res.Response.vLocation;
                     var distance=res.Response.fRadius;
                     var geofencename=res.Response.vGeofenceName;
                     var geofenceid=res.Response.iGeoId;
                     var interior='in';
                     $scope.isgeo=true;
                     $scope.points=point;
                     $scope.radius=distance;
                     $scope.type=res.Response.vGeoType;
                     $scope.drowshape(point,distance,interior,geofenceid,geofencename);
                    angular.element('.leaflet-draw-draw-circle').css("display", "none");
                    angular.element('.leaflet-draw-draw-polyline').css("display", "none");
                    angular.element('.leaflet-draw-draw-polygon').css("display", "none");
                    angular.element('.leaflet-draw-draw-marker').css("display", "none");

                }
            });
        }
        //Map code start
        $scope.plotpointsavegeofance=function(type,point,radius)
        {
            var plotpoint;
            if(type=="circle" || type=="marker")
            {
                plotpoint=point.toString().replace("LatLng","POINT ").replace(",","");
            }
            if(type=="polygon")
            {
                plotpoint = point.toString().split("LatLng").join("").toString().split(", ").join(" ").toString().split("),").join(",").toString().replace(")","").replace(")","").split(",(").join(", ").toString();
                var q=plotpoint.substring(1).split(", ");
                plotpoint="POLYGON ("+plotpoint+", "+q[0]+"))";
            }
            if(type=="polyline" || type=="rectangle")
            {
                plotpoint= point.toString().split("LatLng").join("").toString().split(", ").join(" ").toString().split("),").join(",").toString().replace(")","").replace(")","").split(",(").join(", ").toString();
                plotpoint="LINESTRING "+plotpoint+")";
            }
            //plotpoint=Guardianservice.reverselanglot(plotpoint);
            console.log(plotpoint);
            $scope.$apply(function(){
                $scope.points=plotpoint;
                $scope.radius=radius;
                $scope.type=type;
            });
        }
        var map ="";
        var featureGroup;
        var drawControl;
        $scope.map=function() {

            L.mapbox.accessToken = 'pk.eyJ1IjoibW9oYW1lZDEyMyIsImEiOiJjaWswOXRlMGUwMmtkdTZtMHhxcXVhanpoIn0.iDrtQ3X1A_h0_HInMe6saw';
            /* map = L.mapbox.map('map', 'mapbox.streets')
                .setView([ $scope.bdetail.dLongitude,  $scope.bdetail.dLatitude], 10);*/
             map = L.mapbox.map('map', 'mapbox.streets')
             .setView([ 23.0303572,  72.5178449], 10);

            featureGroup = L.featureGroup().addTo(map);


            drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: featureGroup
                }
            }).addTo(map);

            map.on('draw:created', function (e) {

                $scope.$apply(function(){
                    $scope.isgeo=true;
                });

                var newpoint;
                var type = e.layerType,
                    layer = e.layer;

                map.addLayer(layer);
                if(type === 'circle'){
                    newpoint=$scope.plotpointsavegeofance(type,layer.getLatLng(),layer.getRadius());
                }else if (type === 'marker') {
                    console.log(type);
                    newpoint=$scope.plotpointsavegeofance(type,layer.getLatLngs(),0);
                }else{
                    newpoint=$scope.plotpointsavegeofance(type,layer.getLatLngs(),0);
                }
                angular.element('.leaflet-draw-draw-circle').css("display", "none");
                angular.element('.leaflet-draw-draw-polyline').css("display", "none");
                angular.element('.leaflet-draw-draw-polygon').css("display", "none");
                angular.element('.leaflet-draw-draw-marker').css("display", "none");

                featureGroup.addLayer(e.layer);
            });
            map.on('draw:edited', function (event) {

                $scope.$apply(function(){
                    $scope.isgeo=true;
                });
                console.log('s');
                var layers = event.layers;
                var newpoint,getradius;
                layers.eachLayer(function(layer) {
                    if (layer instanceof L.Circle)
                    {
                        newpoint=$scope.plotpointsavegeofance("circle",layer.getLatLng(),layer.getRadius());
                        getradius=layer.getRadius();

                    }if(layer instanceof L.Polygon){
                        newpoint=$scope.plotpointsavegeofance("polygon",layer.getLatLngs(),0);
                    }
                    if(layer instanceof L.Polyline)
                    {
                        newpoint=$scope.plotpointsavegeofance("polyline",layer.getLatLngs(),0);
                    }
                    $scope.sendrequestaddnewgeofence(newpoint,getradius);
                    $scope.color=function(){
                        if (radio1.checked == true){

                            layer.setStyle(highlightStyle);
                        }
                        else if (radio2.checked == true) {
                            layer.setStyle(highlightStyle1);
                        }
                    }
                });
            });
            map.on('draw:deleted', function () {
                angular.element('.leaflet-draw-draw-circle').css("display", "block");

                angular.element('.leaflet-draw-draw-polygon').css("display", "block");
                $scope.$apply(function(){
                    $scope.isgeo=false;
                });
                featureGroup.clearLayers();
                //angular.element('.leaflet-draw-draw-marker').css("display", "block");
               // angular.element('.leaflet-draw-draw-rectangle').css("display", "block");


            });

        }
        $scope.sendrequestaddnewgeofence=function(newpoint,getradius){

            if(getradius==undefined){getradius=0;}
            newpoint1=newpoint;
            getradius1=getradius;
        }
        //Drow geofence on edit
        $scope.showshape=function(type,newpoint,lat,lang,geofenceid,interior,radiusdistance,geofencename)
        {
            var color="blue";
            var ll="";

            if(type=="POLYGON")
            {
                var a=newpoint.toString();
                var array = eval('('+newpoint+')');
                ll=L.polygon(array).addTo(featureGroup);
            }
            if(type=="LINESTRING")
            {
                var array = eval('('+newpoint+')');
                ll=L.polyline(array).addTo(featureGroup);
            }
            if(type=="POINT"){
                if(radiusdistance=="NoData"){
                    pop("warning","Not Found","Radius Not Found In DataBase   Default Radius is 500");
                    radiusdistance=50;
                }
                var lat = newpoint[0];
                var lang = newpoint[1];
                ll=L.circle([lat, lang], radiusdistance).addTo(featureGroup);
            }
            map.fitBounds(ll.getBounds());
        }
        $scope.map();
        angular.element('.leaflet-draw-draw-marker').css("display", "none");
        angular.element('.leaflet-draw-draw-rectangle').css("display", "none");
        angular.element('.leaflet-draw-draw-polyline').css("display", "none");
        $http.get(webservice_path + 'business/getbusinessinfo/' + $stateParams.bid).success(function (res) {
            if (res.Status == 'True')
            {
                $scope.bdetail=res.Response;

                map.setView([parseFloat($scope.bdetail.dLongitude) , parseFloat($scope.bdetail.dLatitude)]);
                //,  $scope.bdetail.dLatitude
            }
        });

        //Map code end
        $scope.business=function(){
            $http.get(webservice_path + 'business/index').success(function (res) {
                if (res.Status == 'True') {
                    $scope.bdata = res.Response;
                }
            });
        }
        $scope.business();
        $scope.savegeofence=function(){

            if(!$scope.geofencename){
                toaster.pop('Warning',  '',$scope.dashboard.geofencename);
                return false;
            }
            if(!$scope.points){
                toaster.pop('Warning',  '', $scope.dashboard.dgeofense);
                return false;
            }
            if($stateParams.geoid){
                var param = {
                    businessid:$stateParams.bid,
                    name:$scope.geofencename,
                    points: $scope.points,
                    radius:$scope.radius,
                    type :$scope.type
                };
                $http.put( webservice_path +'gps/edit/'+ $stateParams.geoid + '.json',param).success(function(res)
                {
                    if (res.Status == 'True') {
                        $state.go("app.geofance");
                        toaster.pop('success',  'Success', $scope.dashboard.succesgeofense);
                    }
                });
            }else{
                var param = {
                    businessid:$stateParams.bid,
                    name:$scope.geofencename,
                    points: $scope.points,
                    radius:$scope.radius,
                    type :$scope.type
                };
                $http.post(webservice_path +'gps/add/',param).success(function (res) {
                    if (res.Status == 'True') {
                        $state.go("app.geofance");
                        toaster.pop('success',  'Success',$scope.dashboard.geofenseadded);
                    }
                });
            }
        }




    }]);