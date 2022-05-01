'use strict';

app.service('dataService', function () {
    var _dataObj = {};
    this.dataObj = _dataObj;
});
app.filter('range', function() {
    return function(input, total) {
        total = parseInt(total);
        for (var i=0; i<total; i++)
            input.push(i);
        return input;
    };
});
app.directive('checkStrength', function () {

    return {
        replace: false,
        restrict: 'EACM',
        link: function (scope, iElement, iAttrs) {

            var strength = {
                colors: ['#F00', '#F90', '#FF0', '#9F0', '#0F0'],
                mesureStrength: function (p) {

                    var _force = 0;
                    var _regex = /[$-/:-?{-~!"^_`\[\]]/g;

                    var _lowerLetters = /[a-z]+/.test(p);
                    var _upperLetters = /[A-Z]+/.test(p);
                    var _numbers = /[0-9]+/.test(p);
                    var _symbols = _regex.test(p);

                    var _flags = [_lowerLetters, _upperLetters, _numbers, _symbols];
                    var _passedMatches = $.grep(_flags, function (el) { return el === true; }).length;

                    _force += 2 * p.length + ((p.length >= 10) ? 1 : 0);
                    _force += _passedMatches * 10;

                    // penality (short password)
                    _force = (p.length <= 6) ? Math.min(_force, 10) : _force;

                    // penality (poor variety of characters)
                    _force = (_passedMatches == 1) ? Math.min(_force, 10) : _force;
                    _force = (_passedMatches == 2) ? Math.min(_force, 20) : _force;
                    _force = (_passedMatches == 3) ? Math.min(_force, 40) : _force;

                    return _force;

                },
                getColor: function (s) {

                    var idx = 0;
                    if (s <= 10) { idx = 0; }
                    else if (s <= 20) { idx = 1; }
                    else if (s <= 30) { idx = 2; }
                    else if (s <= 40) { idx = 3; }
                    else { idx = 4; }

                    return { idx: idx + 1, col: this.colors[idx] };

                }
            };

            scope.$watch(iAttrs.checkStrength, function () {
                if (scope.pw === '') {
                    iElement.css({ "display": "none"  });
                } else {
                    var c = strength.getColor(strength.mesureStrength(scope.pw));
                    iElement.css({ "display": "inline" });
                    iElement.children('li')
                        .css({ "background": "#DDD" })
                        .slice(0, c.idx)
                        .css({ "background": c.col });
                }
            });

        },
        template: '<li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li>'
    };

});
/*app.directive('myDatePicker', ['$timeout', function($timeout){
    return {
        restrict: 'A',
        link: function(scope, elem, attrs){
            // timeout internals are called once directive rendering is complete
            $timeout(function(){
                $(elem).datePicker();
            });
        }
    };
}]);*/
/*app.service.factory('$toasterservice', ['toaster',
    function (toaster) {
        return {
            'show': function (type, title, text) {
                return toaster.pop({
                    type: type,
                    title: title,
                    body: text,
                    showCloseButton: false
                });
            }
        };
    }]);*/
app.directive('accessibleForm', function () {
    return {
        restrict: 'A',
        link: function (scope, elem) {

            // set up event handler on the form element
            elem.on('submit', function () {

                // find the first invalid element
                var firstInvalid = elem[0].querySelector('.ng-invalid');

                // if we find one, set focus
                if (firstInvalid) {
                    firstInvalid.focus();
                }
            });
        }
    };
});
app.directive('loading',   ['$http' ,function ($http)
    {
        return {
            restrict: 'A',
            template: '<div class="loading"><img src="../images/ajax-modal-loading.gif"/>LOADING...</div>',
            link: function (scope, elm, attrs)
            {
                scope.isLoading = function () {
                    return $http.pendingRequests.length > 0;
                };

                scope.$watch(scope.isLoading, function (v)
                {
                    if(v){
                        elm.show();
                    }else{
                        elm.hide();
                    }
                });
            }
        };

    }]);
app.directive('validNumber', function() {
    return {
        require: '?ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
            if(!ngModelCtrl) {
                return;
            }
            ngModelCtrl.$parsers.push(function(val) {
                if (angular.isUndefined(val)) {
                    var val = '';
                }
                var clean = val.replace(/[^0-9\.]/g, '');
                var decimalCheck = clean.split('.');

                if(!angular.isUndefined(decimalCheck[1])) {
                    decimalCheck[1] = decimalCheck[1].slice(0,2);
                    clean =decimalCheck[0] + '.' + decimalCheck[1];
                }

                if (val !== clean) {
                    ngModelCtrl.$setViewValue(clean);
                    ngModelCtrl.$render();
                }
                return clean;
            });

            element.bind('keypress', function(event) {
                if(event.keyCode === 32) {
                    event.preventDefault();
                }
            });
        }
    };
});
app.directive('validString', function() {
    return {
        require: '?ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
            if(!ngModelCtrl) {
                return;
            }

            ngModelCtrl.$parsers.push(function(val) {
                if (angular.isUndefined(val)) {
                    var val = '';
                }
                var clean = val.replace(/[^a-zA-Z\_\/]/, '');
                var decimalCheck = clean.split('.');

                if(!angular.isUndefined(decimalCheck[1])) {
                    decimalCheck[1] = decimalCheck[1].slice(0,2);
                    clean =decimalCheck[0] + '.' + decimalCheck[1];
                }

                if (val !== clean) {
                    ngModelCtrl.$setViewValue(clean);
                    ngModelCtrl.$render();
                }
                return clean;
            });

            element.bind('keypress', function(event) {
                if(event.keyCode === 32) {
                    event.preventDefault();
                }
            });
        }
    };
});
app.directive('showEmptyMsg', function ($compile, $timeout,$filter) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var msg = (attrs.showEmptyMsg) ? attrs.showEmptyMsg :  $filter('translate')('Sidebar.Nothing');
            var template = "<p style='text-align:center;margin:20px 0 0;' ng-hide='myData.length'>" + msg + "</p>";
            var tmpl = angular.element(template);
            $compile(tmpl)(scope);
            $timeout(function () {
                element.find('.ngViewport').append(tmpl);
            }, 2000);
        }
    };
});

