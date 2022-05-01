angular.module('VeazyApp').controller('notesController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {
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
    $scope.is_note = false;
    $scope.notesData = {};
    $scope.notesData.iPkUserNotesId = '';
    $scope.notesData.vTitle = '';
    $scope.notesData.tDescription = '';

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
                        $scope.getNotes();
                        $scope.is_note = true;
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

    /**BEGIN GET NOTES LISTING */
    $scope.getNotes = function () {
        $http.get(webservice_path + "getNotes?pid="+ $rootScope.product.iPkUserProductId +"&uid=" + $scope.uid + "&token=" + $scope.token)
            .success(function (res) {
                if (res.status == true) {
                    $scope.notes = res.result.data;
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    $scope.notes = {};
                    toastr.error(res.result.message);
                }
            });
    };

    /**END GET NOTES LISTING */

    /** BEGIN ADD NOTES */
    $scope.addNotes = function(){
        $scope.notesData.iPkUserNotesId = '';
        $scope.notesData.vTitle = '';
        $scope.notesData.tDescription = '';
        $scope.addNoteModal = $uibModal.open({
            animation: true,
            windowClass:'modal fade veazy_modal add_note',
            templateUrl: "addNotes.html",
            scope: $scope,
            size: 'md'
        });
    };

    $scope.saveNotes = function () {
        var param = {
            'uid': $scope.uid,
            'token': $scope.token,
            'vTitle': $scope.notesData.vTitle,
            'tDescription': $scope.notesData.tDescription,
            'iPkUserNotesId': $scope.notesData.iPkUserNotesId,
            'pid': $rootScope.product.iPkUserProductId
        };

        $http.post(webservice_path + 'saveNotes', param)
            .success(function (res) {
                if (res.status == true) {
                    $scope.getNotes();
                    if($scope.notesData.iPkUserNotesId != ''){
                        $scope.editNoteModal.dismiss();
                    }else{
                        $scope.addNoteModal.dismiss();
                    }
                    $scope.notesData.vTitle = '';
                    $scope.notesData.tDescription = '';
                    $scope.notesData.iPkUserNotesId = '';
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };
    /** END ADD NOTES */

    /** BEGIN EDIT NOTES */
    $scope.editNotes = function(iPkUserNotesId,vTitle,tDescription){
        $scope.notesData.iPkUserNotesId = iPkUserNotesId;
        $scope.notesData.vTitle = vTitle;
        $scope.notesData.tDescription = tDescription;
        $scope.editNoteModal = $uibModal.open({
            animation: true,
            windowClass:'modal fade veazy_modal add_note',
            templateUrl: "editNotes.html",
            scope: $scope,
            size: 'md'
        });
    };
    /** END EDIT NOTES */

    /**BEGIN DELETE NOTES */
    $scope.deletenote = function(iPkUserNotesId){
        $scope.delete_iPkUserNotesId = iPkUserNotesId;
    };

    $scope.deleteConfirm = function(){
        $http.get(webservice_path + "deleteNotes?id=" + $scope.delete_iPkUserNotesId + "&uid=" + $scope.uid + "&token=" + $scope.token)
            .success(function (res) {
                if (res.status == true) {
                    toastr.success("Note has been deleted successfully");
                    $scope.getNotes();
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };
    /**END DELETE NOTES */
});