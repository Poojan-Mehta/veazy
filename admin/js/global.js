//Global path
var theme_path = base_url;


//get base url logic
var base_url = window.location.protocol + "//" + window.location.host + "/";

/* make blank project_name  variable before deploy project on live*/
if(window.location.hostname == '202.131.106.51' || window.location.hostname == '192.168.1.92')
    var project_name='demo/veazy-portal';
else
    var project_name='';

if(project_name)
    var base_url = window.location.protocol + "//" + window.location.host + "/";

var url_param = window.location.pathname;
var url_param_split = window.location.pathname.split('/');

var webservice_path=base_url+'api/';

for (i = 0; i < url_param_split.length; i++) {
    if(url_param_split[i] == 'admin'){
        var base_url = window.location.protocol + "//" + window.location.host + "/" + url_param_split[i] + "/";
    }
}

var page_url=base_url+'pages/';

var angular_controller_url=base_url+'js/';
