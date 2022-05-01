/***
GLobal Directives
***/

// Route State Load Spinner(used on page or content load)
VeazyApp.directive('ngSpinnerBar', ['$rootScope', '$state',
    function($rootScope, $state) {
        return {
            link: function(scope, element, attrs) {
                // by defult hide the spinner bar
                element.addClass('hide'); // hide spinner bar by default

                // display the spinner bar whenever the route changes(the content part started loading)
                $rootScope.$on('$stateChangeStart', function() {
                    element.removeClass('hide'); // show spinner bar
                });

                // hide the spinner bar on rounte change success(after the content loaded)
                $rootScope.$on('$stateChangeSuccess', function(event) {
                    element.addClass('hide'); // hide spinner bar
                    $('body').removeClass('page-on-load'); // remove page loading indicator
                    Layout.setAngularJsSidebarMenuActiveLink('match', null, event.currentScope.$state); // activate selected link in the sidebar menu
                   
                    // auto scorll to page top
                    //setTimeout(function () {
                    //    App.scrollTop(); // scroll to the top on content load
                    //}, $rootScope.settings.layout.pageAutoScrollOnLoad);
                });

                // handle errors
                $rootScope.$on('$stateNotFound', function() {
                    element.addClass('hide'); // hide spinner bar
                });

                // handle errors
                $rootScope.$on('$stateChangeError', function() {
                    element.addClass('hide'); // hide spinner bar
                });
            }
        };
    }
]);

// Handle global LINK click
VeazyApp.directive('a', function() {
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            if (attrs.ngClick || attrs.href === '' || attrs.href === '#') {
                elem.on('click', function(e) {
                    e.preventDefault(); // prevent link click for above criteria
                });
            }
        }
    };
});

// Handle Dropdown Hover Plugin Integration
VeazyApp.directive('dropdownMenuHover', function () {
  return {
    link: function (scope, elem) {
      elem.dropdownHover();
    }
  };  
});

VeazyApp.directive('ddTextCollapse', ['$compile', function($compile) {
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, element, attrs) {
            /* start collapsed */
            scope.collapsed = false;
            /* create the function to toggle the collapse */
            scope.toggle = function() {
                scope.collapsed = !scope.collapsed;
            };

            /* wait for changes on the text */
            attrs.$observe('ddTextCollapseText', function(text) {
                /* get the length from the attributes */
                var maxLength = scope.$eval(attrs.ddTextCollapseMaxLength);
                if (text.length > maxLength) {
                    /* split the text in two parts, the first always showing */
                    var firstPart = String(text).substring(0, maxLength);
                    var secondPart = String(text).substring(maxLength, text.length);
                    /* create some new html elements to hold the separate info */
                    var firstSpan = $compile('<span>' + firstPart + '</span>')(scope);
                    var secondSpan = $compile('<span ng-if="collapsed">' + secondPart + '</span>')(scope);
                    var moreIndicatorSpan = $compile('<span ng-if="!collapsed">... </span>')(scope);
                    var lineBreak = $compile('<br ng-if="collapsed">')(scope);
                    var toggleButton = $compile('<span class="collapse-text-toggle" ng-click="toggle()">{{collapsed ? "(read less)" : "(read more)"}}</span>')(scope);
                    /* remove the current contents of the element and add the new ones we created */
                    element.empty();
                    element.append(firstSpan);
                    element.append(secondSpan);
                    element.append(moreIndicatorSpan);
                    element.append(lineBreak);
                    element.append(toggleButton);
                }
                else {
                    element.empty();
                    element.append(text);
                }
            });
        }
    };
}]);

VeazyApp.directive("limitTo", [function() {
    return {
        restrict: "A",
        link: function(scope, elem, attrs) {
            var limit = parseInt(attrs.limitTo);
            angular.element(elem).on("keypress", function(event) {
                if (this.value.length == limit){
                    if (event.keyCode !== 8 && event.keyCode !== 46) {
                        event.preventDefault();
                    }
                }
            });
        }
    }
}]);

VeazyApp.directive("limitTexteditor", [function() {
    return {
        restrict: "A",
        link: function(scope, elem, attrs) {
            var limit = parseInt(attrs.limitTexteditor);
            angular.element(elem).on("keypress", function(event) {
                if (elem[0].innerText.length == 250){
                    if (event.keyCode !== 8 && event.keyCode !== 46) {
                        event.preventDefault();
                    }
                }
            });
        }
    }
}]);

VeazyApp.directive('loading',   ['$http' ,function ($http)
{
    return {
        restrict: 'A',
        template: '<div class="page-spinner-bar"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>',
        link: function (scope, elm, attrs) {
            scope.isLoading = function () {
                return $http.pendingRequests.length > 0;
            };
            scope.$watch(scope.isLoading, function (v) {
                if(v){
                    elm.show();
                }else{
                    elm.hide();
                }
            });
        }
    };
}]);

VeazyApp.filter('replaceA', function () {
    return function (text) {
        if (!text) {
            return text;
        }
        return text.replace('org', '300x300'); // Replaces all occurences
    };
});

VeazyApp.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.myEnter);
                });

                event.preventDefault();
            }
        });
    };
});

VeazyApp.filter('nl2br', function($sce){
    return function(msg,is_xhtml) {
        var is_xhtml = is_xhtml || true;
        var breakTag = (is_xhtml) ? '<br />' : '<br>';
        var msg = (msg + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
        return $sce.trustAsHtml(msg);
    }
});