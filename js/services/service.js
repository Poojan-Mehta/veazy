
app.service('commonService',['$http', '$state','$rootScope','$window','toaster','ipCookie',function($http,$state,$rootScope,$window,toaster,ipCookie){
    this.callAPi = function(type,url,param){
        $http.defaults.headers.common['token'] = localStorage.getItem('fourside-token');
        $http.defaults.headers.common['lang'] = 'en';
        
        if(type=='post'){
            return  $http({
                method: 'POST',
                url:url,
                data:$.param(param),
                headers: {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8' }
            }).success(function(res){
                    if(res.StatusCode=='2')
                    {
                        $state.go('login');
                        toaster.pop('error','',res.Message);
                    }
                });
        }else if(type=='get'){
            return $http({
                method: 'GET',
                url:url,
                params:param,
                headers: {'Content-Type':'application/x-www-form-urlencoded;charset=utf-8' }
            }).success(function(res){
                    if(res.StatusCode=='2')
                    {
                        $state.go('login');
                        toaster.pop('error','',res.Message);
                    }
            });
        }
    }
}]);