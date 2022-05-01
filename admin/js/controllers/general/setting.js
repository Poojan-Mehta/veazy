'use strict';

/* Controllers */
app.controller('settingCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster) {

    getgeneral();
    function getgeneral() {
        $http.post(webservice_path + 'general/index').success(function (res) {
            $scope.vSettingEmailSupport = res.Response.vSettingEmailSupport;
            $scope.vSettingEmailAdmin = res.Response.vSettingEmailAdmin;
            $scope.vSettingEmailCC = res.Response.vSettingEmailCC;
            $scope.vSettingEmailBCC = res.Response.vSettingEmailBCC;
            $scope.vSettingEmailReplyTo = res.Response.vSettingEmailReplyTo;
            $scope.vSettingSupportContact = res.Response.vSettingSupportContact;
            $scope.emailtype = res.Response.emailtype;
            $scope.smtphost = res.Response.smtphost;
            $scope.smtpport = res.Response.smtpport;
            $scope.smtpusername = res.Response.smtpusername;
            $scope.smtppassword = res.Response.smtppassword;
            $scope.paymentmode = res.Response.vPaymentMode;
            $scope.plan = res.Response.plan;
            $scope.iPkPlanId = res.Response.vDefaultPlan;
            $scope.ePlanFee = res.Response.PlanFees;

            if ($scope.PlanFees == 'free') {
                $scope.showdiv = false;
            } else {
                $scope.showdiv = true;
            }

            var Unique_Plan_ID = $.grep($scope.plan, function (fruit) {
                return fruit.iPkPlanId == $scope.iPkPlanId;
            })[0].Unique_Plan_ID;

            $scope.Unique_Plan_ID = Unique_Plan_ID;

            $scope.iPkSettingId = res.Response.iPkSettingId;
            $scope.ITrialPeriod = res.Response.ITrialPeriod;

            $scope.sandUserName = res.Response.vPaypalApiUserNameSand;
            $scope.sandPassword = res.Response.vPaypalApiPasswordSand;
            $scope.sandSignature = res.Response.vPaypalApiSignatureSand;

            $scope.LiveUserName = res.Response.vPaypalApiUserNameLive;
            $scope.LivePassword = res.Response.vPaypalApiPasswordLive;
            $scope.LiveSignature = res.Response.vPaypalApiSignatureLive;
        });
    }



        $scope.one = true;
        $scope.two = false;

        $scope.InsertPlan = function (id) {

            var planName = $.grep($scope.plan, function (fruit) {
                return fruit.iPkPlanId == id;
            })[0].Plan_names;

            $scope.plan_name = planName;

            if ($scope.PlanFees == 'free') {
                $scope.showdiv = false;
            } else {
                $scope.showdiv = true;
            }
            var param = {
                id: id
            };
            $http.post(webservice_path + 'general/changeplan', param).success(function (res) {
                if (res.Status == "True") {
                    $scope.eRoleName = localStorage.getItem('rol');
                    if ($scope.eRoleName = 'superadmin') {
                        getgeneral();
                        $state.go("app.generalsetting");
                    }
                    toaster.pop('success', '', $scope.settings.plan);
                } else {

                    toaster.pop('error', "Server Error", $scope.general.toastererror);
                }
            });
        };

        /** ON BLUR PRIORITY CHANGE */
        $scope.onBlur = function (id, tday) {
            var paramd = {
                id: id,
                tday: tday
            };
            if (paramd.tday != undefined) {
                $http.post(webservice_path + 'general/trialdays', paramd).success(function (res) {
                    if (res.Status == 'True') {
                        toaster.pop('success', '', $scope.settings.tdays);
                    }
                });
            }
        };

        $scope.showOne = function () {
            $scope.one = true;
            $scope.two = false;
        };
        $scope.showTwo = function () {
            $scope.one = false;
            $scope.two = true;
        };


        $scope.view1 = 'no';
        $scope.view2 = 'no';

        /** ADD & EDIT GENERAL SETTING*/
        $scope.add_general_form = function (isValid) {
            $scope.submitted = true;
            if (isValid) {
                if ($scope.emailtype == undefined || $scope.emailtype == null) {
                    toaster.pop('error', "Required", $scope.settings.emailsystem);
                } else {
                    var param = {
                        vSettingEmailSupport: $scope.vSettingEmailSupport,
                        vSettingSupportContact: $scope.vSettingSupportContact,
                        vSettingEmailAdmin: $scope.vSettingEmailAdmin,
                        vSettingEmailCC: $scope.vSettingEmailCC,
                        vSettingEmailBCC: $scope.vSettingEmailBCC,
                        vSettingEmailReplyTo: $scope.vSettingEmailReplyTo,
                        emailtype: $scope.emailtype,
                        smtphost: $scope.smtphost,
                        smtpport: $scope.smtpport,
                        smtpusername: $scope.smtpusername,
                        smtppassword: $scope.smtppassword,
                        paypalmode: $scope.paymentmode,
                        sandUserName: $scope.sandUserName,
                        sandPassword: $scope.sandPassword,
                        sandSignature: $scope.sandSignature,
                        LiveUserName: $scope.LiveUserName,
                        LivePassword: $scope.LivePassword,
                        LiveSignature: $scope.LiveSignature,
                        ITrialPeriod: $scope.ITrialPeriod
                    };

                    $http.post(webservice_path + 'general/edit', param).success(function (res) {
                        if (res.Status == "True") {
                            $scope.eRoleName = localStorage.getItem('rol');
                            if ($scope.eRoleName = 'superadmin') {
                                $state.go("app.generalsetting");
                            }
                            toaster.pop('success', '', $scope.settings.gstoasteredit);
                        } else {

                            toaster.pop('error', "Server Error", $scope.general.toastererror);
                        }
                    });
                }
            }
        };


    }]);
