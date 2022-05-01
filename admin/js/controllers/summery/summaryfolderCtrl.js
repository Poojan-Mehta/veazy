'use strict';

/* Controllers */
app.controller('summaryfolderCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt','ipCookie',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt,ipCookie) {

        $scope.id = localStorage.getItem('aid');
        $scope.tok = ipCookie('tok');
        $scope.type = 'summary';

        $scope.rowCollection = [];

        /** GET SUMMARY FOLDER DATA*/
        function getData() {
            var paramd = {
                eType:$scope.type
            };
            $http.post(webservice_path +'folder',paramd).success(function (res) {
                if (res.Status == 'True') {
                    $scope.rowCollection = res.Response;
                }
            });
        }
        getData();
       $scope.displayedCollection = [].concat($scope.rowCollection);

        /** REMOVE SUMMARY FOLDER*/
       $scope.removeItem = function (id, vFolderName){
           $scope.promtmsg = ($scope.general.deletepopupsingle);

           var param = {
               aid: $scope.id,
               token: $scope.tok,
               deleteId: id
           };

           prompt({
               message: $scope.promtmsg,
               input: false
           }).then(function (name) {
               $http.post(webservice_path + 'folder/delete', param).success(function (res) {
                   if (res.Status == 'True') {
                       toaster.pop('success',vFolderName, $scope.general.toasterdelete);
                       $('input:checkbox').removeAttr('checked');
                       getData();
                   }
               });
           });
       };

        /** GET CSV OF SUMMARY FOLDER*/
       $scope.getcsv = function () {
           var data = [];
           angular.forEach($scope.rowCollection, function (value, key) {
               data.push({
                   "Folder Nane": value.vFolderName,
                   "Type": value.eType
               });
           });
           return data;
       };

       $scope.checkSelection = function (){
           var suc = 0;
           angular.forEach($scope.rowCollection, function (value, key) {
               if (document.getElementById('summaryfolder' + value.iPkFolderId)) {
                   if (document.getElementById('summaryfolder' + value.iPkFolderId).checked == true) {
                       suc = 1;
                   }
               }
           });
           return suc;
       };

       jQuery('#checkAll').click(function () {
           $('.summaryfolderestatus').not(this).not(':disabled').prop('checked', this.checked);
       });

        /** REMOVE MULTIPLE SUMMARY FOLDER*/
       $scope.removeAll = function (){
           var selectcondition = $scope.checkSelection();

           if (selectcondition == 1){
               $scope.promtmsg = ($scope.general.removerecords);
               prompt({
                   message: $scope.promtmsg,
                   input: false
               }).then(function (name) {
                   var allrecords = [];
                   angular.forEach($scope.rowCollection, function (value, key) {
                       if (document.getElementById('summaryfolder' + value.iPkFolderId)){
                           if (document.getElementById('summaryfolder' + value.iPkFolderId).checked == true){
                               allrecords.push(value.iPkFolderId);
                           }
                       }
                   });
                   var param = {
                       aid: $scope.id,
                       token: $scope.tok,
                       deleteIds: allrecords
                   };

                   $http.post(webservice_path + 'folder/deleteAll',param).success(function (res) {
                       if (res.Status == 'True') {
                           toaster.pop('success','',$scope.general.removesuccess);
                           getData();
                       }
                   });
                   $('input:checkbox').removeAttr('checked');
               });
           } else {
               $scope.promtmsg = ($scope.general.singlerecorddelete);
               prompt({
                   message: $scope.promtmsg,
                   input: false
               });
           }
       };

    }]);