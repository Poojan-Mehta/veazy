angular.module('VeazyApp').controller('coverletterController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {
    $scope.$on('$viewContentLoaded', function () {
        // initialize core components
        App.initAjax();
    });

    /** BASIC VARIABLE INITIALIZE */
    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $rootScope.user_productID = $stateParams.vpid;
    $scope.is_cl = false;

    

    if (localStorage.getItem('cp_status') == 'success') {
        toastr.success(localStorage.getItem('msg'));
        $http({
            method: 'GET',
            url: webservice_path + "downloadPaidCoverLetter",
            params: { filename: localStorage.getItem('cid'),'uid': $scope.uid, 'token': $scope.token, 'type': app_type },
            responseType: 'arraybuffer'
        }).success(function (data, status, headers) {
            headers = headers();
            var contentType = headers['content-type'];
            var filename = headers['filename'];
            download(data, filename, contentType);
        }).error(function (data, status, headers) {
            if (status == 402) {
                toastr.error('The file does not exist on server.');
            }
        });
        localStorage.removeItem('cp_status');
        localStorage.removeItem('msg');
        localStorage.removeItem('cid');
    }
    if (localStorage.getItem('cp_status') == 'fail') {
        toastr.error(localStorage.getItem('msg'));
        localStorage.removeItem('cp_status');
        localStorage.removeItem('msg');
        localStorage.removeItem('cid');
    }
    if ($rootScope.user_productID != undefined) {
        getProduct();    
    } else {
        $state.go('app.dashboard');
    }

    /** GET PRODUCT INFORMATIOON USING PRODUCT ID */
    function getProduct() {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getapplicationbyID?productID=" + $rootScope.user_productID + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
                .success(function (res) {
                    if (res.status == true) {
                        $rootScope.product = res.result.data;
                        /** CHECK WHEATHER COVERLETTER ALLOW OR NOT */
                        if ($rootScope.product.eAllowCoverLetter == 'yes') {
                            $scope.is_cl = true;
                            $scope.getcoverletter($rootScope.product.iFkCoverLetterId);
                        } else {
                            /** IF COVERLETTER NOT ALLOW RETURN TO PRODUCT DASHBOARD */
                            $state.go('product_app.home', { 'vpid': $rootScope.user_productID });
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        /** IF INVALID PRODUCT ID RETURN TO PRODUCT DASHBOARD */
                        $state.go('product_app.home', { 'vpid': $rootScope.user_productID });
                    }
                });
        }
    }

    /** GET COVER LETTER LIST
     *
     * @param iFkFAQId (array) is list of folders
     */
    $scope.getcoverletter = function (iFkCoverLetterId) {
        var param = { 'fieldvalue': iFkCoverLetterId, 'pid': $rootScope.product.iPkUserProductId, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type };
        $http.post(webservice_path + 'getUserCoverLetter', param).success(function (res) {
            if (res.status == true) {
                $scope.coverletterlist = res.result.data;
            }
        })
    };

    $scope.downloadFile = function (fileid,filename) {
        $http({
            method: 'GET',
            url: webservice_path + "downloadCoverLetter",
            params: { filename: fileid, 'pid': $rootScope.product.iPkUserProductId, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type, 'payment': $scope.eLessionPayment },
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
                $scope.createPayment(fileid);
            }
        });
    };

    $scope.createPayment = function(fileid){
        var param = { 'cid': fileid, 'pid': $rootScope.product.iPkUserProductId, 'uid': $scope.uid, 'token': $scope.token, 'type': app_type };
        $http.post(webservice_path + 'getUserCoverLetter', param).success(function (res) {
            if (res.status == true) {
                console.log(res.result.data);
                $scope.price = res.result.data[0].dCoverLetterPrice * 100;
                var k =
                    '<form action="' + webservice_path + 'coverletterPayment" method="POST">' +
                    '<input type="hidden" name="cid" value="' + fileid + '">' +
                    '<input type="hidden" name="pid" value="' + $rootScope.product.iPkUserProductId + '">' +
                    '<input type="hidden" name="token" value="' + $scope.token + '">' +
                    '<input type="hidden" name="amount" value="' + $scope.price + '">' +
                    '<script src="https://checkout.stripe.com/checkout.js" class="stripe-button" ' +
                    'data-key="' + publishable_key + '" data-amount="' + $scope.price + '" ' +
                    'data-currency="' + currency + '" data-name="' + data_name + '" data-description="Cover Letter Fee" ' +
                    'data-email="' + $rootScope.email + '" data-image="' + $scope.settings.layoutPath + '/img/veazy_logo.png" data-locale="auto" data-zip-code="false"></script></form>';
                $('.stripe_div').html(k);

                setTimeout(function () {
                    $('.stripe-button-el').click();
                }, 1000);
            }
        })
    };

});
