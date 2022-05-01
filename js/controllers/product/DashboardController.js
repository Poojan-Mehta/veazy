angular.module('VeazyApp').controller('productHomeController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal)
{
    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $rootScope.user_productID = $stateParams.vpid;
    $scope.isproduct = false;
    $scope.paramprod = {};
    $scope.eAllowApplicantDetails = 'no';
    $scope.eAllowFUT = 'no';
    $scope.eAllowFUTsponser = 'no';
    $scope.eAllowBusinessDetails = 'no';
    $scope.eAllowSponser = 'no';
    $scope.fut_main_details = '';
    $scope.fut_main_sponse_details = '';
    $scope.fut_main_family_details = '';
    $scope.business_main_details = '';
    $scope.business_sponse_details = '';

    $scope.sizeLimit = 1058576; // 10MB in Bytes
    $scope.fileSizeLabel = function() {
        // Convert Bytes To MB
        return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
    };

    

      if($rootScope.user_productID != undefined){
        getProduct();
      }else{
            $state.go('app.dashboard');
      }
     

    /** GET PRODUCT INFORMATION START */
    function getProduct(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "getapplicationbyID?productID=" + $rootScope.user_productID + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
                .success(function (res) {
                    if (res.status == true) {
                        $rootScope.product = res.result.data;
                        console.log($scope.products);
                        if($rootScope.product.vLodgmentDate != null){
                            $scope.paramprod.lodgement_date = new Date($rootScope.product.vLodgmentDate);
                        }else{
                            $scope.paramprod.lodgement_date = null;
                        }
                        $scope.paramprod.product_name = $scope.product.product_name;
                        $scope.paramprod.product_desc = $scope.product.product_desc;
                        $scope.paramprod.vTrnNumber = $scope.product.vTrnNumber;
                        $scope.paramprod.vFileNumber = $scope.product.vFileNumber;
                        $scope.paramprod.vLodgmentStatus = $scope.product.vLodgmentStatus;
                        $scope.paramprod.eIMMIUsername = $scope.product.eIMMIUsername;
                        $scope.paramprod.eIMMIPassword = $scope.product.eIMMIPassword;
                        $scope.isproduct = true;
                        $scope.eAllowApplicantDetails = $scope.product.eAllowApplicantDetails;
                        $scope.eAllowFUT = $scope.product.eAllowFUT;
                        $scope.eAllowFUTsponser = $scope.product.eAllowFUTsponser;
                        $scope.eAllowBusinessDetails = $scope.product.eAllowBusinessDetails;
                        $scope.eAllowSponser = $scope.product.eAllowSponser;
                        $scope.getkeySubjectElement($scope.product.iPkUserProductId);
                        $scope.getapplicantdetails($scope.product.iPkUserProductId);
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        $state.go('app.dashboard');
                    }
                });
        }
    }

    $scope.getkeySubjectElement = function(UserProductId){
        var param = {
            'lfid': $rootScope.product.iFkLessonId,
            'sfid': $rootScope.product.iFkSummaryId,
            'tfid': $rootScope.product.iFkToDoId,
            'allowdoc': $rootScope.product.eAllowDocumentChecklist,
            'pid': UserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + "getkeySubjectElement",param)
        .success(function (res) {
            if (res.status == true) {
                $scope.total_lessons = res.result.total_lessons;
                $scope.lessons_completed = res.result.lessons_completed;
                $scope.lessons_completed_per = res.result.lessons_completed_per;
                $scope.total_summary = res.result.total_summary;
                $scope.summary_completed = res.result.summary_completed;
                $scope.summary_completed_per = res.result.summary_completed_per;
                $scope.total_todo = res.result.total_todo;
                $scope.todo_completed = res.result.todo_completed;
                $scope.todo_completed_per = res.result.todo_completed_per;
                $scope.total_doc = res.result.total_doc;
                $scope.doc_completed = res.result.doc_completed;
                $scope.doc_completed_per = res.result.doc_completed_per;
                $scope.completed_percentage = res.result.completed_percentage;
            }
        });
    };

    $scope.getapplicantdetails = function(UserProductId){
        var param = {
            'pid': UserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + "getapplicantdetails",param)
            .success(function (res) {
                if (res.status == true) {
                    if(res.result.data.fut_main != undefined){
                        $scope.fut_main_details = res.result.data.fut_main[0];
                    }

                    if(res.result.data.fut_main_sponse != undefined){
                        $scope.fut_main_sponse_details = res.result.data.fut_main_sponse[0];
                    }

                    if(res.result.data.fut_main_family != undefined){
                        $scope.fut_main_family_details = res.result.data.fut_main_family;
                    }

                    if(res.result.data.business_main != undefined){
                        $scope.business_main_details = res.result.data.business_main[0];
                    }

                    if(res.result.data.business_sponse != undefined){
                        $scope.business_sponse_details = res.result.data.business_sponse[0];
                    }
                }
            });
    };
    /** GET PRODUCT INFORMATION END */

    /** UPDATE PRODUCT TITLE & DESCRIPTION START */
    $scope.updateInfo = function() {       
        $scope.updateInfoModal = $uibModal.open({
            animation: true,
            windowClass:'modal fade veazy_modal add_qn',
            templateUrl: "updateInfo.html",
            scope:$scope,
            size: 'lg'
        });
    };

    $scope.cancelInfoModal=function(){
        $scope.updateInfoModal.dismiss();
    };

    $scope.saveProductInfo = function(label_type) {
        $scope.paramprod.label_type = label_type;
        var param = {
            'fieldvalue': $scope.paramprod,
            'pid': $scope.product.iPkUserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        if(label_type == 'vTrnNumber'){
            if($scope.paramprod.vTrnNumber != $scope.product.vTrnNumber){
                $scope.savingProductInfo(param);
            }
        }else if(label_type == 'vFileNumber'){
            if($scope.paramprod.vFileNumber != $scope.product.vFileNumber){
                $scope.savingProductInfo(param);
            }
        }else if(label_type == 'vLodgmentStatus'){
            if($scope.paramprod.vLodgmentStatus != $scope.product.vLodgmentStatus){
                $scope.savingProductInfo(param);
            }
        }else if(label_type == 'username'){
            if($scope.paramprod.eIMMIUsername != $scope.product.eIMMIUsername){
                $scope.savingProductInfo(param);
            }
        }else if(label_type == 'password'){
            if($scope.paramprod.eIMMIPassword != $scope.product.eIMMIPassword){
                $scope.savingProductInfo(param);
            }
        }else{
            $scope.savingProductInfo(param);
        }
    };

    $scope.savingProductInfo = function(param) {
        $http.post(webservice_path + 'updateProductInfo', param).success(function (res) {
            if(res.status == true){
                getProduct();
                if($scope.updateInfoModal != undefined){
                    $scope.updateInfoModal.dismiss();
                }
            }
        }).error(function (res) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };
    /** UPDATE PRODUCT TITLE & DESCRIPTION END */

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
    /** LODGEMENT DETAILS END */

    /** LINK PRODUCT START */
    $scope.link = function(iPkUserProductId){
        $scope.product_link_with = iPkUserProductId;
        $scope.confirm_product_id = '';
        var param = {
            'pid':  iPkUserProductId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };

        $http.post(webservice_path + 'getlinkapplication', param).success(function (res) {
            if(res.status == true){
                $scope.link_products = res.result.data;
                $scope.total_link_products = res.result.total_products;
                if($scope.total_link_products != 0){
                    $scope.linkModal = $uibModal.open({
                        animation: true,
                        windowClass:'modal fade veazy_modal link_modal',
                        templateUrl: "linkproduct.html",
                        scope:$scope,
                        size: 'md'
                    });
                }else{
                    toastr.error('No any product found to link');
                }
            }
        }).error(function (res) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };

    $scope.link_product = function(iPkUserProductId){
        $scope.confirm_product_id = iPkUserProductId;
    };

    $scope.confirm_link = function(){
        var param = {
            'pid':  $scope.product_link_with,
            'lpid':  $scope.confirm_product_id,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'confirmlink', param).success(function (res) {
            if(res.status == true){
                $scope.confirm_product_id = '';
                $scope.linkModal.dismiss();
                getProduct();
                toastr.success('Your product has been linked');
            }
        }).error(function (res) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };

    $scope.close_link = function(){
        $scope.linkModal.dismiss();
    };
    /** LINK PRODUCT END **/

    /** UNLINK PRODUCT START **/
    $scope.unlink = function(unlink_product_id){
        $scope.unlink_product_id = unlink_product_id;
        $http.get(webservice_path + "getapplicationbyID?productID=" + unlink_product_id + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
            .success(function (res) {
                if (res.status == true) {
                    $scope.linked_product_name = res.result.data.product_name;
                    $scope.linked_product_image = res.result.data.vUserProductImage;
                    $scope.unlinkModal = $uibModal.open({
                        animation: true,
                        windowClass:'modal fade veazy_modal confirm_link',
                        templateUrl: "unlinkproduct.html",
                        scope:$scope,
                        size: 'md'
                    });
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    $state.go('app.dashboard');
                }
            });
    };

    $scope.close_unlink = function(){
        $scope.unlinkModal.dismiss();
    };

    $scope.confirm_unlink = function(){
        $http.get(webservice_path + "confirmunlink?pid=" + $scope.unlink_product_id + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type).success(function (res) {
            if(res.status == true){
                $scope.unlink_product_id = '';
                $scope.unlinkModal.dismiss();
                getProduct();
            }
        }).error(function (res) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };
    /** UNLINK PRODUCT END **/

    /** CHANGE PRODUCT IMAGE START **/

    $scope.uploadFile = function(files) {
        if(files[0] != undefined){
            $scope.ProfilePic = files[0];
            var formdata = new FormData();
            angular.forEach(files, function (value, key) {
                formdata.append('profilepic', value);
            });
        }else{
            $scope.ProfilePic = false;
        }
        if ($scope.ProfilePic) {
            if ($scope.ProfilePic.type == "image/jpeg" || $scope.ProfilePic.type == "image/png" || $scope.ProfilePic.type == "image/jpg" || $scope.ProfilePic.type == "image/gif") {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.ProfilePic.size));
                if (fileSize > $scope.sizeLimit) {
                    toastr.error('Sorry, the file is too large. <br/> The maximum allowed size is ' + $scope.fileSizeLabel(),'Very large file');
                    return false;
                } else {
                    formdata.append('token', $scope.token);
                    formdata.append('uid', $scope.uid);
                    formdata.append('type', app_type);
                    formdata.append('pid', $scope.product.iPkUserProductId);
                    $http({
                        method: 'POST',
                        url: webservice_path + 'updateAppicationProfile',
                        data: formdata,
                        headers: {
                            'Content-Type': undefined
                        }
                    }).success(function (res) {
                        if(res.status == true){
                            toastr.success(res.result.message);
                            getProduct();
                        }
                    }).error(function (res, status) {
                        if(res.status == false){
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

    /** CHANGE PRODUCT IMAGE END **/

    /** FAMILY UNIT TREE */
    $scope.gettags = function(applicantType){
        var param = {
            'pid': $scope.product.iPkUserProductId,
            'applicantType': applicantType,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + "getRelations",param)
            .success(function (res) {
                if (res.status == true) {
                    $scope.taglists = res.result.data;
                }
            });
    };

    $scope.changeTag = function(type){
        if($scope.display_tags){
            $scope.display_tags = false;
        }else{
            if(type == 'worker'){
                if($scope.business_sponse.id != ''){
                    $scope.showWarning();
                }else{
                    $scope.display_tags = true;
                }
            }else if(type == 'family'){
                if($scope.fut_main_family.id != ''){
                    $scope.showWarning();
                }else{
                    $scope.display_tags = true;
                }
            }else if(type == 'sponsor'){
                if($scope.fut_main_sponse.id != ''){
                    $scope.showWarning();
                }else{
                    $scope.display_tags = true;
                }
            }
        }
    };

    $scope.showWarning = function(){
        $scope.warningModal = $uibModal.open({
            animation: true,
            windowClass:'modal fade veazy_modal soc_modal dashboard_soc',
            templateUrl: "warning.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.tagYes = function(){
        $scope.display_tags = true;
        $scope.warningModal.dismiss();
    };

    $scope.tagNo = function(){
        $scope.warningModal.dismiss();
    };

    $scope.link_tag = function(tagID){
        $scope.confirm_tag_ID = tagID;
    };

    $scope.confirm_tag = function(vTagName){
        $scope.display_tags = false;
        $scope.selected_tag_name = vTagName;
        $scope.selected_tag_ID = $scope.confirm_tag_ID;
        $scope.confirm_tag_ID = '';
    };

    $scope.uploadProfilePicture = function (files, fut_type) {
        if(fut_type == 'fut_main'){
            $scope.fut_main_ProfilePic = files[0];
            $scope.fut_main_ProfilePic_param = files;
        }
        if(fut_type == 'fut_main_sponse'){
            $scope.fut_main_sponse_ProfilePic = files[0];
            $scope.fut_main_sponse_ProfilePic_param = files;
        }
        if(fut_type == 'fut_main_family'){
            $scope.fut_main_family_ProfilePic = files[0];
            $scope.fut_main_family_ProfilePic_param = files;
        }
        if(fut_type == 'business_main'){
            $scope.business_main_ProfilePic = files[0];
            $scope.business_main_ProfilePic_param = files;
        }
        if(fut_type == 'business_sponse'){
            $scope.business_sponse_ProfilePic = files[0];
            $scope.business_sponse_ProfilePic_param = files;
        }
        if (window.FileReader) {   //do this
            var reader = new FileReader();
            var fd = new FormData();

            var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
            if (Extension == "gif" || Extension == "png" || Extension == "bmp" || Extension == "jpeg" || Extension == "jpg") {
                fd.append("file", files[0]);
                var val = '';
                reader.onload = function (e) {
                    val = e.target.result;
                    if(fut_type == 'fut_main'){
                        $scope.fut_main_reviewImage = e.target.result;
                    }
                    if(fut_type == 'fut_main_sponse'){
                        $scope.fut_main_sponse_reviewImage = e.target.result;
                    }
                    if(fut_type == 'fut_main_family'){
                        $scope.fut_main_family_reviewImage = e.target.result;
                    }
                    if(fut_type == 'business_main'){
                        $scope.business_main_reviewImage = e.target.result;
                    }
                    if(fut_type == 'business_sponse'){
                        $scope.business_sponse_reviewImage = e.target.result;
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                };
                reader.readAsDataURL(files[0]);
            }
        }
    };

    /* MAIN APPLICANT START */
    $scope.addMainApplicant = function(){
        $scope.fut_main = {};
        $scope.fut_main.id = '';
        $scope.fut_main_reviewImage = '';
        $scope.fut_main_ProfilePic = false;
        $scope.addMainApplicantModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal',
            templateUrl: "add_main_app.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.editMainApplicant = function(){
        $scope.fut_main = {};
        $scope.fut_main.id = $scope.fut_main_details.iPkUserRelationId;
        $scope.fut_main.name = $scope.fut_main_details.vName;
        $scope.fut_main.family_name = $scope.fut_main_details.vFamilyName;
        $scope.fut_main.email = $scope.fut_main_details.vEmail;
        $scope.fut_main.phone = $scope.fut_main_details.vMobile;
        $scope.fut_main.address = $scope.fut_main_details.vAddress;
        if($scope.fut_main_details.vProfilePicture != ''){
            $scope.fut_main_reviewImage = $scope.fut_main_details.profilepic;
        }else{
            $scope.fut_main_reviewImage = '';
        }
        $scope.fut_main_ProfilePic = false;
        $scope.addMainApplicantModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal',
            templateUrl: "add_main_app.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.saveMainApplicant = function(){
        var formdata = new FormData();
        formdata.append('token', $scope.token);
        formdata.append('uid', $scope.uid);
        formdata.append('type', app_type);
        formdata.append('pid', $scope.product.iPkUserProductId);
        formdata.append('fut_main_name', $scope.fut_main.name);
        formdata.append('fut_main_family_name', $scope.fut_main.family_name);
        formdata.append('fut_main_email', $scope.fut_main.email);
        formdata.append('fut_main_phone', $scope.fut_main.phone);
        formdata.append('fut_main_address', $scope.fut_main.address);
        if($scope.fut_main.id != ''){
            formdata.append('id', $scope.fut_main.id);
            formdata.append('current_profile', $scope.fut_main_details.vProfilePicture);
        }
        if ($scope.fut_main_ProfilePic) {
            if ($scope.fut_main_ProfilePic.type == "image/jpeg" || $scope.fut_main_ProfilePic.type == "image/png" || $scope.fut_main_ProfilePic.type == "image/jpg" || $scope.fut_main_ProfilePic.type == "image/gif") {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.fut_main_ProfilePic.size));
                if (fileSize > $scope.sizeLimit) {
                    toastr.error('Sorry, image is too large. <br/> The maximum allowed size is ' + $scope.fileSizeLabel(),'Very large file');
                    return false;
                } else {
                    angular.forEach($scope.fut_main_ProfilePic_param, function (value, key) {
                        formdata.append('fut_main_ProfilePic', value);
                    });
                    $scope.savingMainApplicant(formdata);
                }
            } else {
                toastr.error('Profile picture must be valid image','File type');
            }
        } else {
            $scope.savingMainApplicant(formdata);
        }
    };

    $scope.savingMainApplicant = function(formdata){
        $http({
            method: 'POST',
            url: webservice_path + 'saveMainApplicant',
            data: formdata,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (res) {
            if(res.status == true){
                toastr.success(res.result.message);
                $scope.addMainApplicantModal.dismiss();
                $scope.getapplicantdetails($scope.product.iPkUserProductId);
            }
        }).error(function (res, status) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };

    $scope.closeMainApplicant = function(){
        $scope.addMainApplicantModal.dismiss();
    };
    /* MAIN APPLICANT END */

    /* SPONSER START */
    $scope.addSponser = function(){
        $scope.fut_main_sponse = {};
        $scope.fut_main_sponse.id = '';
        $scope.fut_main_sponse_reviewImage = '';
        $scope.fut_main_sponse_ProfilePic = false;
        /* RELATIONS */
        $scope.confirm_tag_ID = '';
        $scope.selected_tag_name = 'Select...';
        $scope.selected_tag_ID = '';
        $scope.display_tags = false;
        $scope.gettags('fut_main_sponse');
        /* END RELATIONS */
        $scope.addSponserModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal add_sponsar_modal',
            templateUrl: "add_sponser.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.editSponser = function(){
        $scope.fut_main_sponse = {};
        $scope.fut_main_sponse.id = $scope.fut_main_sponse_details.iPkUserRelationId;
        $scope.fut_main_sponse.name = $scope.fut_main_sponse_details.vName;
        $scope.fut_main_sponse.family_name = $scope.fut_main_sponse_details.vFamilyName;
        $scope.fut_main_sponse.email = $scope.fut_main_sponse_details.vEmail;
        $scope.fut_main_sponse.phone = $scope.fut_main_sponse_details.vMobile;
        $scope.fut_main_sponse.address = $scope.fut_main_sponse_details.vAddress;
        if($scope.fut_main_sponse_details.vProfilePicture != ''){
            $scope.fut_main_sponse_reviewImage = $scope.fut_main_sponse_details.profilepic;
        }else{
            $scope.fut_main_sponse_reviewImage = '';
        }
        $scope.fut_main_sponse_ProfilePic = false;
        /* RELATIONS */
        $scope.confirm_tag_ID = '';
        $scope.selected_tag_name = $scope.fut_main_sponse_details.vTagName;
        $scope.selected_tag_ID = $scope.fut_main_sponse_details.iFkTagId;
        $scope.display_tags = false;
        $scope.gettags('fut_main_sponse');
        /* END RELATIONS */
        $scope.addSponserModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal add_sponsar_modal',
            templateUrl: "add_sponser.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.saveSponser = function(){
        var formdata = new FormData();
        formdata.append('token', $scope.token);
        formdata.append('uid', $scope.uid);
        formdata.append('type', app_type);
        formdata.append('pid', $scope.product.iPkUserProductId);
        formdata.append('fut_main_sponse_name', $scope.fut_main_sponse.name);
        formdata.append('fut_main_sponse_family_name', $scope.fut_main_sponse.family_name);
        formdata.append('fut_main_sponse_email', $scope.fut_main_sponse.email);
        formdata.append('fut_main_sponse_phone', $scope.fut_main_sponse.phone);
        formdata.append('fut_main_sponse_address', $scope.fut_main_sponse.address);
        formdata.append('fut_main_sponse_type', $scope.selected_tag_ID);
        if($scope.fut_main_sponse.id != ''){
            formdata.append('id', $scope.fut_main_sponse.id);
            formdata.append('current_profile', $scope.fut_main_sponse_details.vProfilePicture);
        }
        if ($scope.fut_main_sponse_ProfilePic) {
            if ($scope.fut_main_sponse_ProfilePic.type == "image/jpeg" || $scope.fut_main_sponse_ProfilePic.type == "image/png" || $scope.fut_main_sponse_ProfilePic.type == "image/jpg" || $scope.fut_main_sponse_ProfilePic.type == "image/gif") {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.fut_main_sponse_ProfilePic.size));
                if (fileSize > $scope.sizeLimit) {
                    toastr.error('Sorry, image is too large. <br/> The maximum allowed size is ' + $scope.fileSizeLabel(),'Very large file');
                    return false;
                } else {
                    angular.forEach($scope.fut_main_sponse_ProfilePic_param, function (value, key) {
                        formdata.append('fut_main_sponse_ProfilePic', value);
                    });
                    $scope.savingSponser(formdata);
                }
            } else {
                toastr.error('Profile picture must be valid image','File type');
            }
        } else {
            $scope.savingSponser(formdata);
        }
    };

    $scope.savingSponser = function(formdata){
        $http({
            method: 'POST',
            url: webservice_path + 'saveSponser',
            data: formdata,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (res) {
            if(res.status == true){
                toastr.success(res.result.message);
                $scope.addSponserModal.dismiss();
                $scope.getapplicantdetails($scope.product.iPkUserProductId);
                /* RELATIONS */
                $scope.confirm_tag_ID = '';
                $scope.selected_tag_name = 'Select...';
                $scope.selected_tag_ID = '';
                $scope.display_tags = false;
                /* END RELATIONS */
            }
        }).error(function (res, status) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };

    $scope.closeSponser = function(){
        $scope.addSponserModal.dismiss();
    };
    /* SPONSER END */

    /* FAMILY MEMBER START */
    $scope.addFamily = function(){
        $scope.fut_main_family = {};
        $scope.fut_main_family.id = '';
        $scope.fut_main_family_reviewImage = '';
        $scope.fut_main_family_ProfilePic = false;
        /* RELATIONS */
        $scope.confirm_tag_ID = '';
        $scope.selected_tag_name = 'Select...';
        $scope.selected_tag_ID = '';
        $scope.display_tags = false;
        $scope.gettags('fut_main_family');
        /* END RELATIONS */
        $scope.addFamilyModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal add_sponsar_modal',
            templateUrl: "add_family.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.editFamily = function(family){
        if($scope.viewFamilyModal != undefined){
            $scope.viewFamilyModal.dismiss();
        }
        $scope.fut_main_family = {};
        $scope.fut_main_family.id = family.iPkUserRelationId;
        $scope.fut_main_family.name = family.vName;
        $scope.fut_main_family.family_name = family.vFamilyName;
        $scope.fut_main_family.email = family.vEmail;
        $scope.fut_main_family.phone = family.vMobile;
        $scope.fut_main_family.address = family.vAddress;
        $scope.fut_main_family.vProfilePicture = family.vProfilePicture;
        if(family.vProfilePicture != ''){
            $scope.fut_main_family_reviewImage = family.profilepic;
        }else{
            $scope.fut_main_family_reviewImage = '';
        }
        $scope.fut_main_family_ProfilePic = false;
        /* RELATIONS */
        $scope.confirm_tag_ID = '';
        $scope.selected_tag_name = family.vTagName;
        $scope.selected_tag_ID = family.iFkTagId;
        $scope.display_tags = false;
        $scope.gettags('fut_main_family');
        /* END RELATIONS */
        $scope.addFamilyModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal add_sponsar_modal',
            templateUrl: "add_family.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.saveFamily = function(){
        var formdata = new FormData();
        formdata.append('token', $scope.token);
        formdata.append('uid', $scope.uid);
        formdata.append('type', app_type);
        formdata.append('pid', $scope.product.iPkUserProductId);
        formdata.append('fut_main_family_name', $scope.fut_main_family.name);
        formdata.append('fut_main_family_family_name', $scope.fut_main_family.family_name);
        formdata.append('fut_main_family_email', $scope.fut_main_family.email);
        formdata.append('fut_main_family_phone', $scope.fut_main_family.phone);
        formdata.append('fut_main_family_address', $scope.fut_main_family.address);
        formdata.append('fut_main_family_type', $scope.selected_tag_ID);
        if($scope.fut_main_family.id != ''){
            formdata.append('id', $scope.fut_main_family.id);
            formdata.append('current_profile', $scope.fut_main_family.vProfilePicture);
        }
        if ($scope.fut_main_family_ProfilePic) {
            if ($scope.fut_main_family_ProfilePic.type == "image/jpeg" || $scope.fut_main_family_ProfilePic.type == "image/png" || $scope.fut_main_family_ProfilePic.type == "image/jpg" || $scope.fut_main_family_ProfilePic.type == "image/gif") {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.fut_main_family_ProfilePic.size));
                if (fileSize > $scope.sizeLimit) {
                    toastr.error('Sorry, image is too large. <br/> The maximum allowed size is ' + $scope.fileSizeLabel(),'Very large file');
                    return false;
                } else {
                    angular.forEach($scope.fut_main_family_ProfilePic_param, function (value, key) {
                        formdata.append('fut_main_family_ProfilePic', value);
                    });
                    $scope.savingFamily(formdata);
                }
            } else {
                toastr.error('Profile picture must be valid image','File type');
            }
        } else {
            $scope.savingFamily(formdata);
        }
    };

    $scope.savingFamily = function(formdata){
        $http({
            method: 'POST',
            url: webservice_path + 'savefamily',
            data: formdata,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (res) {
            if(res.status == true){
                toastr.success(res.result.message);
                $scope.addFamilyModal.dismiss();
                $scope.getapplicantdetails($scope.product.iPkUserProductId);
                /* RELATIONS */
                $scope.confirm_tag_ID = '';
                $scope.selected_tag_name = 'Select...';
                $scope.selected_tag_ID = '';
                $scope.display_tags = false;
                /* END RELATIONS */
            }
        }).error(function (res, status) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };

    $scope.closeFamily = function(){
        $scope.addFamilyModal.dismiss();
    };

    $scope.viewMembers = function(){
        $scope.viewFamilyModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal',
            templateUrl: "view_family.html",
            scope:$scope,
            size: 'md'
        });
    };
    /* FAMILY MEMBER END */

    /* BUSINESS APPLICANT START */
    $scope.addBusinessApplicant = function(){
        $scope.business_main = {};
        $scope.business_main.id = '';
        $scope.business_main_reviewImage = '';
        $scope.business_main_ProfilePic = false;
        $scope.addBusinessApplicantModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal',
            templateUrl: "add_business_app.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.editBusinessApplicant = function(){
        $scope.business_main = {};
        $scope.business_main.id = $scope.business_main_details.iPkUserRelationId;
        $scope.business_main.name = $scope.business_main_details.vName;
        $scope.business_main.family_name = $scope.business_main_details.vFamilyName;
        $scope.business_main.email = $scope.business_main_details.vEmail;
        $scope.business_main.phone = $scope.business_main_details.vMobile;
        $scope.business_main.address = $scope.business_main_details.vAddress;
        if($scope.business_main_details.vProfilePicture != ''){
            $scope.business_main_reviewImage = $scope.business_main_details.profilepic;
        }else{
            $scope.business_main_reviewImage = '';
        }
        $scope.business_main_ProfilePic = false;
        $scope.addBusinessApplicantModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal',
            templateUrl: "add_business_app.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.saveBusinessApplicant = function(){
        var formdata = new FormData();
        formdata.append('token', $scope.token);
        formdata.append('uid', $scope.uid);
        formdata.append('type', app_type);
        formdata.append('pid', $scope.product.iPkUserProductId);
        formdata.append('business_main_name', $scope.business_main.name);
        formdata.append('business_main_family_name', $scope.business_main.family_name);
        formdata.append('business_main_email', $scope.business_main.email);
        formdata.append('business_main_phone', $scope.business_main.phone);
        formdata.append('business_main_address', $scope.business_main.address);
        if($scope.business_main.id != ''){
            formdata.append('id', $scope.business_main.id);
            formdata.append('current_profile', $scope.business_main_details.vProfilePicture);
        }
        if ($scope.business_main_ProfilePic) {
            if ($scope.business_main_ProfilePic.type == "image/jpeg" || $scope.business_main_ProfilePic.type == "image/png" || $scope.business_main_ProfilePic.type == "image/jpg" || $scope.business_main_ProfilePic.type == "image/gif") {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.business_main_ProfilePic.size));
                if (fileSize > $scope.sizeLimit) {
                    toastr.error('Sorry, image is too large. <br/> The maximum allowed size is ' + $scope.fileSizeLabel(),'Very large file');
                    return false;
                } else {
                    angular.forEach($scope.business_main_ProfilePic_param, function (value, key) {
                        formdata.append('business_main_ProfilePic', value);
                    });
                    $scope.savingBusinessApplicant(formdata);
                }
            } else {
                toastr.error('Profile picture must be valid image','File type');
            }
        } else {
            $scope.savingBusinessApplicant(formdata);
        }
    };

    $scope.savingBusinessApplicant = function(formdata){
        $http({
            method: 'POST',
            url: webservice_path + 'saveBusinessApplicant',
            data: formdata,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (res) {
            if(res.status == true){
                toastr.success(res.result.message);
                $scope.addBusinessApplicantModal.dismiss();
                $scope.getapplicantdetails($scope.product.iPkUserProductId);
            }
        }).error(function (res, status) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };

    $scope.closeBusinessApplicant = function(){
        $scope.addBusinessApplicantModal.dismiss();
    };
    /* BUSINESS APPLICANT END */

    /* BUSINESS SPONSE START */
    $scope.addBusinessSponse = function(){
        $scope.business_sponse = {};
        $scope.business_sponse.id = '';
        $scope.business_sponse_reviewImage = '';
        $scope.business_sponse_ProfilePic = false;
        /* RELATIONS */
        $scope.confirm_tag_ID = '';
        $scope.selected_tag_name = 'Select...';
        $scope.selected_tag_ID = '';
        $scope.display_tags = false;
        $scope.gettags('business_sponse');
        /* END RELATIONS */
        $scope.addBusinessSponseModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal add_sponsar_modal',
            templateUrl: "add_business_sponse.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.editBusinessSponse = function(){
        $scope.business_sponse = {};
        $scope.business_sponse.id = $scope.business_sponse_details.iPkUserRelationId;
        $scope.business_sponse.name = $scope.business_sponse_details.vName;
        $scope.business_sponse.family_name = $scope.business_sponse_details.vFamilyName;
        $scope.business_sponse.email = $scope.business_sponse_details.vEmail;
        $scope.business_sponse.phone = $scope.business_sponse_details.vMobile;
        $scope.business_sponse.address = $scope.business_sponse_details.vAddress;
        if($scope.business_sponse_details.vProfilePicture != ''){
            $scope.business_sponse_reviewImage = $scope.business_sponse_details.profilepic;
        }else{
            $scope.business_sponse_reviewImage = '';
        }
        $scope.business_sponse_ProfilePic = false;

        /* RELATIONS */
        $scope.confirm_tag_ID = '';
        $scope.selected_tag_name = $scope.business_sponse_details.vTagName;
        $scope.selected_tag_ID = $scope.business_sponse_details.iFkTagId;
        $scope.display_tags = false;
        $scope.gettags('business_sponse');
        /* END RELATIONS */

        $scope.addBusinessSponseModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade add_main_app_modal add_sponsar_modal',
            templateUrl: "add_business_sponse.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.saveBusinessSponse = function(){
        var formdata = new FormData();
        formdata.append('token', $scope.token);
        formdata.append('uid', $scope.uid);
        formdata.append('type', app_type);
        formdata.append('pid', $scope.product.iPkUserProductId);
        formdata.append('business_sponse_name', $scope.business_sponse.name);
        formdata.append('business_sponse_family_name', $scope.business_sponse.family_name);
        formdata.append('business_sponse_email', $scope.business_sponse.email);
        formdata.append('business_sponse_phone', $scope.business_sponse.phone);
        formdata.append('business_sponse_address', $scope.business_sponse.address);
        formdata.append('business_sponse_type', $scope.selected_tag_ID);
        if($scope.business_sponse.id != ''){
            formdata.append('id', $scope.business_sponse.id);
            formdata.append('current_profile', $scope.business_sponse_details.vProfilePicture);
        }
        if ($scope.business_sponse_ProfilePic) {
            if ($scope.business_sponse_ProfilePic.type == "image/jpeg" || $scope.business_sponse_ProfilePic.type == "image/png" || $scope.business_sponse_ProfilePic.type == "image/jpg" || $scope.business_sponse_ProfilePic.type == "image/gif") {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.business_sponse_ProfilePic.size));
                if (fileSize > $scope.sizeLimit) {
                    toastr.error('Sorry, image is too large. <br/> The maximum allowed size is ' + $scope.fileSizeLabel(),'Very large file');
                    return false;
                } else {
                    angular.forEach($scope.business_sponse_ProfilePic_param, function (value, key) {
                        formdata.append('business_sponse_ProfilePic', value);
                    });
                    $scope.savingBusinessSponse(formdata);
                }
            } else {
                toastr.error('Profile picture must be valid image','File type');
            }
        } else {
            $scope.savingBusinessSponse(formdata);
        }
    };

    $scope.savingBusinessSponse = function(formdata){
        $http({
            method: 'POST',
            url: webservice_path + 'saveBusinessSponse',
            data: formdata,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (res) {
            if(res.status == true){
                toastr.success(res.result.message);
                $scope.addBusinessSponseModal.dismiss();
                $scope.getapplicantdetails($scope.product.iPkUserProductId);
                /* RELATIONS */
                $scope.confirm_tag_ID = '';
                $scope.selected_tag_name = 'Select...';
                $scope.selected_tag_ID = '';
                $scope.display_tags = false;
                /* END RELATIONS */
            }
        }).error(function (res, status) {
            if(res.status == false){
                toastr.error(res.result.message);
            }
        });
    };

    $scope.closeBusinessSponse = function(){
        $scope.addBusinessSponseModal.dismiss();
    };
    /* BUSINESS SPONSE END */
    /** FAMILY UNIT TREE END */
});