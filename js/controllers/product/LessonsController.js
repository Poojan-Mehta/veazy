angular.module('VeazyApp').controller('LessonsController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal, $sce) {
    

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $rootScope.user_productID = $stateParams.vpid;
    $scope.islesson = false;
    $scope.is_purchase = true;

    if (localStorage.getItem('suc') == 'success') {
        toastr.success(localStorage.getItem('msg'));
        localStorage.removeItem('suc');
        localStorage.removeItem('msg');
    }
    if (localStorage.getItem('suc') == 'fail') {
        toastr.error(localStorage.getItem('msg'));
        localStorage.removeItem('suc');
        localStorage.removeItem('msg');
    }
    if ($rootScope.user_productID != undefined) {
        getProduct();
    } else {
        $state.go('app.dashboard');
    }

    function getProduct() {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getapplicationbyID?productID=" + $rootScope.user_productID + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
                .success(function (res) {
                    if (res.status == true) {
                        $rootScope.product = res.result.data;
                        if ($rootScope.product.eAllowLession == 'yes') {
                            $scope.eLessionPayment = $rootScope.product.eLessionPayment;
                            $scope.getLesson();
                        } else {
                            $state.go('product_app.home', {'vpid': $rootScope.user_productID});
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        $state.go('product_app.home', {'vpid': $rootScope.user_productID});
                    }
                });
        }
    }

    $scope.getLesson = function () {        
        var param = {
            'fieldvalue': $rootScope.product.iFkLessonId,
            'pid': $rootScope.product.iPkUserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type,
            'payment': $scope.eLessionPayment
        };

        $http.post(webservice_path + 'getUserLessons', param).success(function (res) {
            if (res.status == true) {
                console.log(res);
                $scope.lessionlist = res.result.data;
                $scope.is_purchase = res.result.charge;
                $scope.islesson = true;
            }
        })
    };

    // if we use third party url like vimeo then we must have to use this below function for trusted url.
     $scope.trustSrc = function(src) {
        return $sce.trustAsResourceUrl(src);
     }

     $scope.viewVideo = function (videoId,lessonId) {
        var param = {
            'fieldvalue': videoId,
            'pid': $rootScope.product.iPkUserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type,
            'payment': $scope.eLessionPayment,
            'lessonId':lessonId
        };
        $http.post(webservice_path + 'getVideoFile', param)
            .success(function (res) {
                if (res.status == true) {
                    $scope.selected_video = res.result.data;
                    $scope.videoModal = $uibModal.open({
                        animation: true,
                        windowClass: 'fade video_modal',
                        templateUrl: "videoModal.html",
                        scope: $scope,
                        backdrop: 'static',
                        keyboard: false,
                        size: 'lg'
                    });
                }
            }).error(function (res) {
            if (res.status == false) {
                $scope.createPayment();
            }
        });
    };

    $scope.closeVideo = function () {
        var vid = document.getElementById("modal-video");
        //vid.pause();
        $scope.videoModal.dismiss();
    };


    $scope.downloadFile = function (filename,ptype) {
        $http({
            method: 'GET',
            url: webservice_path + "downloadResources",
            params: {
                filename: filename,
                'pid': $rootScope.product.iPkUserProductId,
                'uid': $scope.uid,
                'token': $scope.token,
                'type': app_type,
                'ptype':ptype,
                'payment': $scope.eLessionPayment
            },
            responseType: 'arraybuffer'
        }).success(function (data, status, headers) {
            headers = headers();
            var contentType = headers['content-type'];
            download(data, filename, contentType);
        }).error(function (data, status, headers) {
            if (status == 402) {
                toastr.error('The file does not exist on server.');
            }
            if (status == 400) {
                $scope.createPayment();
            }
        });
    };

    $scope.createPayment = function () {
        $scope.price = $rootScope.product.dLessionsPrice * 100;
        var k =
            '<form action="' + webservice_path + 'lessonPayment" method="POST">' +
            '<input type="hidden" name="pid" value="' + $rootScope.product.iPkUserProductId + '">' +
            '<input type="hidden" name="token" value="' + $scope.token + '">' +
            '<input type="hidden" name="amount" value="' + $scope.price + '">' +
            '<script src="https://checkout.stripe.com/checkout.js" class="stripe-button" ' +
            'data-key="' + publishable_key + '" data-amount="' + $scope.price + '" ' +
            'data-currency="' + currency + '" data-name="' + data_name + '" data-description="Lessions Fee" ' +
            'data-email="' + $rootScope.email + '" data-image="' + $scope.settings.layoutPath + '/img/veazy_logo.png" data-locale="auto" data-zip-code="false"></script></form>';
        $('.stripe_div').html(k);

        setTimeout(function () {
            $('.stripe-button-el').click();
        }, 1000);
    };

    $scope.updateLessonStatus = function (lessonId, lessonFolderId) {
        var param = {
            'fieldvalue': lessonId,
            'lfid': lessonFolderId,
            'pid': $rootScope.product.iPkUserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'updateLessonWatchedStatus', param).success(function (res) {
            if (res.status == true) {
                $scope.getLesson();
            }
        })
    }
});
 
