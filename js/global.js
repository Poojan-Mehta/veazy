//Global path
var theme_path = base_url;


//get base url logic
var base_url = window.location.protocol + "//" + window.location.host + "/";

/* make blank project_name  variable before deploy project on live*/
if(window.location.hostname == '202.131.106.51' || window.location.hostname == '192.168.1.92')
    var project_name ='demo/veazy-portal';
else
    var project_name ='staging.veazy.com.au';

if(project_name)
    var base_url = window.location.protocol + "//" + window.location.host + "/";

var url_param = window.location.pathname;
var url_param_split = window.location.pathname.split('/');
/** prevent screenshot start*/
var noPrint=true;
var noCopy=true;
var noScreenshot=true;
var autoBlur=false;
/** prevent screenshot end*/

var webservice_path = base_url + 'api/webservice/';


for (i = 0; i < url_param_split.length; i++) {
    if(url_param_split[i] == 'admin'){
        var base_url = window.location.protocol + "//" + window.location.host + "/" + url_param_split[i] + "/";
    }
}

var page_url = base_url + 'views/';

var angular_controller_url = base_url + 'js/';
var app_type = 'web';
/* Stripe Public info */
//var publishable_key = 'pk_test_daDmaBUB1SWZWKronTsTor9S'; /* pk_live_5UHW4JE9sNglVN8scqcFweye */
var publishable_key = 'pk_live_5UHW4JE9sNglVN8scqcFweye'; /* pk_live_5UHW4JE9sNglVN8scqcFweye */
var data_name = 'Veazy';
var currency = 'AUD';
