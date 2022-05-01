'use strict';

/* Controllers */

app.controller('settingCtrl', ['$scope', '$window', '$http', '$rootScope', '$timeout', '$filter', '$stateParams', '$state', 'toaster', 'prompt',
    function ($scope, $window, $http, $rootScope, $timeout, $filter, $stateParams, $state, toaster, prompt) {


        $http.get(webservice_path + '/gps/devicecomand').success(function (res) {
            if (res.Status == 'True') {
                $scope.dcomand = res.Response;
            }
        });

        $scope.add_sim_form = function (isValid)
        {
            $scope.submitted = true;

            var imei = $scope.vImeiNumber;
            var vSetting = $scope.vSetting;
            var Command = $scope.Command;

           /* if(vSetting == 'CDP')
            {
                $scope.Commandvalue = 'PASSWORD,000000,'+Command+'#';
            }
            if(vSetting == 'SI')
            {
                $scope.Commandvalue = 'INTERVAL,000000,'+Command+'#';
            }
            if(vSetting == 'SPI')
            {
                $scope.Commandvalue = 'Speedalarm,000000,'+Command+'#';
            }
            if(vSetting == 'RM')
            {
                $scope.Commandvalue = 'MILEAGE,000000,'+Command+'#';
            }
            if(vSetting == 'SAPN')
            {
                $scope.Commandvalue = 'APN,000000,'+Command+',esky,esky#';
            }*/
            if(isValid)
            {
                var socket = io.connect('http://202.131.106.51:4455');

                //var socket = io.connect('http://192.168.1.68:1012');

                socket.emit('sendcommand', {imei: $scope.vImeiNumber,setting:$scope.vSetting,Command: $scope.Command});

                socket.on('commandresponse', function(cresponse) {

                    console.log(cresponse);


                });

            }


        }


    }]);

