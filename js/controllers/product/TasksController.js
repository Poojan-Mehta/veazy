angular.module('VeazyApp').controller('TasksController', function($rootScope, $scope, $http, $timeout, $stateParams, $state, ipCookie, $uibModal)
{
    $scope.uid = ipCookie('uid');
    $scope.token = ipCookie('token');

    if($scope.uid == undefined && $scope.token == undefined){
        $scope.uid = window.localStorage.getItem('uid');
        $scope.token = window.localStorage.getItem('token');
    }
    $rootScope.user_productID = $stateParams.vpid;
    $scope.isproduct = false;

    if($rootScope.user_productID != undefined){
        getProduct();
    }else{
        $state.go('app.dashboard');
    }

    /** GET PRODUCT INFORMATION START */
    function getProduct(){
        if($scope.token != undefined) {
            $http.get(webservice_path + "getapplicationbyID?productID=" + $rootScope.user_productID + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
                .success(function (res) {
                    if (res.status == true) {
                        $rootScope.product = res.result.data;
                        $scope.isproduct = true;
                        $scope.getMasterTask($scope.task_filterBy);
                    }
                })
                .error(function (res) {
                    if (res.status == false) {
                        $state.go('app.dashboard');
                    }
                });
        }
    }
    /** GET PRODUCT INFORMATION END */

    /**************** MASTER TASK START ************************/
    $scope.taskparam = {};
    $scope.is_create_task = false;
    $scope.task_filterBy = 'incomplete';

    $scope.getMasterTask = function (task_filterBy) {
        $http.get(webservice_path + "getTask?task_filterBy=" + task_filterBy + "&pid=" + $scope.product.iPkUserProductId + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type + "&taskType=" + 'product')
            .success(function (res) {
                if (res.status == true) {
                    $scope.master_task_listing = res.result.data;
                    if ($scope.filtertaskModal != undefined) {
                        $scope.filtertaskModal.dismiss();
                    }

                    if($scope.master_task_listing.length == 0){
                        $scope.is_create_task = true;
                    }else{
                        $scope.is_create_task = false;
                    }
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };

    /** FILTER TASK START*/
    $scope.filtertask = function () {
        $scope.filtertaskModal = $uibModal.open({
            animation: true,
            windowClass: 'modal fade veazy_modal task_view',
            templateUrl: "filtertask.html",
            scope: $scope,
            size: 'sm'
        });
    };

    $scope.closefiltertask = function () {
        $scope.filtertaskModal.dismiss();
    };

    $scope.changeFilter = function (filter) {
        $scope.task_filterBy = filter;
        $scope.getMasterTask($scope.task_filterBy);
    };
    /** FILTER TASK END*/

    /** ADD/EDIT TASK START */
    $scope.createTask = function () {
        $scope.is_create_task = true;
        $scope.editTaskId = '';
        $scope.taskparam.updated_task_title = '';
    };

    $scope.saveTask = function () {
        if (($scope.taskparam.task_title != '' && $scope.taskparam.task_title != undefined) || ($scope.taskparam.updated_task_title != '' && $scope.taskparam.updated_task_title != undefined && $scope.taskparam.updated_task_title != $scope.edited_title)) {
            var param = {
                'pid': $scope.product.iPkUserProductId,
                'task_title': $scope.taskparam.task_title,
                'updated_task_title': $scope.taskparam.updated_task_title,
                'tid': $scope.editTaskId,
                'uid': $scope.uid,
                'token': $scope.token,
                'type': app_type,
                'taskType':'product'
            };

            $http.post(webservice_path + 'saveTask', param).success(function (res) {
                if (res.status == true) {
                    $scope.taskparam = {};
                    $scope.is_create_task = false;
                    $scope.editTaskId = '';
                    $scope.getMasterTask($scope.task_filterBy);
                }
            }).error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
        }
    };

    $scope.editTask = function(TaskId,taskTitle){
        $scope.is_create_task = false;
        $scope.taskparam = {};
        $scope.editTaskId = TaskId;
        $scope.edited_title = taskTitle;
        $scope.taskparam.updated_task_title = taskTitle;
    };
    /** ADD/EDIT TASK END */

    $scope.markTaskCompleted = function (taskId,status) {
        var param = {
            'tid': taskId,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type,
            'status':status
        };
        $.ajax({
            url: webservice_path + 'markTaskCompleted',
            type: 'POST',
            data: param,
            success: function (response, status, xhr) {
                if($scope.task_filterBy == 'incomplete' || $scope.task_filterBy == 'complete'){
                    $('#task_' + taskId).closest('tr')
                        .animate({'opacity': 0.1, 'backgroundColor': '#2be688'})
                        .fadeOut(function () {
                            $(this).closest('tr').remove();
                        });
                }else{
                    $('#task_' + taskId).closest('tr')
                        .animate({'opacity': 0.1, 'backgroundColor': '#2be688'})
                        .fadeOut(function () {
                            $(this).closest('tr');
                        });
                    $scope.getMasterTask($scope.task_filterBy);
                }
            }
        });
    };

    /** ASSIGN & CREATE TAG START*/
    $scope.assignTag = function (taskId) {
        $scope.tag_listing = [];
        $scope.tagparam = {};
        $scope.tagparam.color = '#e7505a';
        $scope.assignTagModal = $uibModal.open({
            animation: true,
            windowClass: 'modal fade veazy_modal add_tag_modal',
            templateUrl: "assignTag.html",
            scope: $scope,
            backdrop: 'static',
            keyboard: false,
            size: 'sm'
        });
        $scope.tagAssignToTaskId = taskId;
        $scope.getTaskTags(taskId);
        setTimeout(function () {
            $('#color-select').colorSelect();
        }, 500);
    };

    $scope.closeAssignTag = function () {
        $scope.assignTagModal.dismiss();
    };

    $scope.getTaskTags = function (taskId) {
        $http.get(webservice_path + "getTaskTags?tid=" + taskId + "&uid=" + $scope.uid + "&token=" + $scope.token + "&type=" + app_type)
            .success(function (res) {
                if (res.status == true) {
                    $scope.tag_listing = res.result.data;
                }
            })
            .error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
    };

    $scope.saveTag = function () {
        if ($scope.tagparam.tag_name != '' && $scope.tagparam.tag_name != undefined) {
            var param = {
                'tid': $scope.tagAssignToTaskId,
                'tag_name': $scope.tagparam.tag_name,
                'color': $scope.tagparam.color,
                'uid': $scope.uid,
                'token': $scope.token,
                'type': app_type
            };
            $http.post(webservice_path + 'saveTaskTag', param).success(function (res) {
                if (res.status == true) {
                    $scope.deleteTag = '';
                    $scope.tag_listing = [];
                    $scope.tagparam = {};
                    $scope.tagparam.color = '#e7505a';
                    $scope.tagAssignToTaskId = '';
                    $scope.assignTagModal.dismiss();
                    $scope.getMasterTask($scope.task_filterBy);
                }
            }).error(function (res) {
                if (res.status == false) {
                    toastr.error(res.result.message);
                }
            });
        }
    };

    $scope.mapingTag = function (tagid) {
        var param = {
            'tid': $scope.tagAssignToTaskId,
            'tagid': tagid,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'assignTag', param).success(function (res) {
            if (res.status == true) {
                $scope.deleteTag = '';
                $scope.tag_listing = [];
                $scope.tagparam = {};
                $scope.tagparam.color = '#e7505a';
                $scope.tagAssignToTaskId = '';
                $scope.assignTagModal.dismiss();
                $scope.getMasterTask($scope.task_filterBy);
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };

    $scope.deleteTagConfirm = function (t) {
        $scope.deleteTag = t;
        $scope.deleteTagConfirmModal = $uibModal.open({
            animation: true,
            windowClass: 'modaldeletetag fade veazy_modal tag_confirm_link',
            templateUrl: "deleteTagConfirm.html",
            scope: $scope,
            size: 'md'
        });
    };

    $scope.closeDeleteTagConfirm = function () {
        $scope.deleteTagConfirmModal.dismiss();
    };

    $scope.markTagDeleted = function (tagid) {
        var param = {
            'tagid': tagid,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'markTagDeleted', param).success(function (res) {
            if (res.status == true) {
                $scope.deleteTagConfirmModal.dismiss();
                $scope.deleteTag = '';
                $scope.getTaskTags($scope.tagAssignToTaskId);
                $scope.getMasterTask($scope.task_filterBy);
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };

    $scope.unassignTag = function (t) {
        $scope.deleteTag = t;
        $scope.deleteMapTagModal = $uibModal.open({
            animation: true,
            windowClass: 'modaldeletetag fade veazy_modal tag_confirm_link',
            templateUrl: "unassignTag.html",
            scope: $scope,
            size: 'md'
        });
    };

    $scope.closeUnassignTag = function () {
        $scope.deleteMapTagModal.dismiss();
    };

    $scope.markTagUnassigned = function (mapid) {
        var param = {
            'mapid': mapid,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'unassignTag', param).success(function (res) {
            if (res.status == true) {
                $scope.deleteMapTagModal.dismiss();
                $scope.deleteTag = '';
                $scope.getMasterTask($scope.task_filterBy);
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };

    /** ADD TASK END*/

    /** DUE DATE */
    $scope.dateOptions = {
        //minDate: new Date(),
        showWeeks: false,
        formatYear: 'yy'
    };


    $scope.assignDueDate = function (TaskId,duedate) {
        $scope.dateparam = {};
        if(duedate == null || duedate == ''){
            $scope.dateparam.duedate = new Date();
        }else{
            $scope.dateparam.duedate = duedate;
        }
        $scope.dueDateAssignToTaskId = TaskId;
        $scope.assignDueDateModal = $uibModal.open({
            animation: true,
            windowClass: 'modal fade veazy_modal link_modal',
            templateUrl: "assignDueDate.html",
            scope: $scope,
            size: 'sm'
        });
    };

    $scope.closeassignDueDate = function () {
        $scope.dateparam = {};
        $scope.assignDueDateModal.dismiss();
    };

    $scope.chooseDate = function () {
        $scope.dueDate = $scope.dateparam.duedate.getDate() +'/'+parseInt($scope.dateparam.duedate.getMonth()+1) +'/'+$scope.dateparam.duedate.getFullYear();
    };

    $scope.updateDueDate = function(){
        var param = {
            'tid': $scope.dueDateAssignToTaskId,
            'duedate': $scope.dateparam.duedate,
            'uid': $scope.uid,
            'token': $scope.token,
            'type': app_type
        };
        $http.post(webservice_path + 'updateDueDate', param).success(function (res) {
            if (res.status == true) {
                $scope.dueDate = '';
                $scope.dateparam = {};
                $scope.dueDateAssignToTaskId = '';
                $scope.assignDueDateModal.dismiss();
                $scope.getMasterTask($scope.task_filterBy);
            }
        }).error(function (res) {
            if (res.status == false) {
                toastr.error(res.result.message);
            }
        });
    };
    /** DUE DATE END*/

}).directive('focusMe', ['$timeout', '$parse', function ($timeout, $parse) {
    return {
        link: function (scope, element, attrs) {
            var model = $parse(attrs.focusMe);
            scope.$watch(model, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
        }
    };
}]);
