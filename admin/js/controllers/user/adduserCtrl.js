"use strict";
/* Controllers */
app.controller("adduserCtrl", [
  "$scope",
  "$window",
  "$http",
  "$rootScope",
  "$timeout",
  "$filter",
  "$stateParams",
  "$state",
  "toaster",
  "ipCookie",
  function (
    $scope,
    $window,
    $http,
    $rootScope,
    $timeout,
    $filter,
    $stateParams,
    $state,
    toaster,
    ipCookie
  ) {
    $scope.pagename = "Add User";
    $scope.userId = localStorage.getItem("aid");
    $scope.id = $stateParams.userid;

    /** PERMISSION*/
    // getPackage();
    // function getPackage() {
    //   $http
    //     .get(webservice_path + "planpackage/getPackage")
    //     .success(function (res) {
    //       if (res.Status == "True") {
    //         $scope.packageListing = res.Response;
    //       }
    //     });
    // }
    
    getPlan();
    function getPlan() {
      $http
        .get(webservice_path + "planpackage/getPlan")
        .success(function (res) {
          if (res.Status == "True") {
            $scope.planListing = res.Response;
          }
        });
    }

    /** Get Plan*/
    // $scope.getchange = function (id) {
    //   $scope.planId = "";
    //   $http
    //     .post(webservice_path + "planpackage/getPlan/" + id)
    //     .success(function (res) {
    //       if (res.Status == "True") {
    //         $scope.planListing = res.Response;
    //       }
    //     });
    // };

    /** VIEW ADMIN*/
    if ($stateParams.userid) {
      $scope.pagename = "Edit User";
      $http
        .get(webservice_path + "users/view?uid=" + $stateParams.userid)
        .success(function (res) {
          if (res.StatusCode == "999") {
            $scope.logout();
            toaster.pop("error", "", res.Message);
          } else if (res.Status == "True") {
            $scope.vFirstName = res.Response.vFirstName;
            $scope.vLastName = res.Response.vLastName;
            $scope.vEmail = res.Response.vEmail;
            $scope.vMobile = res.Response.vMobile;
            $scope.classis_call = res.Response.classis_call;
            $scope.packageId = res.Response.iFkPackageId;
            // $scope.getchange(res.Response.iFkPackageId);
            $scope.planId = res.Response.iFkUserPlanId;
          }
        });
    }

    /** ADD & EDIT ADMIN*/
    $scope.add_admin_form = function (isValid) {
      $scope.submitted = true;
      if (isValid) {
        var param = {
          id: $scope.id,
          vFirstName: $scope.vFirstName,
          vLastName: $scope.vLastName,
          vEmail: $scope.vEmail,
          vMobile: $scope.vMobile,
          planId: $scope.planId,
          classis_call: $scope.classis_call,
          packageId: '',
          userId: $stateParams.userid,
        };
        if ($stateParams.userid) {
          $http
            .post(webservice_path + "users/edit", param)
            .success(function (res) {
              if (res.StatusCode == "999") {
                $scope.logout();
                toaster.pop("error", "", res.Message);
              } else if (res.Status == "True") {
                toaster.pop("success", "", res.Message);
                $state.go("app.users");
              } else if (res.Status == "False") {
                toaster.pop("error", "", res.Message);
              }
            });
        } else {
          $http
            .post(webservice_path + "users/add", param)
            .success(function (res) {
              if (res.StatusCode == "999") {
                $scope.logout();
                toaster.pop("error", "", res.Message);
              } else if (res.Status == "True") {
                $state.go("app.users");
                toaster.pop("success", "", res.Message);
              } else {
                toaster.pop("error", "", res.Message);
              }
            });
        }
      }
    };
  },
]);
