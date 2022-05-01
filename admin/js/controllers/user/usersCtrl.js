"use strict";
/* Controllers */
app.controller("usersCtrl", [
  "$modal",
  "$compile",
  "$scope",
  "$window",
  "$http",
  "$rootScope",
  "$timeout",
  "$filter",
  "$stateParams",
  "$state",
  "toaster",
  "prompt",
  "ipCookie",
  function (
    $modal,
    $compile,
    $scope,
    $window,
    $http,
    $rootScope,
    $timeout,
    $filter,
    $stateParams,
    $state,
    toaster,
    prompt,
    ipCookie
  ) {
    $scope.userId = localStorage.getItem("aid");

    $scope.getformateddate = function (dt) {
      var today = new Date(dt);
      return today;
    };

    getData();
    $scope.rowCollection = [];

    /** GET USERS DETAILS*/
    function getData() {
      $http
        .get(webservice_path + "users?aid=" + $scope.userId)
        .success(function (res) {
          if (res.StatusCode == "999") {
            $scope.logout();
            toaster.pop("error", "", res.Message);
          } else if (res.Status == "True") {
            $scope.rowCollection = res.Response;
          }
        });
    }

    $scope.displayedCollection = [].concat($scope.rowCollection);

    /** REMOVE USER*/
    $scope.removeItem = function (id, vUserName) {
      $scope.promtmsg = $scope.general.deletepopupsingle;
      var param = {
        aid: $scope.userId,
        deleteId: id,
      };
      prompt({
        message: $scope.promtmsg,
        input: false,
      }).then(function (name) {
        $http
          .post(webservice_path + "users/delete", param)
          .success(function (res) {
            if (res.StatusCode == "999") {
              toaster.pop("error", "", res.Message);
            } else if (res.Status == "True") {
              toaster.pop("success", vUserName, $scope.general.toasterdelete);
              $("input:checkbox").removeAttr("checked");
              getData();
            }
          });
      });
    };

    /** CHANGE STATUS OF USERS*/
    $scope.changestatus = function (id, eStatus) {
      var param = {
        aid: $scope.userId,
        statusId: id,
        status: eStatus,
      };
      var status = "inactive";
      if (eStatus == status) {
        status = "active";
      }
      $scope.promtmsg =
        $scope.general.ask + "   " + status + "   " + $scope.general.record;
      prompt({
        message: $scope.promtmsg,
        input: false,
        buttons: [
          {
            label: "Yes",
            cancel: false,
            primary: false,
          },
          {
            label: "No",
            cancel: false,
            primary: false,
          },
        ],
      }).then(function (name) {
        if (name.label == "Yes") {
          $http
            .post(webservice_path + "users/changeStatus", param)
            .success(function (res) {
              if (res.StatusCode == "999") {
                toaster.pop("error", "", res.Message);
              } else if (res.Status == "True") {
                toaster.pop("success", "", $scope.general.changestatus);
                getData();
              }
            });
        } else {
          getData();
        }
      });
    };

    /** GET CSV OF USERS LIST*/
    $scope.getcsv = function () {
      var data = [];
      angular.forEach($scope.rowCollection, function (value, key) {
        data.push({
          "First Name": value.vFirstName,
          "Last Name": value.vLastName,
          "user Name": value.vUsername,
          Email: value.vEmail,
          "Mobile Number": value.vMobile,
          Gender: value.eGender,
          Status: value.eUserStatus,
          "Created Date": value.dtUserCreatedOn,
        });
      });
      return data;
    };

    $scope.checkSelection = function () {
      var suc = 0;
      angular.forEach($scope.rowCollection, function (value, key) {
        if (document.getElementById("user" + value.iPkUserId)) {
          if (
            document.getElementById("user" + value.iPkUserId).checked == true
          ) {
            suc = 1;
          }
        }
      });
      return suc;
    };

    jQuery("#checkAll").click(function () {
      jQuery(".userstatus").prop("checked", this.checked);
    });

    /** REMOVE SELECTED USER*/
    $scope.removeAll = function () {
      var selectcondition = $scope.checkSelection();

      if (selectcondition == 1) {
        $scope.promtmsg = $scope.general.removerecords;
        prompt({
          message: $scope.promtmsg,
          input: false,
        }).then(function (name) {
          var allrecords = [];
          angular.forEach($scope.rowCollection, function (value, key) {
            if (document.getElementById("user" + value.iPkUserId)) {
              if (
                document.getElementById("user" + value.iPkUserId).checked ==
                true
              ) {
                allrecords.push(value.iPkUserId);
              }
            }
          });
          var param = {
            aid: $scope.userId,
            deleteIds: allrecords,
          };
          $http
            .post(webservice_path + "users/deleteAll", param)
            .success(function (res) {
              if (res.StatusCode == "999") {
                toaster.pop("error", "", res.Message);
              } else if (res.Status == "True") {
                toaster.pop("success", "", $scope.general.removesuccess);
                getData();
              }
            });
          $("input:checkbox").removeAttr("checked");
        });
      } else {
        $scope.promtmsg = $scope.general.singlerecorddelete;
        prompt({
          message: $scope.promtmsg,
          input: false,
        });
      }
    };

    /** ACTIVE SELECTED USER*/
    $scope.activeAll = function () {
      var selectcondition = $scope.checkSelection();

      if (selectcondition == 1) {
        $scope.promtmsg = $scope.general.activerecords;
        prompt({
          message: $scope.promtmsg,
          input: false,
        }).then(function (name) {
          var allrecords = [];
          angular.forEach($scope.rowCollection, function (value, key) {
            if (document.getElementById("user" + value.iPkUserId)) {
              if (
                document.getElementById("user" + value.iPkUserId).checked ==
                true
              ) {
                allrecords.push(value.iPkUserId);
              }
            }
          });
          var param = {
            aid: $scope.userId,
            status: "inactive",
            selectedIds: allrecords,
          };
          $http
            .post(webservice_path + "users/changeStatusAll", param)
            .success(function (res) {
              if (res.StatusCode == "999") {
                toaster.pop("error", "", res.Message);
              } else if (res.Status == "True") {
                toaster.pop("success", "", $scope.general.activatedrecords);
                getData();
              }
            });
          $("input:checkbox").removeAttr("checked");
        });
      } else {
        $scope.promtmsg = $scope.general.singlerecorddelete;
        prompt({
          message: $scope.promtmsg,
          input: false,
        });
      }
    };

    /** DEACTIVATE SELECTED USER*/
    $scope.deactiveAll = function () {
      var selectcondition = $scope.checkSelection();

      if (selectcondition == 1) {
        $scope.promtmsg = $scope.general.inactivaterecords;
        prompt({
          message: $scope.promtmsg,
          input: false,
        }).then(function (name) {
          var allrecords = [];
          angular.forEach($scope.rowCollection, function (value, key) {
            if (document.getElementById("user" + value.iPkUserId)) {
              if (
                document.getElementById("user" + value.iPkUserId).checked ==
                true
              ) {
                allrecords.push(value.iPkUserId);
              }
            }
          });
          var param = {
            aid: $scope.userId,
            status: "active",
            selectedIds: allrecords,
          };
          $http
            .post(webservice_path + "users/changeStatusAll", param)
            .success(function (res) {
              if (res.StatusCode == "999") {
                toaster.pop("error", "", res.Message);
              } else if (res.Status == "True") {
                toaster.pop("success", "", $scope.general.inactivatedrecords);
                getData();
              }
            });
          $("input:checkbox").removeAttr("checked");
        });
      } else {
        $scope.promtmsg = $scope.general.singlerecorddelete;
        prompt({
          message: $scope.promtmsg,
          input: false,
        });
      }
    };

    $scope.pind = -1;
    $scope.ind = -1;

    // Target Information
    $scope.target;
    $scope.p;
    $scope.i;
    $scope.x;
    $scope.selectedUser;
    $scope.inputtype;

    // Double Click Open Input Field
    $scope.logObj = function (event, obj, index, type, package_id, plan_id) {
      $scope.target = $(event.target);
      $scope.selectedUser = obj;
      $scope.p = index;
      $scope.i = $scope.target.index();
      $scope.x = $scope.target;
      $scope.inputtype = type;
      if (type == "plan") {
        openStateEdit($scope.x, package_id, plan_id);
      } else {
        openTextEdit($scope.x, $scope.p);
      }
      setActiveCell($scope.x, $scope.p, $scope.i);
    };

    function setActiveCell(cell, p, i) {
      if ($scope.pind >= 0 && (p !== $scope.pind || i !== $scope.ind)) {
        $("tr")
          .eq($scope.pind + 1)
          .find("td")
          .eq($scope.ind)
          .find(".edit")
          .remove();
      }
      $scope.pind = cell.parent().index();
      $scope.ind = cell.index();
    }

    $(document).on("keyup", function (e) {
      if (e.key == "Enter") {
        if ($scope.inputtype == "classis_call") {
          changeText();
        }
      }
    });

    $(document).on("change", ".plan_option", function () {
      var x = $(this);
      changePlan(x);
    });

    // var html = angular.element(
    //   "<div class='edit edit_state'><select name='plan_id'><option>1</option><option>2</option></select></div>"
    // );

    function openStateEdit(cell, package_id, plan_id) {
      $http
        .post(webservice_path + "planpackage/getPlan/" + package_id)
        .success(function (res) {
          if (res.Status == "True") {
            $scope.planListing = res.Response;
            $(".edit").remove();
            var html =
              "<div class='edit edit_txt'><select class='plan_option' name='plan_id'>";
            angular.forEach($scope.planListing, function (value, key) {
              if (value.iPkPlanId === plan_id) {
                html +=
                  "<option value='" +
                  value.iPkPlanId +
                  "' selected>" +
                  value.Unique_Plan_ID +
                  "</option>";
              } else {
                html +=
                  "<option value='" +
                  value.iPkPlanId +
                  "'>" +
                  value.Unique_Plan_ID +
                  "</option>";
              }
            });
            html += "</select></div>";
            cell.append($compile(html)($scope));
            setTimeout(function () {
              cell.find("input").focus();
            }, 100);
          }
        });
    }

    function openTextEdit(cell, i) {
      $(".edit").remove();
      var type = cell.text();
      cell.append(
        "<div class='edit edit_txt'><input class='call_text' type='text' placeholder='" +
          type +
          "' /></div>"
      );
      setTimeout(function () {
        cell.find("input").focus();
      }, 100);
    }

    function changeText(x) {
      var t = $scope.target;
      if (t.find("input").val().length > 0) {
        t.text(t.find("input").val());
        var param = {
          aid: $scope.selectedUser,
          value: t.text(),
          type: "classis_call",
        };
        $http
          .post(webservice_path + "users/changeCoachingCalls", param)
          .success(function (res) {
            if (res.StatusCode == "999") {
              toaster.pop("error", "", res.Message);
            } else if (res.Status == "True") {
              getData();
            }
          });
      }
    }

    function changePlan(x) {
      var param = {
        aid: $scope.selectedUser,
        value: x.val(),
        type: "plan",
      };
      $http
        .post(webservice_path + "users/changeCoachingCalls", param)
        .success(function (res) {
          if (res.StatusCode == "999") {
            toaster.pop("error", "", res.Message);
          } else if (res.Status == "True") {
            getData();
          }
        });
    }

    $scope.minDate = new Date();
    $scope.dateOptions = {
      showWeeks: false,
      formatYear: "yy",
      minDate: new Date(),
    };

    $scope.chooseDate = function () {
      $scope.dueDate =
        $scope.dateparam.duedate.getDate() +
        "/" +
        parseInt($scope.dateparam.duedate.getMonth() + 1) +
        "/" +
        $scope.dateparam.duedate.getFullYear();
    };

    $scope.assignDueDate = function (userId, duedate) {
      $scope.dateparam = {};
      if (duedate == null || duedate == "") {
        $scope.dateparam.duedate = new Date();
      } else {
        $scope.dateparam.duedate = duedate;
      }
      $scope.dueDateAssignToUserId = userId;
      $scope.assignDueDateModal = $modal.open({
        animation: true,
        windowClass: "modal fade veazy_modal link_modal",
        templateUrl: "assignDueDate.html",
        scope: $scope,
        size: "sm",
      });
    };

    $scope.closeassignDueDate = function () {
      $scope.dateparam = {};
      $scope.assignDueDateModal.dismiss();
    };

    $scope.updateDueDate = function () {
      var param = {
        aid: $scope.dueDateAssignToUserId,
        value: $scope.dateparam.duedate,
        type: "expiredate",
      };
      $http
        .post(webservice_path + "users/changeCoachingCalls", param)
        .success(function (res) {
          if (res.StatusCode == "999") {
            toaster.pop("error", "", res.Message);
          } else if (res.Status == "True") {
            getData();
            $scope.assignDueDateModal.dismiss();
          }
        });
    };
  },
]);
