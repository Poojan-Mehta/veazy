'use strict';


app.controller('resetpasswordCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster','prompt',
 function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster,prompt) {

     $.urlParam = function(name){
         var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
         if (results==null){
             return null;
         }
         else{
             return results[1] || 0;
         }
     }
     $.urlParam('key');

   var key= $.urlParam('key');


     $scope.key=key;
     $scope.resetpass_form = function ()
     {

         $scope.submitted = true;

         var param = {
             key:$scope.key,
             vPassword: $scope.password,
             vConfirmPassword: $scope.confirmpassword
         };

         if ($scope.password)
         {
             $http.post( webservice_path +'/forgot/resetpassword/'+'.json',param).success(function(res)
             {
                 if (res.Status == "True")
                 {
                     toaster.pop('success',"Successfully Changed Your Password",'');
                     $state.go("login");
                 }
                 else {
                     toaster.pop('error',"",'Validation is Not Validate!...');
                 }

             });
         }
         else
         {
            /* toaster.pop('error',"Server Error",'Y.');*/
             $scope.authError = ' Password Should be Minimum length 8 , Upper & lower case , Special Char Alphanumeric and at least 1 Digit';
         }

}

}]);