app.directive('myDirective', function ($filter){
    return {
        'restrict': 'E',
        scope: { ngModel: '='},
        replace:true,
        link: function(scope, element, attr, controller) {
            //remove the default formatter from the input directive to prevent conflict
            controller.$formatters.push(function(data) {
                var d = new Date();
                d.setYear( data.substring(0, 4) );
                d.setMonth( data.substring(5, 7) );
                d.setDate( data.substring(8, 11) );

                //return d;
                return $filter('date')(d, 'yyyy-MM-dd');
            });

        }
    };
});

/*app.value('dateRangePickerConfig', {
    separator: ' - ',
    format: 'YYYY-MM-DD'
});*/
/*app.directive('accessibleForm', function () {
    return {
        restrict: 'A',
        link: function (scope, elem) {

            // set up event handler on the form element
            elem.on('submit', function () {

                // find the first invalid element
                var firstInvalid = elem[0].querySelector('.ng-invalid');
                console.log(firstInvalid);

               *//* if(firstInvalid.indexOf('_en') >= 0){
                    console.log('japan');
                }
                else
                {
                    console.log('english');
                }*//*
                // if we find one, set focus
                if (firstInvalid) {
                    firstInvalid.focus();

                }
            });
        }
    };
});*/

/*app.directive('dateRangePicker', ['$compile', '$timeout', '$parse', 'dateRangePickerConfig', function($compile, $timeout, $parse, dateRangePickerConfig) {
    return {
        require: 'ngModel',
        restrict: 'A',
        scope: {
            dateMin: '=min',
            dateMax: '=max',
            opts: '=options'
        },
        link: function($scope, element, attrs, modelCtrl) {
            var customOpts, el, opts, _formatted, _init, _picker, _validateMax, _validateMin;
            el = $(element);
            customOpts = $parse(attrs.dateRangePicker)($scope, {});
            opts = angular.extend({}, dateRangePickerConfig, customOpts);
            _picker = null;
            _formatted = function(viewVal) {
                var f;
                f = function(date) {
                    if (!moment.isMoment(date)) {
                        return moment(date).format(opts.format);
                    }
                    return date.format(opts.format);
                };
                if (opts.singleDatePicker) {
                    return f(viewVal.startDate);
                } else {
                    return [f(viewVal.startDate), f(viewVal.endDate)].join(opts.separator);
                }
            };
            _validateMin = function(min, start) {
                var valid;
                min = moment(min);
                start = moment(start);
                valid = min.isBefore(start) || min.isSame(start, 'day');
                modelCtrl.$setValidity('min', valid);
                return valid;
            };
            _validateMax = function(max, end) {
                var valid;
                max = moment(max);
                end = moment(end);
                valid = max.isAfter(end) || max.isSame(end, 'day');
                modelCtrl.$setValidity('max', valid);
                return valid;
            };
            modelCtrl.$formatters.push(function(val) {
                if (val && val.startDate && val.endDate) {
                    _picker.setStartDate(val.startDate);
                    _picker.setEndDate(val.endDate);
                    return val;
                }
                return '';
            });
            modelCtrl.$parsers.push(function(val) {
                if (!angular.isObject(val) || !(val.hasOwnProperty('startDate') && val.hasOwnProperty('endDate'))) {
                    return modelCtrl.$modelValue;
                }
                if ($scope.dateMin && val.startDate) {
                    _validateMin($scope.dateMin, val.startDate);
                } else {
                    modelCtrl.$setValidity('min', true);
                }
                if ($scope.dateMax && val.endDate) {
                    _validateMax($scope.dateMax, val.endDate);
                } else {
                    modelCtrl.$setValidity('max', true);
                }
                return val;
            });
            modelCtrl.$isEmpty = function(val) {
                return !val || (val.startDate === null || val.endDate === null);
            };
            modelCtrl.$render = function() {
                if (!modelCtrl.$modelValue) {
                    return el.val('');
                }
                if (modelCtrl.$modelValue.startDate === null) {
                    return el.val('');
                }
                return el.val(_formatted(modelCtrl.$modelValue));
            };
            _init = function() {
                el.daterangepicker(opts, function(start, end, label) {
                    return $timeout(function() {
                        return $scope.$apply(function() {
                            modelCtrl.$setViewValue({
                                startDate: start.toDate(),
                                endDate: end.toDate()
                            });
                            return modelCtrl.$render();
                        });
                    });
                });
                _picker = el.data('daterangepicker');
                return el;
            };
            _init();
            el.change(function() {
                if ($.trim(el.val()) === '') {
                    return $timeout(function() {
                        return $scope.$apply(function() {
                            return modelCtrl.$setViewValue({
                                startDate: null,
                                endDate: null
                            });
                        });
                    });
                }
            });
            if (attrs.min) {
                $scope.$watch('dateMin', function(date) {
                    if (date) {
                        if (!modelCtrl.$isEmpty(modelCtrl.$modelValue)) {
                            _validateMin(date, modelCtrl.$modelValue.startDate);
                        }
                        opts['minDate'] = moment(date);
                    } else {
                        opts['minDate'] = false;
                    }
                    return _init();
                });
            }
            if (attrs.max) {
                $scope.$watch('dateMax', function(date) {
                    if (date) {
                        if (!modelCtrl.$isEmpty(modelCtrl.$modelValue)) {
                            _validateMax(date, modelCtrl.$modelValue.endDate);
                        }
                        opts['maxDate'] = moment(date);
                    } else {
                        opts['maxDate'] = false;
                    }
                    return _init();
                });
            }
            if (attrs.options) {
                $scope.$watch('opts', function(newOpts) {
                    opts = angular.extend(opts, newOpts);
                    return _init();
                });
            }
            return $scope.$on('$destroy', function() {
                return _picker.remove();
            });
        }
    };
}]);*/

