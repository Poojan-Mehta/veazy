var map_in, shapes = [];
var maxRadius = parseInt(localStorage.getItem('fourside-radius')) * 1000;

function initialize(lat, long) {

    var goo = google.maps
    map_in = new goo.Map(document.getElementById('map_in'),
        {
            zoom: 10,
            center: new goo.LatLng(lat, long)
        }),
        selected_shape = null,
        drawman = new goo.drawing.DrawingManager(
            {
                map: map_in,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT,
                    drawingModes: ['marker', 'circle', 'polygon']
                }

                /*markerOptions: {icon: 'images/property-marker.png'}*/
            }),
        byId = function (s) {
            return document.getElementById(s)
        },
        clearSelection = function () {
            if (selected_shape) {
                selected_shape.set((selected_shape.type
                    ===
                    google.maps.drawing.OverlayType.MARKER
                ) ? 'draggable' : 'editable', false);
                selected_shape = null;
            }
        },
        setSelection = function (shape) {
            clearSelection();
            selected_shape = shape;

            selected_shape.set((selected_shape.type
                ===
                google.maps.drawing.OverlayType.MARKER
            ) ? 'draggable' : 'editable', true);

        },
        clearShapes = function () {
            for (var i = 0; i < shapes.length; ++i) {
                shapes[i].setMap(null);
            }
            shapes = [];
            drawman.setOptions({
                drawingControl: true
            });
            //  $('#save_raw').attr('disabled',true);
        };

    goo.event.addListener(drawman, 'circlecomplete', function (circle) {
        radius = circle.getRadius();

        redondo = circle;

        //observe radius_changed
        goo.event.addListener(redondo, 'radius_changed', function () {
            if (this.getRadius() > maxRadius) {
                this.setRadius(maxRadius);
            }
        })

    });


    goo.event.addListener(drawman, 'overlaycomplete', function (e) {

        drawman.setDrawingMode(null);
        // To hide:
        drawman.setOptions({
            drawingControl: false
        });

        var shape = e.overlay;
        shape.type = e.type;

        if (shape.type == 'circle') {

            if (shape.getRadius() > maxRadius) {
                shape.setRadius(maxRadius);
            }
        } else if (shape.type == 'marker') {


        }
        goo.event.addListener(shape, 'click', function () {

            setSelection(this);
        });
        setSelection(shape);
        shapes.push(shape);

        var data = IO.IN(shapes, false);
        $('#data').val(JSON.stringify(data));
        //   $('#save_raw').attr('disabled',false);

        if (shape.type == 'marker') {
            var lat, lng;
            if (data.length == 1) {
                lat = parseFloat(data[0].geometry[0]);
                lng = parseFloat(data[0].geometry[1]);
            } else {
                lat = parseFloat(data[data.length - 1].geometry[0]);
                lng = parseFloat(data[data.length - 1].geometry[0]);
            }
            getAddress(lat, lng);
        } else if(shape.type == 'POLYGON') {
          var lat, lng;
            lat = parseFloat(data[0].geometry[0][0][0]);
            lng = parseFloat(data[0].geometry[0][0][1]);
            getAddress(lat, lng);
        } else {
            var lat, lng;
            lat = parseFloat(data[0].geometry[0]);
            lng = parseFloat(data[0].geometry[1]);
            getAddress(lat, lng);
        }
    });

    function getAddress(lat, lng) {

        var latlng = {lat: lat, lng: lng};
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'location': latlng}, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {

                if (results[0]) {
                    var arrAddress = results[0].address_components;

                    var city;
                    $.each(arrAddress, function (i, address_component) {
                        if (address_component.types[0] == "administrative_area_level_2") {
                            city = address_component.long_name;
                        }
                    });

                    $('#pac-input').val(city);
                    $('#locality').val(results[0].address_components[2].long_name);
                    $('#address').val(results[0].formatted_address);


                } else {
                    alert('Location not found');
                }
            } else {

            }
        });


    }

    goo.event.addListener(map_in, 'click', clearSelection);
    goo.event.addDomListener(byId('clear_shapes'), 'click', clearShapes);
    /* goo.event.addDomListener(byId('save_encoded'), 'click', function () {
     var data = IO.IN(shapes, true);
     byId('data').value = JSON.stringify(data);
     });*/
    goo.event.addDomListener(byId('save_raw'), 'click', function () {
        var data = IO.IN(shapes, false);
       // if(typeof data[0].geometry !== 'undefined') {
            byId('data').value = JSON.stringify(data);
       // }

    });
    /* goo.event.addDomListener(byId('restore'), 'click', function () {

     if (this.shapes) {
     for (var i = 0; i < this.shapes.length; ++i) {
     this.shapes[i].setMap(null);
     }
     }
     this.shapes=IO.OUT(JSON.parse(byId('data').value),map_in);
     });*/


}

