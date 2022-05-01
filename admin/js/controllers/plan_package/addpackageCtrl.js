"use strict";
/* Controllers */
app.controller("addpackageCtrl", [
  "$scope",
  "$window",
  "$http",
  "$rootScope",
  "$timeout",
  "$filter",
  "$stateParams",
  "$state",
  "toaster",
  function (
    $scope,
    $window,
    $http,
    $rootScope,
    $timeout,
    $filter,
    $stateParams,
    $state,
    toaster
  ) {
    $scope.pagename = "Add Package";
    $scope.id = $stateParams.pid;
    $scope.records = {};
    $scope.records.plans = [];
    $scope.loadplan = false;
    /** IF ID WILL BE NULL THEN IT WILL THROW AN ERROR AND REDIRECT TO INDEX PAGE*/
    if ($scope.id == "") {
      toaster.pop("error", "", "Something went wrong.");
      $state.go("app.plan_package");
    }

    getPlan();
    function getPlan() {
      var param = {
        pid: $scope.id,
      };
      $http
        .post(webservice_path + "general/getPlan", param)
        .success(function (res) {
          if (res.Status == "True") {
            $scope.planlist = res.Response.plan;
            $scope.loadplan = true;
          }
        });
    }

    /** GET FOLDER DATA ID AND TYPE WISE*/
    if ($stateParams.pid) {
      $scope.pagename = "Edit Package";
      $http
        .post(webservice_path + "planpackage/view/" + $scope.id)
        .success(function (res) {
          if (res.StatusCode == "999") {
            $state.go("login");
            toaster.pop("error", "", $scope.general.sessionexpire);
          } else if (res.Status == "True") {
            $scope.vPackageName = res.Response.vPackageName;
            $scope.records.plans = res.Response.plans;
          } else if (res.StatusCode == "0") {
            $state.go("app.plan_package");
            toaster.pop("error", "", res.Message);
          }
        });
    }

    $scope.setValue = function (iPkPlanId) {
      return $scope.records.plans.includes(iPkPlanId) ? true : false;
    };

    /** ADD & EDIT LESSON FOLDER */
    $scope.add_cat_form = function (isValid) {
      $scope.submitted = true;
      if (isValid) {
        var param = {
          aid: $scope.userId,
          vPackageName: $scope.vPackageName,
          pid: $stateParams.pid,
          records: JSON.stringify($scope.records),
        };

        if ($stateParams.pid) {
          $http
            .post(webservice_path + "planpackage/edit", param)
            .success(function (res) {
              if (res.StatusCode == "999") {
                $scope.logout();
                toaster.pop("error", "", res.Message);
              } else if (res.Status == "True") {
                $state.go("app.plan_package");
                toaster.pop("success", "", res.Message);
              } else {
                toaster.pop("error", "", res.Message);
              }
            });
        } else {
          $http
            .post(webservice_path + "planpackage/add", param)
            .success(function (res) {
              if (res.StatusCode == "999") {
                $scope.logout();
                toaster.pop("error", "", res.Message);
              } else if (res.Status == "True") {
                $state.go("app.plan_package");
                toaster.pop("success", "", res.Message);
              } else if (res.StatusCode == "500") {
                toaster.pop("error", "", res.Message);
              } else {
                toaster.pop("error", "", res.Message);
              }
            });
        }
      }
    };
  },
]);
