'use strict';
/* Controllers */
app.directive("limitTexteditor", [function() {
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
angular.module('app', ['tree.dropdown']);
app.controller('addpkgCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster','ipCookie','$modal','prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster,ipCookie,$modal,prompt) {

        $scope.pagename = 'Create Product';
        $scope.save_btn_name = 'Create';
        $scope.disable_btn = false;
        $scope.product_id = $stateParams.pkgid;
        $scope.user_id = localStorage.getItem('aid');        

        /** set variable for product element */
        $scope.allowapplicant = false;
        $scope.allowfut = false;
        $scope.allowfamilysponsor = false;
        $scope.allowbusiness = false;
        $scope.allowsponsorworker =false;

        /** set variable to allow widgets (By: Pradip)*/
        $scope.records = {};
        $scope.records.summaries = [];
        $scope.records.faq = [];
        $scope.records.coverletters = [];
        $scope.records.todo = [];
        $scope.records.lessons = [];
        $scope.allowsummary = false;
        $scope.allowfaq = false;
        $scope.allowdocument = false;
        $scope.allowcoverletter = false;
        $scope.allowtodo = false;
        $scope.allowlessons = false;
        $scope.lessonpayment = false;
        $scope.lesson_price = '';

        /** Related to Tags */
        $scope.tag = {};
        $scope.tag.family_member_name = '';
        $scope.tag.family_sponse_name = '';
        $scope.tag.business_sponse_name = '';

        /** main tags array */
        $scope.tags = {};
        $scope.tags.fut_main = [];
        $scope.tags.fut_main_family = [];
        $scope.tags.fut_main_sponse = [];
        $scope.tags.business_main = [];
        $scope.tags.business_sponse = [];

        /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
        if($scope.product_id == ''){
            toaster.pop('error','','Something went wrong.');
            $state.go("app.package");
        }

        /** Family tree code **/
        $scope.my_tree = {};
        $scope.my_data = [];
        $scope.family_tree = function(){
            $scope.my_data = [];
            var mainapp = [],familymembers = [], familysponser = [],business_main = [],business_sponser = [];
            angular.forEach($scope.tags, function(tags_value, tags_key) {
                angular.forEach(tags_value, function(value,key) {
                    if(tags_key == 'fut_main'){
                        mainapp.push({label:value.name})
                    }
                    if(tags_key == 'fut_main_family'){
                        familymembers.push({label:value.name})
                    }
                    if(tags_key == 'fut_main_sponse'){
                        familysponser.push({label:value.name})
                    }
                    if(tags_key == 'business_main'){
                        business_main.push({label:value.name})
                    }
                    if(tags_key == 'business_sponse'){
                        business_sponser.push({label:value.name})
                    }
                })
            });
            if(mainapp.length != 0){
                var children  = [];
                if(familymembers.length != 0){
                    children.push({label: 'Migrating Family Member', children:familymembers});
                }
                if(familysponser.length != 0){
                    children.push({label: 'Family Sponsor', children:familysponser});
                }
                $scope.my_data.push({label: 'Main Applicant', children:children})
            }
            if(business_main.length != 0){
                var children  = [];
                if(business_sponser.length != 0){
                    children.push({label: 'Sponsored Worker', children:business_sponser});
                }
                $scope.my_data.push({label: 'Business Applicant', children:children})
            }
            $timeout(function() {
                $scope.my_tree.expand_all();
            });
        };
        /** Family tree code end**/

        /** check_allow_element method check elements are checked or not */
        $scope.check_allowapplicant = function(){
            if($scope.allowapplicant == false){
                $scope.allowfut = false;
                $scope.allowfamilysponsor = false;
                $scope.tags.fut_main = [];
                $scope.tags.fut_main_family = [];
                $scope.tags.fut_main_sponse = [];
            }else{
                $scope.tags.fut_main = [{'name':'Main Applicant','folder':''}];
            }
            $scope.family_tree();
        };

        $scope.check_allowbusiness = function(){
            if($scope.allowbusiness == false){
                $scope.allowsponsorworker =false;
                $scope.tags.business_main = [];
                $scope.tags.business_sponse = [];
            }else{
                $scope.tags.business_main = [{'name':'Business Applicant','folder':''}];
            }
            $scope.family_tree();
        };

        $scope.check_allowfut = function(){
            if($scope.allowfut == false){
                $scope.tags.fut_main_family = [];
            }
            $scope.family_tree();
        };

        $scope.check_allowfamilysponsor = function(){
            if($scope.allowfamilysponsor == false){
                $scope.tags.fut_main_sponse = [];
            }
            $scope.family_tree();
        };

        $scope.check_allowsponsorworker = function(){
            if($scope.allowsponsorworker == false){
                $scope.tags.business_sponse = [];
            }
            $scope.family_tree();
        };

        /** check_allow_widget method check widget are checked or not */
        $scope.check_allow_widget = function(){
            if($scope.allowsummary == false){
                $scope.records.summaries = [];
            }

            if($scope.allowfaq == false){
                $scope.records.faq = [];
            }

            if($scope.allowcoverletter == false){
                $scope.records.coverletters = [];
            }

            if($scope.allowtodo == false){
                $scope.records.todo = [];
            }

            if($scope.allowlessons == false){
                $scope.records.lessons = [];
                $scope.lessonpayment = false;
                $scope.lesson_price = '';
            }
        };

        /** check_lesson_payment method check lesson payment are checked or not */
        $scope.check_lesson_payment = function(){
            if($scope.lessonpayment == false){
                $scope.lesson_price = '';
            }
        };        

        /** getMarketPlace method get market place listing */
        getMarketPlace();
        function getMarketPlace() {
            $scope.type='product';
            var paramd = { eType:$scope.type };
            $http.post(webservice_path + 'marketplace/getMarketPlace',paramd).success(function (res) {
                if (res.Status == 'True'){
                    $scope.marketlisting = res.Response;
                }
            });
        }

        /** getParentCategory method get product categories */
        getParentCategory();
        function getParentCategory() {
            $http.get(webservice_path + 'category/getParentCategory').success(function (res) {
                if (res.Status == 'True') {
                    $scope.product_categories = res.Response;
                }
            });
        }

        /** getSummaryCategory method get folder listing for summaries */
        getSummaryCategory();
        function getSummaryCategory() {
            $scope.type='summary';
            var param = { eType:$scope.type };
            $http.post(webservice_path + 'folder/getFolder',param).success(function (res) {
                if (res.Status == 'True'){
                    $scope.summary_folders = res.Response;
                }
            });
        }

        /** getFaq method get folder listing for FAQ */
        getFaq();
        function getFaq() {
            $scope.type='faq';
            var param = {eType:$scope.type};
            $http.post(webservice_path + 'folder/getFolder',param).success(function (res) {
                if (res.Status == 'True'){
                    $scope.faq_folders= res.Response;
                }
            });
        }

        /** getDocument method get folder listing for Document */
        getDocument();
        function getDocument() {
            $scope.type='document';
            var param = { eType:$scope.type };
            $http.post(webservice_path + 'folder/getFolder',param).success(function (res) {
                if (res.Status == 'True'){
                    $scope.document_folders= res.Response;
                }
            });
        }

        /** getCoverLetter method get folder listing for Cover letter */
        getCoverLetter();
        function getCoverLetter() {
            $scope.type='cover';
            var param = {eType:$scope.type};
            $http.post(webservice_path + 'folder/getFolder',param).success(function (res) {
                if (res.Status == 'True'){
                    $scope.coverletter_folders= res.Response;
                }
            });
        }

        /** getToDo method get folder listing for To Do */
        getToDo();
        function getToDo() {
            $scope.type='todo';
            var param = { eType:$scope.type };
            $http.post(webservice_path + 'folder/getFolder',param).success(function (res) {
                if (res.Status == 'True'){
                    $scope.todo_folders= res.Response;
                }
            });
        }

        /** getLessions method get folder listing for Lessons */
        getLessions();
        function getLessions() {
            $scope.type='lesson';
            var param = { eType:$scope.type };
            $http.post(webservice_path + 'folder/getFolder',param).success(function (res) {
                if (res.Status == 'True'){
                    $scope.lesson_folders= res.Response;
                }
            });
        }


        /** Add Tag for Family member */
        $scope.addTag = function()
        {
            $scope.addTagModal = $modal.open({
                animation: true,
                templateUrl: "addTag.html",
                scope:$scope,
                size: 'sm',
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.cancelTagModal = function(){
            $scope.addTagModal.dismiss();
        };

        $scope.saveTagName = function(){
            $scope.tags.fut_main_family.push({'name':$scope.tag.family_member_name,'folder':''});
            $scope.addTagModal.dismiss();
            toaster.pop('success', '','New Tag has been created');
            $scope.tag.family_member_name = '';
            $scope.family_tree();
        };
        /** End */

        /** Add Tag for Family Sponse */
        $scope.addSponseTag = function()
        {
            $scope.addSponseTagModal = $modal.open({
                animation: true,
                templateUrl: "addFamilySponseTag.html",
                scope:$scope,
                size: 'sm',
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.cancelSponseTagModal = function(){
            $scope.addSponseTagModal.dismiss();
        };

        $scope.saveSponseTagName = function(){
            $scope.tags.fut_main_sponse.push({'name':$scope.tag.family_sponse_name,'folder':''});
            $scope.addSponseTagModal.dismiss();
            toaster.pop('success', '','New Tag has been created');
            $scope.tag.family_sponse_name = '';
            $scope.family_tree();
        };
        /** End */

        /** Add Tag for Business Sponse */
        $scope.addBizzSponseTag = function()
        {
            $scope.addBizzSponseTagModal = $modal.open({
                animation: true,
                templateUrl: "addBizzSponseTag.html",
                scope:$scope,
                size: 'sm',
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.cancelBizzSponseTagModal = function(){
            $scope.addBizzSponseTagModal.dismiss();
        };

        $scope.saveBizzSponseTagName = function(){
            $scope.tags.business_sponse.push({'name':$scope.tag.business_sponse_name,'folder':''});
            $scope.addBizzSponseTagModal.dismiss();
            toaster.pop('success', '','New Tag has been created');
            $scope.tag.business_sponse_name = '';
            $scope.family_tree();
        };
        /** End */

        $scope.removeTag = function(main_key,key){
            prompt({
                message: 'Are you sure want to remove tag?',
                input: false,
                "buttons": [{"label": "Yes", "cancel": false, "primary": false}, {"label": "No", "cancel": false, "primary": false}]
            }).then(function (name) {
                if(name.label == 'Yes'){
                    if(main_key == 'fut_main'){
                        $scope.tags.fut_main.splice(key, 1);
                    }
                    if(main_key == 'fut_main_family'){
                        $scope.tags.fut_main_family.splice(key, 1);
                    }
                    if(main_key == 'fut_main_sponse'){
                        $scope.tags.fut_main_sponse.splice(key, 1);
                    }
                    if(main_key == 'business_main'){
                        $scope.tags.business_main.splice(key, 1);
                    }
                    if(main_key == 'business_sponse'){
                        $scope.tags.business_sponse.splice(key, 1);
                    }
                    $scope.family_tree();
                }
            });
        };

        /** Edit Product */
        if ($stateParams.pkgid) {
            $scope.pagename = 'Edit Product';
            $scope.save_btn_name = 'Update';
            $http.get(webservice_path +'Package/view/' + $scope.product_id).success(function(res)
            {
                if (res.Status == 'True') {
                    $scope.iFKMPId = res.Response.iFKMPId;
                    $scope.iFkVisaCatId = res.Response.iFkVisaCatId;
                    $scope.vVisaProductTitle = res.Response.vVisaProductTitle;
                    $scope.vVisaProductDesc = res.Response.vVisaProductDesc;                    
                    $scope.reviewImage = window.location.protocol + "//" + window.location.host + "/"+project_name + "/" + 'api/product/' + res.Response.product_image;
                    $scope.product_img_name = res.Response.vVisaProductImage;
                    if(res.Response.vVisaProductVideo != ''){
                        $scope.reviewVideo = window.location.protocol + "//" + window.location.host + "/"+project_name + "/" + 'api/product/' + res.Response.vVisaProductVideo;
                        $scope.product_video_name = res.Response.vVisaProductVideo;
                        $scope.isvideouploaded = true;
                    }

                    if(res.Response.eAllowApplicantDetails == 'yes'){
                        $scope.allowapplicant = true;
                    }

                    if(res.Response.eAllowBusinessDetails == 'yes'){
                        $scope.allowbusiness = true;
                    }

                    if(res.Response.eAllowFUT == 'yes'){
                        $scope.allowfut = true;
                    }

                    if(res.Response.eAllowFUTsponser == 'yes'){
                        $scope.allowfamilysponsor = true;
                    }

                    if(res.Response.eAllowSponser == 'yes'){
                        $scope.allowsponsorworker = true;
                    }

                    if(res.Response.eAllowDocumentChecklist == 'yes'){
                        $scope.allowdocument = true;
                    }

                    if(res.Response.eAllowLession == 'yes'){
                        $scope.allowlessons = true;
                        $timeout(function() {
                            $scope.records.lessons = res.Response.iFkLessonId;
                        });
                    }

                    if(res.Response.eLessionPayment == 'yes'){
                        $scope.lessonpayment = true;
                    }

                    $scope.lesson_price = res.Response.dLessionsPrice;
                    $scope.check_lesson_payment();

                    if(res.Response.eAllowSummary == 'yes'){
                        $scope.allowsummary = true;
                        $timeout(function() {
                            $scope.records.summaries = res.Response.iFkSummaryId;
                        });
                    }

                    if(res.Response.Pro_Features == 'yes'){
                        $scope.Pro_Features = true;
                    }

                    if(res.Response.eAllowCoverLetter == 'yes'){
                        $scope.allowcoverletter = true;
                        $timeout(function() {
                            $scope.records.coverletters = res.Response.iFkCoverLetterId;
                        });
                    }

                    if(res.Response.eAllowFaq == 'yes'){
                        $scope.allowfaq = true;
                        $timeout(function() {
                            $scope.records.faq = res.Response.iFkFAQId;
                        });
                    }

                    if(res.Response.eAllowToDo == 'yes'){
                        $scope.allowtodo = true;
                        $timeout(function() {
                            $scope.records.todo = res.Response.iFkToDoId;
                        });
                    }

                    angular.forEach(res.Response.tags, function (value, key) {
                        if(value.applicantType == 'fut_main'){
                            $scope.tags.fut_main.push({'name':value.vTagName,'folder':value.iDocFolderId,'price':value.dDocPrice,'tag_id':value.iPKTagId});
                        }
                        if(value.applicantType == 'fut_main_family'){
                            $scope.tags.fut_main_family.push({'name':value.vTagName,'folder':value.iDocFolderId,'price':value.dDocPrice,'tag_id':value.iPKTagId});
                        }
                        if(value.applicantType == 'fut_main_sponse'){
                            $scope.tags.fut_main_sponse.push({'name':value.vTagName,'folder':value.iDocFolderId,'price':value.dDocPrice,'tag_id':value.iPKTagId});
                        }
                        if(value.applicantType == 'business_main'){
                            $scope.tags.business_main.push({'name':value.vTagName,'folder':value.iDocFolderId,'price':value.dDocPrice,'tag_id':value.iPKTagId});
                        }
                        if(value.applicantType == 'business_sponse'){
                            $scope.tags.business_sponse.push({'name':value.vTagName,'folder':value.iDocFolderId,'price':value.dDocPrice,'tag_id':value.iPKTagId});
                        }
                    });
                    $scope.family_tree();

                }else if (res.StatusCode == '0'){
                    toaster.pop('error','',res.Message);
                    $state.go("app.package");
                }
            });
        }

        $scope.sizeLimit = 2097152; // 2MB in Bytes
        $scope.uploadFile = function (files, t) {
            if (window.FileReader) {  //do this
                var reader = new FileReader();
                var fd = new FormData();
                var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
                if (Extension == "gif" || Extension == "png" || Extension == "bmp" || Extension == "jpeg" || Extension == "jpg") {
                    fd.append("file", files[0]);
                    var val = '';
                    reader.onload = function (e) {
                        val = e.target.result;
                        $scope.reviewImage = e.target.result;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };
                    $scope.ProfilePic = files[0];
                    reader.readAsDataURL(files[0]);
                } else {
                    $scope.ProfilePic = files[0];
                }
            } else {
                $scope.ProfilePic = files[0];
            }
        };

        $scope.fileSizeLabel = function () {
            // Convert Bytes To MB
            return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
        };

        $scope.uploadProductVideo = function (files, t) {
            $scope.isvideouploaded = true;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            var Extension = files[0].name.substring(files[0].name.lastIndexOf('.') + 1).toLowerCase();
            if (Extension == "mp4" || Extension == "3gp" || Extension == "mpeg") {
                $scope.ProductVideo = files[0];
                var $source = $('#video_here');
                $source[0].src = URL.createObjectURL(files[0]);
                $source.parent()[0].load();
            } else {
                $scope.ProductVideo = files[0];
            }
        };

        $scope.add_package_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {                

                if($scope.allowbusiness == false && $scope.allowapplicant == false){
                    toaster.pop('error','Please allow either applicant details or business details.');
                }

                if($scope.lessonpayment == true){
                    if($scope.lesson_price == '' || $scope.lesson_price <= 0){
                        toaster.pop('error','Lesson price is required and must be greater than 0.');
                        return false;
                    }
                }

                var param = {
                    pkgId: $stateParams.pkgid,
                    iFKMPId:$scope.iFKMPId,
                    iFkVisaCatId:$scope.iFkVisaCatId,
                    vVisaProductTitle:$scope.vVisaProductTitle,
                    vVisaProductDesc: $scope.vVisaProductDesc,                    
                    allowapplicant: $scope.allowapplicant,
                    allowbusiness: $scope.allowbusiness,
                    allowfut: $scope.allowfut,
                    allowfamilysponsor: $scope.allowfamilysponsor,
                    allowsponsorworker: $scope.allowsponsorworker,
                    tags:JSON.stringify($scope.tags),
                    allowdocument: $scope.allowdocument,
                    allowlessons: $scope.allowlessons,
                    lessonpayment: $scope.lessonpayment,
                    lesson_price: $scope.lesson_price,
                    allowsummary: $scope.allowsummary,
                    allowfaq: $scope.allowfaq,
                    allowcoverletter: $scope.allowcoverletter,
                    allowtodo: $scope.allowtodo,
                    Pro_Features:$scope.Pro_Features,
                    records: JSON.stringify($scope.records),
                    productImage: $scope.ProfilePic,
                    product_img_name: $scope.product_img_name,
                    product_video_name: $scope.product_video_name
                };

                if ($stateParams.pkgid)
                {
                    if ($scope.ProfilePic) {
                        if ($scope.ProfilePic.type == "image/jpeg" || $scope.ProfilePic.type == "image/png" || $scope.ProfilePic.type == "image/jpg" || $scope.ProfilePic.type == "image/gif") {
                            // Perform File Size Check First
                            var fileSize = Math.round(parseInt($scope.ProfilePic.size));
                            if (fileSize > $scope.sizeLimit) {
                                toaster.pop('error','','Sorry, the product image is too large. The maximum allowed size is ' + $scope.fileSizeLabel());
                                return false;
                            } else {
                                if($scope.ProductVideo){
                                    if($scope.ProductVideo.type == "video/mp4" || $scope.ProductVideo.type == "video/mpeg" || $scope.ProductVideo.type == "video/3gp"){
                                        param['productVideo'] = $scope.ProductVideo;
                                        $scope.edit_package_form(param);
                                    }else{
                                        toaster.pop('error', 'File type', 'Invalid video type');
                                    }
                                }else{
                                    $scope.edit_package_form(param);
                                }
                            }
                        } else {
                            toaster.pop('error', 'File type', 'The product image must be an image file.');
                        }
                    } else {
                        var param = {
                            pkgId: $stateParams.pkgid,
                            iFKMPId:$scope.iFKMPId,
                            iFkVisaCatId:$scope.iFkVisaCatId,
                            vVisaProductTitle:$scope.vVisaProductTitle,
                            vVisaProductDesc: $scope.vVisaProductDesc,                            
                            allowapplicant: $scope.allowapplicant,
                            allowbusiness: $scope.allowbusiness,
                            allowfut: $scope.allowfut,
                            allowfamilysponsor: $scope.allowfamilysponsor,
                            allowsponsorworker: $scope.allowsponsorworker,
                            tags:JSON.stringify($scope.tags),
                            allowdocument: $scope.allowdocument,
                            allowlessons: $scope.allowlessons,
                            lessonpayment: $scope.lessonpayment,
                            lesson_price: $scope.lesson_price,
                            allowsummary: $scope.allowsummary,
                            allowfaq: $scope.allowfaq,
                            allowcoverletter: $scope.allowcoverletter,
                            allowtodo: $scope.allowtodo,
                            Pro_Features:$scope.Pro_Features,
                            records: JSON.stringify($scope.records),
                            product_img_name: $scope.product_img_name,
                            product_video_name: $scope.product_video_name
                        };
                        if($scope.ProductVideo){
                            if($scope.ProductVideo.type == "video/mp4" || $scope.ProductVideo.type == "video/mpeg" || $scope.ProductVideo.type == "video/3gp"){
                                param['productVideo'] = $scope.ProductVideo;
                                $scope.edit_package_form(param);
                            }else{
                                toaster.pop('error', 'File type', 'Invalid video type');
                            }
                        }else{
                            $scope.edit_package_form(param);
                        }
                    }
                }
                else
                {
                    if ($scope.ProfilePic) {
                        if ($scope.ProfilePic.type == "image/jpeg" || $scope.ProfilePic.type == "image/png" || $scope.ProfilePic.type == "image/jpg" || $scope.ProfilePic.type == "image/gif") {
                            // Perform File Size Check First
                            var fileSize = Math.round(parseInt($scope.ProfilePic.size));
                            if (fileSize > $scope.sizeLimit) {
                                toaster.pop('error','','Sorry, the product image is too large. The maximum allowed size is ' + $scope.fileSizeLabel());
                                return false;
                            } else {
                                if($scope.ProductVideo){
                                    if($scope.ProductVideo.type == "video/mp4" || $scope.ProductVideo.type == "video/mpeg" || $scope.ProductVideo.type == "video/3gp"){
                                        $scope.disable_btn = true;
                                        param['productVideo'] = $scope.ProductVideo;
                                        $http({
                                            method: 'POST',
                                            url: webservice_path + 'package/add',
                                            headers: {'Content-Type': 'multipart/form-data'},
                                            data: param,
                                            transformRequest: function (data, headersGetter) {
                                                var formData = new FormData();
                                                angular.forEach(data, function (value, key) {
                                                    formData.append(key, value);
                                                });
                                                var headers = headersGetter();
                                                delete headers['Content-Type'];
                                                return formData;
                                            }
                                        }).success(function (res) {
                                            if (res.Status == 'True') {
                                                $state.go("app.package");
                                                toaster.pop('success', '',res.Message);
                                            }else{
                                                toaster.pop('error','',res.Message);
                                            }
                                            $scope.disable_btn = false;
                                        });
                                    }else{
                                        toaster.pop('error', 'File type', 'Invalid video type');
                                    }
                                }else{
                                    toaster.pop('error', 'Video', 'Please select product video');
                                }
                            }
                        } else {
                            toaster.pop('error', 'File type', 'The product image must be an image file.');
                        }
                    } else {
                        toaster.pop('error', 'Image', 'Please select product image');
                    }
                }
            }
        };

        $scope.edit_package_form = function(param){
            $scope.disable_btn = true;
            $http({
                method: 'POST',
                url: webservice_path + 'package/edit',
                headers: {'Content-Type': 'multipart/form-data'},
                data: param,
                transformRequest: function (data, headersGetter) {
                    var formData = new FormData();
                    angular.forEach(data, function (value, key) {
                        formData.append(key, value);
                    });
                    var headers = headersGetter();
                    delete headers['Content-Type'];
                    return formData;
                }
            }).success(function (res) {
                if (res.Status == 'True') {
                    $state.go("app.package");
                    toaster.pop('success','',res.Message);
                }else{
                    toaster.pop('error','',res.Message);
                }
                $scope.disable_btn = false;
            });
        };
    }]);
