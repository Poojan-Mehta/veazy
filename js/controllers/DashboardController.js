angular.module('VeazyApp').controller('DashboardController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');
    $rootScope.maindashboard = 'true';
    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $scope.paramprod = {};
    
    /*$timeout(function () {    
        if($scope.is_plan_exists == 'no'){
            $state.go('app.maindashboard');
        }
    }, 2000);*/

    /*if (localStorage.getItem('suc') == 'success') {
        toastr.success(localStorage.getItem('msg'));
        localStorage.removeItem('suc');
        localStorage.removeItem('msg');
    }
    if (localStorage.getItem('suc') == 'fail') {
        toastr.error(localStorage.getItem('msg'));
        localStorage.removeItem('suc');
        localStorage.removeItem('msg');
    }*/

        /** get Plan Details Start*/

        setTimeout(function(){
          getPlan();
          getProduct();
        },1000);
        
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
                                $state.go('app.maindashboard');
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

        $scope.noplan = function(iPkUserProductId,title){
            $scope.cancel_product_id = iPkUserProductId;
            $scope.product_title = title;    
            //toastr.error('You can not access this. Because you do not have any Plan!'); 
        };

        $scope.upgradePlan = function(){

            setTimeout(
              function() 
              {                
                 $state.go('app.plan');
              }, 500);
            
        };

        /** get Plan Details End */

    /**START GET RECENT ADDED PRODUCT */
    

    function getProduct() {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getUserProductdashboard?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=2')
                .success(function (res) {
                    if (res.status == true) {
                        $scope.products = res.result.data;                      
                        console.clear();
                        console.log($scope.products);

                        $rootScope.recent_product = res.result.data;
                        $scope.total_products = res.result.total_products;
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    /**END GET RECENT ADDED PRODUCT */

    /**START UPDATE PRODUCT TITLE & DESCRIPTION*/
    $scope.updateInfo = function (user_product_id) {
        $http.get(webservice_path + "getapplicationbyID?productID=" + user_product_id + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
            .success(function (res) {
                if (res.status == true) {
                    $rootScope.product = res.result.data;
                    $scope.paramprod.product_name = $scope.product.product_name;
                    $scope.paramprod.product_desc = $scope.product.product_desc;
                    $scope.updateInfoModal = $uibModal.open({
                        animation: true,
                        windowClass: 'modal fade veazy_modal add_qn',
                        templateUrl: "updateInfo.html",
                        scope: $scope,
                        size: 'lg'
                    });
                }
            });
    };

    $scope.saveProductInfo = function (label_type) {
        $scope.paramprod.label_type = label_type;
        var param = {
            'fieldvalue': $scope.paramprod,
            'pid': $scope.product.iPkUserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };

        $http.post(webservice_path + 'updateProductInfo', param).success(function (res) {
            if (res.status == true) {
                getProduct();
                if($scope.updateInfoModal != undefined){
                    $scope.updateInfoModal.dismiss();
                }
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };

$scope.viewVideo = function () {

        $scope.selected_video = 'https://app.veazy.com.au/Sample1280.mp4?wmode=transparent&amp;rel=0&autoplay=1';
        $scope.selected_video1 = 'https://app.veazy.com.au/Sample1280.ogv?wmode=transparent&amp;rel=0&autoplay=1';
        //$scope.selected_video2 = 'http://app.veazy.com.au/small.ogv';
        $scope.selected_video3 = 'https://player.vimeo.com/video/383955895';

        $scope.videoModal = $uibModal.open({
            animation: true,
            windowClass: 'fade video_modal',
            templateUrl: "videoModal.html",
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            size: 'lg'
        });
    };

    $scope.closeVideo = function () {
        /**var vid = document.getElementById("modal-video");
        vid.pause();**/
        $scope.videoModal.dismiss();
    };

    /**END UPDATE PRODUCT TITLE & DESCRIPTION*/

    /** LINK PRODUCT START */
    $scope.link = function (iPkUserProductId) {
        $scope.product_link_with = iPkUserProductId;
        $scope.confirm_product_id = '';
        var param = {
            'pid': iPkUserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };

        $http.post(webservice_path + 'getlinkapplication', param).success(function (res) {
            if (res.status == true) {
                $scope.link_products = res.result.data;
                $scope.total_link_products = res.result.total_products;
                if ($scope.total_link_products != 0) {
                    $scope.linkModal = $uibModal.open({
                        animation: true,
                        windowClass: 'modal fade veazy_modal link_modal',
                        templateUrl: "linkproduct.html",
                        scope: $scope,
                        size: 'md'
                    });
                } else {
                    toastr.error('No any product found to link');
                }
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };

    $scope.close_link = function () {
        $scope.linkModal.dismiss();
    };

    $scope.link_product = function (iPkUserProductId) {
        $scope.confirm_product_id = iPkUserProductId;
    };

    $scope.confirm_link = function () {
        var param = {
            'pid': $scope.product_link_with,
            'lpid': $scope.confirm_product_id,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'confirmlink', param).success(function (res) {
            if (res.status == true) {
                $scope.confirm_product_id = '';
                $scope.linkModal.dismiss();
                getProduct();
                toastr.success('Your product has been linked');
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };
    /** LINK PRODUCT END **/

    /** UNLINK PRODUCT START **/
    $scope.unlink = function (unlink_product_id) {
        $scope.unlink_product_id = unlink_product_id;
        $http.get(webservice_path + "getapplicationbyID?productID=" + unlink_product_id + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
            .success(function (res) {
                if (res.status == true) {
                    $scope.linked_product_name = res.result.data.product_name;
                    $scope.linked_product_image = res.result.data.vUserProductImage;
                    $scope.unlinkModal = $uibModal.open({
                        animation: true,
                        windowClass: 'modal fade veazy_modal confirm_link',
                        templateUrl: "unlinkproduct.html",
                        scope: $scope,
                        size: 'md'
                    });
                }
            });
    };

    $scope.close_unlink = function () {
        $scope.unlinkModal.dismiss();
    };

    $scope.confirm_unlink = function () {
        $http.get(webservice_path + "confirmunlink?pid=" + $scope.unlink_product_id + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type).success(function (res) {
            if (res.status == true) {
                $scope.unlink_product_id = '';
                $scope.unlinkModal.dismiss();
                getProduct();
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };
    /** UNLINK PRODUCT END **/

    /** CHANGE PRODUCT IMAGE START **/
    $scope.sizeLimit = 1058576; // 10MB in Bytes
    $scope.uploadFile = function (files) {
        if (files[0] != undefined) {
            $scope.ProfilePic = files[0];
            var formdata = new FormData();
            angular.forEach(files, function (value, key) {
                formdata.append('profilepic', value);
            });
        } else {
            $scope.ProfilePic = false;
        }
        if ($scope.ProfilePic) {
            if ($scope.ProfilePic.type == "image/jpeg" || $scope.ProfilePic.type == "image/png" || $scope.ProfilePic.type == "image/jpg" || $scope.ProfilePic.type == "image/gif") {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.ProfilePic.size));
                if (fileSize > $scope.sizeLimit) {
                    toastr.error('Sorry, the file is too large. <br/> The maximum allowed size is ' + $scope.fileSizeLabel(), 'Very large file');
                    return false;
                } else {
                    formdata.append('token', $scope.token);
                    formdata.append('uid', $scope.uid);
                    formdata.append('type', app_type);
                    formdata.append('pid', $scope.profile_product_id);
                    $http({
                        method: 'POST',
                        url: webservice_path + 'updateAppicationProfile',
                        data: formdata,
                        headers: {
                            'Content-Type': undefined
                        }
                    }).success(function (res) {
                        if (res.status == true) {
                            toastr.success(res.result.message);
                            getProduct();
                        }
                    }).error(function (res, status) {
                        if (res.status == false) {
                            toastr.error(res.result.message);
                        }
                    });
                }
            } else {
                toastr.error('The profile image must be an image file.', 'File type');
            }
        } else {
            toastr.error('Please select profile picture', 'Image');
        }
    };

    $scope.getTheFiles = function (product_id) {
        $scope.profile_product_id = product_id;
    };
    $scope.fileSizeLabel = function () {
        // Convert Bytes To MB
        return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
    };

    /** CHANGE PRODUCT IMAGE END **/

    /** CANCEL SUBSCRIPTION */
    $scope.cancelSubscription = function(iPkUserProductId,title){
        $scope.cancel_product_id = iPkUserProductId;
        $scope.product_title = title;
    };

    $scope.cancelSubscriptionConfirm = function () {
        var param = {
            'pid': $scope.cancel_product_id,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'cancelSubscription', param).success(function (res) {
            if (res.status == true) {
                $scope.cancel_product_id = '';
                $scope.product_title = '';
                getProduct();
                toastr.success('Your application has been deleted');
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };
    /** CANCEL SUBSCRIPTION END */

    /** DUE DATE */
    $scope.dateOptions = {
        showWeeks: false,
        formatYear: 'yy'
    };

    $scope.assignDueDate = function (pid, duedate) {
        
        $scope.dateparam = {};
        if (duedate == null || duedate == '' || duedate == '-') {
            $scope.dateparam.duedate = new Date();
        } else {
            $scope.dateparam.duedate = duedate;
        }        

        $scope.pid = pid;
        $scope.assignDueDateModal = $uibModal.open({
            animation: true,
            windowClass: 'modal fade veazy_modal link_modal',
            templateUrl: "assignDueDate.html",
            scope: $scope,
            size: 'sm'
        });
    };

    $scope.closeassignDueDate = function () {
        $scope.dateparam = {};
        $scope.assignDueDateModal.dismiss();
    };

    $scope.chooseDate = function () {
        $scope.dueDate = $scope.dateparam.duedate.getDate() + '/' + parseInt($scope.dateparam.duedate.getMonth() + 1) + '/' + $scope.dateparam.duedate.getFullYear();
    };

    $scope.updateDueDate = function () {
        var param = {
            'pid': $scope.pid,
            'dtDeadLineDate': $scope.dateparam.duedate,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        //console.log(param);
        $http.post(webservice_path + 'updateDeadlineDate', param).success(function (res) {
            if (res.status == true) {
                $scope.dueDate = '';
                $scope.dateparam = {};
                $scope.pid = '';
                $scope.assignDueDateModal.dismiss();
                getProduct();
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };
});
