angular.module('VeazyApp').controller('documentController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {
    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $rootScope.user_productID = $stateParams.vpid;
    $scope.isdc = false;
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
    $scope.delete_doc_id = '';

    $scope.sizeLimit = 1058576; // 10MB in Bytes
    $scope.fileSizeLabel = function() {
        // Convert Bytes To MB
        return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
    };

    if (localStorage.getItem('t_status') == 'success') {
        toastr.success(localStorage.getItem('msg'));
        $http({
            method: 'GET',
            url: webservice_path + "downloadPaidDocument",
            params: { filename: localStorage.getItem('zipFile'),'uid': $scope.uid, 'token': $scope.token, 'type': app_type },
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
        localStorage.removeItem('t_status');
        localStorage.removeItem('msg');
        localStorage.removeItem('rid');
        localStorage.removeItem('zipFile');
    }
    if (localStorage.getItem('t_status') == 'fail') {
        toastr.error(localStorage.getItem('msg'));
        localStorage.removeItem('t_status');
        localStorage.removeItem('msg');
        localStorage.removeItem('rid');
    }

    if ($rootScope.user_productID != undefined) {
        getProduct();
    } else {
        $state.go('app.dashboard');
    }

    /** ON BLUR CHANGE */
    $scope.onBlur = function(iPkUserDocId,iPkDocId,iFkDocCatId,status,eUserDocType,message,coloumnname) {

        // var paramd = {
        //     pid: pid,
        //     message:message,
        //     coloumn: coloumnname
        // };
        $scope.status_doc_ID = iPkDocId;
        $scope.status_doc_Type = eUserDocType;
        $scope.status_doc_cat_ID = iFkDocCatId;
        $scope.status = {};
        $scope.status.selectedStatus = status;
        var paramd = {
            'uid': $scope.uid,
            'userdoc':iPkUserDocId,
            'docid': $scope.status_doc_ID,
            'dcid': $scope.status_doc_cat_ID,
            'doc_type': $scope.status_doc_Type,
            'relationid': $scope.selected_Relation_ID,
            'pid': $scope.product.iPkUserProductId,
            'token': $scope.token,
            'status': $scope.status.selectedStatus,
            'type': app_type,
            'message':message,
            'coloumnname':coloumnname
        };
        if(paramd.message != undefined){
            $http.post(webservice_path + 'editdconblur', paramd).success(function (res) {
                console.log(res);
                if (res.status == true) {

                }
            });
        }
    };

    $scope.scrolldown = function(){
	$('html, body').animate({
	    scrollTop: $(".template_buy").offset().top
	}, 1500);
    };

    function getProduct() {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getapplicationbyID?productID=" + $rootScope.user_productID + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
                .success(function (res) {
                    if (res.status == true) {
                        $rootScope.product = res.result.data;
                        if ($rootScope.product.eAllowDocumentChecklist == 'yes') {
                            $scope.isdc = true;
                            $scope.eAllowApplicantDetails = $scope.product.eAllowApplicantDetails;
                            $scope.eAllowFUT = $scope.product.eAllowFUT;
                            $scope.eAllowFUTsponser = $scope.product.eAllowFUTsponser;
                            $scope.eAllowBusinessDetails = $scope.product.eAllowBusinessDetails;
                            $scope.eAllowSponser = $scope.product.eAllowSponser;
                            $scope.getapplicantdetails($scope.product.iPkUserProductId);
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

                    $timeout(function () {
                        $('#family-member').slimscroll({
                            axis: 'both',
                            railVisible: true,
                            height:'200px'
                        });
                    });
                }
            });
    };

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
                if($scope.selected_Relation_ID != undefined){
                    $scope.getDocumentChecklist($scope.selected_Relation_ID);
                }
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
                if($scope.selected_Relation_ID != undefined){
                    $scope.getDocumentChecklist($scope.selected_Relation_ID);
                }
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
                if($scope.selected_Relation_ID != undefined){
                    $scope.getDocumentChecklist($scope.selected_Relation_ID);
                }
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

    /** DOCUMENT LISTING START HERE */
    $scope.documentprice = false;

    $scope.getDocuments = function (iPkUserRelationId) {
        $scope.documentprice = false;
        $scope.t_price = '';
        $scope.document_listing = {};
        $scope.add_item_cat_id = '';
        $scope.selected_Relation_ID = iPkUserRelationId;
        var param = {
            'uid': $scope.uid,
            'pid': $scope.product.iPkUserProductId,
            'relationid': iPkUserRelationId,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + "getDocuments",param)
            .success(function (res) {
                if (res.status == true) {
                    $scope.documentprice = true;
                        
                    console.log(res.result.data);
                    $scope.document_listing = res.result.data;
                    $('html, body').animate({
                        scrollTop: $("#doc-listing").offset().top -400
                    }, 1000);
                    $scope.t_price = res.result.t_price;
                    $scope.templates = res.result.templates;
                }
            });
    };

    $scope.getDocumentChecklist = function (iPkUserRelationId) {
        $scope.add_item_cat_id = '';
        $scope.selected_Relation_ID = iPkUserRelationId;
        var param = {
            'uid': $scope.uid,
            'pid': $scope.product.iPkUserProductId,
            'relationid': iPkUserRelationId,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + "getDocuments",param)
            .success(function (res) {
                if (res.status == true) {
                    $scope.document_listing = res.result.data;
                    $scope.t_price = res.result.t_price;
                    console.log($scope.document_listing);
                }
            });
    };

    $scope.checkDocument = function(iPkDocId,iFkDocCatId,eUserDocType) {
        $scope.selected_doc_ID = iPkDocId;
        $scope.selected_doc_cat_ID = iFkDocCatId;
        $scope.selected_doc_Type = eUserDocType;
    };

    $scope.docSizeLimit = 10585760; // 10MB in Bytes
    $scope.docFileSizeLabel = function() {
        // Convert Bytes To MB
        return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
    };

    $scope.uploadDocument = function (files) {
        if (files[0] != undefined) {
            $scope.docFile = files[0];
            var formdata = new FormData();
            angular.forEach(files, function (value, key) {
                formdata.append('docFile', value);
            });
        } else {
            $scope.docFile = false;
        }
        if ($scope.docFile) {
            var Extension =$scope.docFile.name.substring($scope.docFile.name.lastIndexOf('.') + 1).toLowerCase();
            var arr=["BMP",
                "CSV",
                "DOC",
                "DOCX",
                "EML",
                "GIF",
                "JPEG",
                "JPG",
                "KEYNOTE",
                "MSG",
                "NUMBERS",
                "ODF",
                "ODS",
                "ODT",
                "PAGES",
                "PDF",
                "PNG",
                "PPT",
                "PPTX",
                "RAR",
                "RTF",
                "RTF/TEXT",
                "TIF",
                "TIFF",
                "TXT",
                "XLS",
                "XLSX",
                "XLSX",
                "ZIP",
                "7Z"];
            if (arr.indexOf(Extension.toUpperCase())!=-1) {
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.docFile.size));
                if (fileSize > $scope.docSizeLimit) {
                    toastr.error('Sorry, the file is too large. <br/> The maximum allowed size is ' + $scope.docFileSizeLabel(), 'Very large file');
                    return false;
                } else {
                    formdata.append('token', $scope.token);
                    formdata.append('uid', $scope.uid);
                    formdata.append('type', app_type);
                    formdata.append('relationid', $scope.selected_Relation_ID);
                    formdata.append('pid', $scope.product.iPkUserProductId);
                    formdata.append('docid', $scope.selected_doc_ID);
                    formdata.append('dcid', $scope.selected_doc_cat_ID);
                    formdata.append('doc_type', $scope.selected_doc_Type);

                    $http({
                        method: 'POST',
                        url: webservice_path + 'uploadDocument',
                        data: formdata,
                        headers: {
                            'Content-Type': undefined
                        }
                    }).success(function (res) {
                        if (res.status == true) {
                            toastr.success(res.result.message);
                            $scope.getDocumentChecklist($scope.selected_Relation_ID);
                        }
                    }).error(function (res, status) {
                        if (res.status == false) {
                            toastr.error(res.result.message);
                        }
                    });
                }
            } else {
                toastr.error('Invalid Document File type.', 'File type');
            }
        } else {
            toastr.error('Please select profile picture', 'Image');
        }
    };

    $scope.deleteDocument = function(iPkUserDocId,docType){
        $scope.delete_doc_ID = iPkUserDocId;
        $scope.delete_doc_type = docType;
        $scope.deleteDocModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade note_confirm',
            templateUrl: "delete_document.html",
            scope:$scope,
            size: 'md'
        });
    };

    $scope.deleteDocConfirm = function(){
        var param = {
            'uid': $scope.uid,
            'udid': $scope.delete_doc_ID,
            'doc_type': $scope.delete_doc_type,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + "deleteDocument",param)
            .success(function (res) {
                if (res.status == true) {
                    $scope.deleteDocModal.dismiss();
                    $scope.getDocumentChecklist($scope.selected_Relation_ID);
                }
            });
    };

    $scope.deleteDocNo = function(){
        $scope.deleteDocModal.dismiss();
    };

    $scope.changeStatus = function(iPkDocId,iFkDocCatId,status,eUserDocType){
        $scope.status_doc_ID = iPkDocId;
        $scope.status_doc_Type = eUserDocType;
        $scope.status_doc_cat_ID = iFkDocCatId;
        $scope.status = {};
        $scope.status.selectedStatus = status;
        $scope.changeStatusModal = $uibModal.open({
            animation: true,
            windowClass:'modal veazy_modal fade',
            templateUrl: "change_status.html",
            scope:$scope,
            size: 'sm'
        });
    };

    $scope.updateStatus = function(){
        var param = {
            'uid': $scope.uid,
            'docid': $scope.status_doc_ID,
            'dcid': $scope.status_doc_cat_ID,
            'doc_type': $scope.status_doc_Type,
            'status': $scope.status.selectedStatus,
            'relationid': $scope.selected_Relation_ID,
            'pid': $scope.product.iPkUserProductId,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + "updateDocStatus",param)
            .success(function (res) {
                if (res.status == true) {
                    $scope.changeStatusModal.dismiss();
                    $scope.getDocumentChecklist($scope.selected_Relation_ID);
                }
            });
    };

    $scope.docparam = {};
    $scope.addItem = function(cat_id){
        $scope.add_item_cat_id = cat_id;
        $scope.docparam.doc_title = '';
        $scope.docparam.doc_guide = '';
    };

    $scope.createDoc = function () {
        if ($scope.docparam.doc_title != '' && $scope.docparam.doc_title != undefined) {
            var param = {
                'pid': $scope.product.iPkUserProductId,
                'doc_title': $scope.docparam.doc_title,
                'doc_guide': $scope.docparam.doc_guide,
                'doc_comment': $scope.docparam.doc_comment,
                'dcid': $scope.add_item_cat_id,
                'relationid': $scope.selected_Relation_ID,
                'uid': $scope.uid,
                'token': $scope.token,
                'type': app_type
            };

            $http.post(webservice_path + 'createNewDocument', param).success(function (res) {
                if (res.status == true) {
                    $scope.docparam = {};
                    $scope.add_item_cat_id = '';
                    $scope.getDocumentChecklist($scope.selected_Relation_ID);
                }
            }).error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
        }
    };

    var myHeaders = new Headers(); 
    myHeaders.append('Content-Type', 'application/zip');
	myHeaders.get('Content-Type'); // Returns 'image/jpeg'

    $scope.buyTemplate = function(){
        $scope.price = $scope.t_price * 100;
        var k =
            '<form action="' + webservice_path + 'documentPayment" method="POST">' +
            '<input type="hidden" name="relation_id" value="' + $scope.selected_Relation_ID + '">' +
            '<input type="hidden" name="pid" value="' + $rootScope.product.iPkUserProductId + '">' +
            '<input type="hidden" name="token" value="' + $scope.token + '">' +
            '<script src="https://checkout.stripe.com/checkout.js" class="stripe-button" ' +
            'data-key="' + publishable_key + '" data-amount="' + $scope.price + '" ' +
            'data-currency="' + currency + '" data-name="' + data_name + '" data-description="Template Pack Fees" ' +
            'data-email="' + $rootScope.email + '" data-image="' + $scope.settings.layoutPath + '/img/veazy_logo.png" data-locale="auto" data-zip-code="false"></script></form>';
        $('.stripe_div').html(k);

        setTimeout(function () {
            $('.stripe-button-el').click();
        }, 1000);
    };

    $scope.downloadTemplate = function(){
        $http({
            method: 'GET',
            url: webservice_path + "downloadPaidDocument",
            params: { 'relation_id': $scope.selected_Relation_ID,'pid': $scope.product.iPkUserProductId,'uid': $scope.uid, 'token': $scope.token, 'type': app_type },
            responseType: 'arraybuffer'
        }).success(function (data, status, headers) {
            headers = headers();
            var contentType = headers['content-type'];
            var filename = headers['filename'];
            download(data, filename, contentType);
        }).error(function (data, status, headers) {
            if (status == 404) {
                toastr.error('The file does not exist on server.');
            }
            if (status == 402) {
                toastr.error('Unable to download templates.');
            }
        });
    };
    /** DOCUMENT LISTING END HERE */

})/*.directive('focusMe', ['$timeout', '$parse', function ($timeout, $parse) {
    return {
        link: function (scope, element, attrs) {
            var model = $parse(attrs.focusMe);
            scope.$watch(model, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
        }
    };
}])*/;