function drowgeofence() {
    if (shapes) {
        for (var i = 0; i < this.shapes.length; ++i) {
            shapes[i].setMap(null);
        }
    }
    shapes = IO.OUT(JSON.parse($('#data').val()), map_in);
    console.log(shapes);
}

var IO = {
    //returns array with storable google.maps.Overlay-definitions
    IN: function (arr,//array with google.maps.Overlays
                  encoded//boolean indicating whether pathes should be stored encoded
    ) {

        var shapes = [],
            goo = google.maps,
            shape, tmp, plotpoint;

        for (var i = 0; i < arr.length; i++) {
            shape = arr[i];
            tmp = {type: this.t_(shape.type), id: shape.id || null};


            switch (tmp.type) {
                case 'CIRCLE':
                    tmp.radius = shape.getRadius();
                    tmp.geometry = this.p_(shape.getCenter());
                    plotpoint = "POINT (" + tmp.geometry.join(' ') + ')';
                    tmp.custom_geometry = plotpoint;

                    break;
                case 'MARKER':
                    tmp.geometry = this.p_(shape.getPosition());
                    plotpoint = "POINT (" + tmp.geometry.join(' ') + ')';
                    tmp.custom_geometry = plotpoint;

                    break;
                case 'RECTANGLE':
                    tmp.geometry = this.b_(shape.getBounds());
                    break;
                case 'POLYLINE':
                    tmp.geometry = this.l_(shape.getPath(), encoded);
                    break;
                case 'POLYGON':
                    tmp.geometry = this.m_(shape.getPaths(), encoded);
                    tmp.geometry[0].push(tmp.geometry[0][0]);
                    plotpoint = tmp.geometry[0].join(' AND ').split(',').join(' ').split(" AND ").join(', ');
                    plotpoint = "POLYGON ((" + plotpoint + "))";
                    tmp.custom_geometry = plotpoint;
                    break;
            }
            shapes.push(tmp);
        }

        return shapes;
        //return plotpoint;
    },
    //returns array with google.maps.Overlays
    OUT: function (arr,//array containg the stored shape-definitions
                   map//map where to draw the shapes
    ) {


        var shapes = [],
            goo = google.maps,
            map = map || null,
            shape, tmp;

        for (var i = 0; i < arr.length; i++) {
            shape = arr[i];

            switch (shape.type) {
                case 'CIRCLE':
                    tmp = new goo.Circle({radius: Number(shape.radius), center: this.pp_.apply(this, shape.geometry)});
                    break;
                case 'MARKER':
                    tmp = new goo.Marker({position: this.pp_.apply(this, shape.geometry)});
                    break;
                case 'RECTANGLE':
                    tmp = new goo.Rectangle({bounds: this.bb_.apply(this, shape.geometry)});
                    break;
                case 'POLYLINE':
                    tmp = new goo.Polyline({path: this.ll_(shape.geometry)});
                    break;
                case 'POLYGON':

                    tmp = new goo.Polygon({paths: this.mm_(shape.geometry)});
                    break;
            }
            tmp.setValues({map: map, id: shape.id})
            shapes.push(tmp);
        }
        return shapes;
    },
    l_: function (path, e) {
        path = (path.getArray) ? path.getArray() : path;
        if (e) {
            return google.maps.geometry.encoding.encodePath(path);
        } else {
            var r = [];
            for (var i = 0; i < path.length; ++i) {
                r.push(this.p_(path[i]));
            }
            return r;
        }
    },
    ll_: function (path) {
        if (typeof path === 'string') {
            return google.maps.geometry.encoding.decodePath(path);
        }
        else {
            var r = [];
            for (var i = 0; i < path.length; ++i) {
                r.push(this.pp_.apply(this, path[i]));
            }
            return r;
        }
    },

    m_: function (paths, e) {
        var r = [];
        paths = (paths.getArray) ? paths.getArray() : paths;
        for (var i = 0; i < paths.length; ++i) {
            r.push(this.l_(paths[i], e));
        }
        return r;
    },
    mm_: function (paths) {
        var r = [];
        for (var i = 0; i < paths.length; ++i) {
            r.push(this.ll_.call(this, paths[i]));

        }
        return r;
    },
    p_: function (latLng) {
        return ([latLng.lat(), latLng.lng()]);
    },
    pp_: function (lat, lng) {
        return new google.maps.LatLng(lat, lng);
    },
    b_: function (bounds) {
        return ([this.p_(bounds.getSouthWest()),
            this.p_(bounds.getNorthEast())]);
    },
    bb_: function (sw, ne) {
        return new google.maps.LatLngBounds(this.pp_.apply(this, sw),
            this.pp_.apply(this, ne));
    },
    t_: function (s) {
        var t = ['CIRCLE', 'MARKER', 'RECTANGLE', 'POLYLINE', 'POLYGON'];
        for (var i = 0; i < t.length; ++i) {
            if (s === google.maps.drawing.OverlayType[t[i]]) {
                return t[i];
            }
        }
    }

}
