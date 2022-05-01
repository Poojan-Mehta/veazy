angular.module('VeazyApp').controller('QuickLinksController', function ($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal) {
    $scope.$on('$viewContentLoaded', function () {
        // initialize core components
        App.initAjax();
    });

    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $scope.linkData = {};
    $scope.linkData.iPkQuickLinkId = '';
    $scope.linkData.vNickName = '';
    $scope.linkData.vQuicklink = '';
    
    /** added by poojan start*/
    setTimeout(function () {
        if($scope.is_plan_exists == 'no' || $scope.is_plan_exists == false){
            $state.go('app.dashboard');
        }
    }, 1500);
    
    getPlan();
    $scope.is_plan_exists = true;
    function getPlan() {
        if($scope.token != undefined) {
            $http.get(webservice_path + "currentplan?uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + '&limit=all')
                .success(function (res) {
                    console.clear();
                    console.log(res);
                    if (res.status == true) {

                        $scope.plan_cancel = localStorage.getItem('plan_cancel');
                        if($scope.plan_cancel == 'yes'){
                            swal("Currently you do not have any plan.",
                         {
                                buttons: {
                                    cancel: "Cancel",
                                    ok:"Subscribe"
                                },toast: true
                            }).then(function(isConfirm) {
                                
                                if (isConfirm) {                                        
                                    window.location.href = "/Plans";
                                } else {

                                }
                            })

                            $('.swal-button--ok').css('background','#6049dd');
                            $('.swal-button').css('border-radius','7px !important');
                            localStorage.setItem('plan_cancel','');
                        }
                        
                        if(res.result.data.is_plan_exists == 'no'){
                            $scope.is_plan_exists = false;
                        }
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        toastr.error(res.result.message);
                    }
                });
        }
    }
    /** added by poojan end */

    /** ADD FOLDER */
    $scope.addFolder = function () {
        $http.get(webservice_path + "addQuicklinkFolder?uid=" + $scope.uid + "&token=" + $scope.token + "&vfoldername=" + $scope.vfoldername)
            .success(function (res) {
                if (res.status == true) {
                    toastr.success("Folder '" + $scope.vfoldername + "' has been created");
                    $scope.vfoldername = '';
                    $scope.getFolder();
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };

    /** GET FOLDER NAME */
    $scope.getFolder = function () {
        if ($scope.token != undefined) {
            $http.get(webservice_path + "getQuicklinksFolder?uid=" + $scope.uid + "&token=" + $scope.token)
                .success(function (res) {
                    if (res.status == true) {
                        $scope.folders = res.result.folders;
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        $scope.folders = {};
                    }
                });
        }
    };
    $scope.getFolder();

    /**BEGIN DELETE FOLDER */
    $scope.deletefolder = function (folder_id, folder_name) {
        $scope.delete_folder_id = folder_id;
        $scope.delete_folder_name = folder_name;
    };

    $scope.deleteConfirm = function () {
        $http.get(webservice_path + "deleteQuickLinkFolder?fid=" + $scope.delete_folder_id + "&uid=" + $scope.uid + "&token=" + $scope.token)
            .success(function (res) {
                if (res.status == true) {
                    toastr.success("Folder '" + $scope.delete_folder_name + "' has been deleted successfully");
                    $scope.getFolder();
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };
    /**END DELETE FOLDER */

    /**BEGIN ADD QUICK LINK */
    $scope.addLink = function (folder_id) {
        $scope.add_link_folder_id = folder_id;
        $scope.linkData.vNickName = '';
        $scope.linkData.vQuicklink = '';
        $scope.linkData.iPkQuickLinkId = '';
        $scope.addLinkModal = $uibModal.open({
            animation: true,
            windowClass: 'modal fade veazy_modal add_qn',
            templateUrl: "addLink.html",
            scope: $scope,
            size: 'sm'
        });
    };

    $scope.saveQuickLink = function () {
        var param = {
            'fid': $scope.add_link_folder_id,
            'uid': $scope.uid,
            'token': $scope.token,
            'vNickName': $scope.linkData.vNickName,
            'vQuicklink': $scope.linkData.vQuicklink,
            'iPkQuickLinkId': $scope.linkData.iPkQuickLinkId
        };

        $http.post(webservice_path + 'saveQuickLink', param)
            .success(function (res) {
                if (res.status == true) {
                    $scope.addLinkModal.dismiss();
                    $scope.getFolder();
                    $scope.linkData.vNickName = '';
                    $scope.linkData.vQuicklink = '';
                    $scope.linkData.iPkQuickLinkId = '';
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };
    /**END ADD QUICK LINK */

    /** EDIT QUICK LINK */
    $scope.editLink = function (iPkQuickLinkId, IFkFolderId) {
        $http.get(webservice_path + 'viewQuickLink?lid=' + iPkQuickLinkId + '&token=' + $scope.token + '&uid=' + $scope.uid + '&fid=' + IFkFolderId)
            .success(function (res) {
                if (res.status == true) {
                    $scope.linkData.iPkQuickLinkId = res.result.links.iPkQuickLinkId;
                    $scope.linkData.vNickName = res.result.links.vNickName;
                    $scope.linkData.vQuicklink = res.result.links.vQuicklink;
                    $scope.add_link_folder_id = res.result.links.IFkFolderId;
                    $scope.addLinkModal = $uibModal.open({
                        animation: true,
                        windowClass: 'modal fade veazy_modal add_qn',
                        templateUrl: "addLink.html",
                        scope: $scope,
                        size: 'sm'
                    });
                }
            });
    };


    /**BEGIN DELETE QUICKLINK*/
    $scope.deleteLink = function (iPkQuickLinkId) {
        $scope.delete_link_id = iPkQuickLinkId;
    };

    $scope.deleteLinkConfirm = function () {
        $http.get(webservice_path + "deleteQuickLink?lid=" + $scope.delete_link_id + "&uid=" + $scope.uid + "&token=" + $scope.token)
            .success(function (res) {
                if (res.status == true) {
                    toastr.success("Link has been deleted successfully");
                    $scope.getFolder();
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };
    /**END DELETE QUICKLINK*/

}).filter("linkFilter", function () {
    return function (link) {
        var result;
        var startingUrl = "http://";
        var httpsStartingUrl = "https://";
        if (link.startWith(startingUrl) || link.startWith(httpsStartingUrl)) {
            result = link;
        }
        else {
            result = startingUrl + link;
        }
        return result;
    }
});
String.prototype.startWith = function (str) {
    return this.indexOf(str) == 0;
};