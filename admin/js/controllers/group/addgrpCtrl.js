'use strict';

/* Controllers */
app.controller('addgrpCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state','toaster',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state,toaster)
    {
        $scope.pagename = $scope.group.addgroup;
        $scope.loginid=$stateParams.grpid;

        if ($stateParams.grpid)
        {
            $scope.pagename = $scope.group.editgroup;
            $http.get(webservice_path +'/group/view/'+ $stateParams.grpid).success(function(res)
            {
                if (res.StatusCode == '999')
                {
                    $state.go('login');
                    toaster.pop('error','',$scope.general.sessionexpired);
                }
                else if (res.Status == 'True')
                {
                    $scope.grpName = res.Response.vGroupName;
                    $scope.grpDesc = res.Response.vGroupDescription;
                    $scope.vGroupImage = res.Response.vGroupImage;
                }
            });
        }

        $scope.rowCollection = [];

        $scope.sizeLimit = 2000000; // 1MB in Bytes

        $scope.uploadFile = function (files, t) {
            if (window.FileReader) {
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

        $scope.add_grp_form = function (isValid) {

            $scope.submitted = true;
            if (isValid){
                var param = {};
                if ($scope.ProfilePic) {

                    if ($scope.ProfilePic.type == "image/gif" || $scope.ProfilePic.type == "image/png" || $scope.ProfilePic.type == "image/bmp" || $scope.ProfilePic.type == "image/jpeg" || $scope.ProfilePic.type == "image/jpg")  {
                        // Perform File Size Check First
                        var fileSize = Math.round(parseInt($scope.ProfilePic.size));
                        if (fileSize > $scope.sizeLimit) {
                            toaster.pop('success', '', $scope.group.filesize);
                            /*toaster.pop('success','','Sorry, the file is too large . <br/> The maximum allowed size is ' + $scope.fileSizeLabel() + 'file too large');*/
                            return false;
                        } else {
                            /*if ($scope.vWebsite == undefined || $scope.vPhone == undefined || $scope.vComplement == undefined) {
                             $scope.vWebsite = '';
                             $scope.vPhone = '';
                             $scope.vComplement = '';
                             }*/
                            param = {
                                grpName: $scope.grpName,
                                grpDesc: $scope.grpDesc,
                                vGroupImage: $scope.ProfilePic,
                                vGroupoldimage: $scope.vGroupImage
                            };

                            if ($stateParams.grpid) {
                                $http({
                                    method: 'POST',
                                    url: webservice_path + '/group/edit/'+ $stateParams.grpid +'.json',
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
                                        toaster.pop('success', "", $scope.general.toasteredit);
                                        $state.go('app.group');
                                    }else if(res.Status == 'False') {
                                        toaster.pop('error', '',$scope.group.imagesize);
                                    }
                                });
                            } else {
                                param = {
                                    grpName: $scope.grpName,
                                    grpDesc: $scope.grpDesc,
                                    vGroupImage: $scope.ProfilePic,
                                    vGroupoldimage: $scope.vGroupImage
                                };

                                $http({
                                    method: 'POST',
                                    url: webservice_path + '/group/add/',
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
                                        toaster.pop('success', "", $scope.general.toasteradd);
                                        $state.go('app.group');
                                    } else if (res.Status == 'False') {
                                        toaster.pop('error', '',$scope.group.imagesize);
                                    }
                                }).error(function () {

                                    toaster.pop('error',"");
                                });
                            }
                        }
                    } else {
                        toaster.pop('error','File type',$scope.group.toasterfiletyperestrict);
                    }
                } else {
                    param = {
                        grpName: $scope.grpName,
                        grpDesc: $scope.grpDesc,
                        vLogo: $scope.ProfilePic,
                        vGroupoldimage: $scope.vGroupImage

                    };

                    if ($stateParams.grpid)
                    {
                        $http.post(webservice_path +'/group/edit/'+ $stateParams.grpid +'.json',param).success(function(res)
                        {
                            if (res.StatusCode == '999')
                            {
                                $state.go('login');
                                toaster.pop('error','',$scope.general.sessionexpired);
                            }
                            else if (res.Status == "True")
                            {
                                $rootScope.sucs_status = true;
                                $rootScope.message = res.Message;
                                $scope.eRoleName = localStorage.getItem('rol');
                                if($scope.eRoleName != 'superadmin')
                                {
                                    $state.go("app.group");
                                }
                                else
                                {
                                    $state.go("app.group");
                                }
                                toaster.pop('success', '', $scope.general.toasteredit);
                            }
                            else if (res.Status == "False")
                            {
                                $rootScope.status = true;
                                $rootScope.message = res.Message;
                                $rootScope.error.message=res.message;
                            }
                            else {

                                toaster.pop('error',"Server Error",$scope.general.toastererror);
                            }
                        });
                    }
                    /*else {

                     param = {

                     vSliderTitle: $scope.vSliderTitle,
                     vSliderDescription: $scope.vSliderDescription,
                     vLogo: $scope.ProfilePic,
                     vSlideroldimage: $scope.vSliderImage,
                     vSliderLinkWebsite: $scope.vSliderLinkWebsite
                     };

                     $http({
                     method: 'POST',
                     url: webservice_path + '/homeslider/add/',
                     data: $.param(param),
                     headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'}
                     }).success(function (res) {
                     if (res.Status == 'False') {
                     toaster.error("Please Enter Your All Fields ");
                     }
                     })
                     .error(function (response) {
                     toaster.error("Something went wrong! ", "Server Error");
                     });
                     }*/
                }

            }
        };




    }]);
