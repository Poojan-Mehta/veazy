/**
 * Created by bhavesh on 19/5/17.
 */
app.directive('googleplace', function() {
    return {
        require : 'ngModel',
        link : function(scope, element, attrs, model) {
            var options = {
                types :   ['(cities)'],
                componentRestrictions: {country: "in"}

            };
            scope.gPlace = new google.maps.places.Autocomplete(element[0],
                options);

            google.maps.event.addListener(scope.gPlace, 'place_changed',
                function() {
                    var geoComponents = scope.gPlace.getPlace();
                    var latitude = geoComponents.geometry.location.lat();
                    var longitude = geoComponents.geometry.location.lng();
                    var addressComponents = geoComponents.address_components;
                    scope.$apply(function() {
                        model.$setViewValue(element.val());
                        console.log(element.val());
                        scope.lat=latitude;
                        scope.long=longitude;
                        console.log("Latitude : "  + latitude +"  Longitude : " + longitude);
                    });
                });
        }

    };

}).directive('passwordStrength', [
        function () {
            return {
                require: 'ngModel',
                restrict: 'E',
                scope: {
                    password: '=ngModel'
                },

                link: function (scope, elem, attrs, ctrl) {
                    scope.$watch('password', function (newVal) {

                        scope.strength = isSatisfied(newVal && newVal.length >= 6) +
                            isSatisfied(newVal && /(?=.*\W)/.test(newVal)) +
                            isSatisfied(newVal && /\d/.test(newVal));

                        function isSatisfied(criteria) {
                            return criteria ? 1 : 0;
                        }
                    }, true);
                },
                template: '<div class="progress">' +
                '<div class="progress-bar progress-bar-danger" style="width: {{strength >= 1 ? 33.33 : 0}}%"></div>' +
                '<div class="progress-bar progress-bar-warning" style="width: {{strength >= 2 ? 33.33 : 0}}%"></div>' +
                '<div class="progress-bar progress-bar-success" style="width: {{strength >= 3 ? 33.33 : 0}}%"></div>' +
                '</div>'
            }
        }
    ])
    .directive('patternValidator', [
        function () {
            return {
                require: 'ngModel',
                restrict: 'A',
                link: function (scope, elem, attrs, ctrl) {
                    ctrl.$parsers.unshift(function (viewValue) {

                        var patt = new RegExp(attrs.patternValidator);

                        var isValid = patt.test(viewValue);

                        ctrl.$setValidity('passwordPattern', isValid);
                        return viewValue;
                    });
                }
            };
        }
    ])
    .directive('validPasswordC', function () {
        return {
            require: 'ngModel',
            scope: {
                reference: '=validPasswordC'
            },
            link: function (scope, elm, attrs, ctrl) {
                ctrl.$parsers.unshift(function (viewValue, $scope) {
                    var noMatch = viewValue != scope.reference;
                    ctrl.$setValidity('noMatch', !noMatch);
                    return (noMatch) ? noMatch : !noMatch;
                });

                scope.$watch("reference", function (value) {
                    ctrl.$setValidity('noMatch', value === ctrl.$viewValue);
                });
            }
        }
    });
    app.filter('trusted', ['$sce', function ($sce) {
       return $sce.trustAsResourceUrl;
    }]);