app.directive('aDisabled', function() {
    return {
        compile: function(tElement, tAttrs, transclude) {
            //Disable ngClick
            tAttrs["ngClick"] = "!("+tAttrs["aDisabled"]+") && ("+tAttrs["ngClick"]+")";

            //Toggle "disabled" to class when aDisabled becomes true
            return function (scope, iElement, iAttrs) {
                scope.$watch(iAttrs["aDisabled"], function(newValue) {
                    if (newValue !== undefined) {
                        iElement.toggleClass("disabled", newValue);
                    }
                });

                //Disable href on click
                iElement.on("click", function(e) {
                    if (scope.$eval(iAttrs["aDisabled"])) {
                        e.preventDefault();
                    }
                });
            };
        }
    };
});

app.directive('equalizeHeight', ['$timeout', function($timeout){
    return {
        restrict: 'A',
        controller: function($scope){

            var elements = [];
            this.addElement = function(element){

                elements.push(element);

            }

            // resize elements once the last element is found
            this.resize = function(){
                $timeout(function(){
                    ;
                    // find the tallest
                    var tallest = 0, height;
                    angular.forEach(elements, function(el){
                        height = el[0].offsetHeight;

                        if(height > tallest)
                            tallest = height;

                    });


                    // resize
                    angular.forEach(elements, function(el){
                        el[0].style.height = tallest + 'px';
                    });

                }, 0);
            };
        }
    };
}])

app.directive('equalizeHeightAdd', [function($timeout){
        return {
            restrict: 'A',
            require: '^^equalizeHeight',
            link: function(scope, element, attrs, ctrl_for){

                // add element to list of elements
                ctrl_for.addElement(element);
                if(scope.$last)
                    ctrl_for.resize();
            }
        };
    }])

