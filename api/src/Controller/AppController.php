<?php
/**
 * CakePHP(tm) : Rapid Development Framework (http://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (http://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright Copyright (c) Cake Software Foundation, Inc. (http://cakefoundation.org)
 * @link      http://cakephp.org CakePHP(tm) Project
 * @since     0.2.9
 * @license   http://www.opensource.org/licenses/mit-license.php MIT License
 */
namespace App\Controller;

use Cake\Controller\Controller;
use Cake\Event\Event;
use Cake\Core\Configure;
use Cake\ORM\TableRegistry;
use Cake\Datasource\ConnectionManager;
use Cake\I18n\Time;
use Cake\Filesystem\Folder;
use Cake\Filesystem\File;
use Cake\Mailer\Email;


/**
 * Application Controller
 *
 * Add your application-wide methods in the class below, your controllers
 * will inherit them.
 *
 * @link http://book.cakephp.org/3.0/en/controllers.html#the-app-controller
 */
class AppController extends Controller
{

    /**
     * Initialization hook method.
     *
     * Use this method to add common initialization code like loading components.
     *
     * e.g. `$this->loadComponent('Security');`
     *
     * @return void
     */
    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->loadComponent('Flash');

    }

    /**
     * Before render callback.
     *
     * @param \Cake\Event\Event $event The beforeRender event.
     * @return void
     */
    public function beforeRender(Event $event)
    {

        if (!array_key_exists('_serialize', $this->viewVars) &&
            in_array($this->response->type(), ['application/json', 'application/xml'])
        ) {
            $this->set('_serialize', true);
        }
    }

    public function checkValidToken(){

//        $token = '';
//        foreach (getallheaders() as $name => $value)
//        {
//            if ($name == 'Cookie') {
//                $k = explode(';', $value);
//                foreach ($k as $k1 => $v1) {
//                    $mystring = "'" . $v1 . "'";
//                    $findme = 'tok';
//                    $pos = strpos($mystring, $findme);
//                    if ($pos == true) {
//                        $final_token = explode('=', $v1);
//                        $token = $final_token['1'];
//                    }
//                }
//            }
//       }
//
//
//        $date = date('Y-m-d H:i:s');
//
//        $connection = ConnectionManager::get('default');
//
//        $res = $connection->execute("SELECT * FROM `tbl_access_token` WHERE `vToken`='$token' AND `dtExpireDate`>'$date'")->fetchAll('assoc');
//
//
//        if (count($res) == 0) {
//
//            $test = array();
//            $test['Status'] = 'Error';
//            $test['StatusCode'] = '401';
//            $test['Message'] = 'Unauthorized';
//            echo json_encode($test);
//            exit;
//        }

    }



    public function response($status, $response = array(), $message = '', $total = ''){
        $data = array();
        if ($status == 's') {
            $data['Status'] = 'True';
            if(empty(json_decode(json_encode($response), True))){
                $data['Data'] = '0';
            }else{
                $data['Data'] = '1';
            }
            $data['StatusCode'] = '1';
            $data['Message'] = $message;
            $data['Response'] = $response;
            if ($total)
                $data['Total'] = $total;
        } elseif ($status == 'f' || $status == 'e') {
            $data['Status'] = 'False';
            $data['StatusCode'] = '0';
            $data['Message'] = $message;
        }elseif($status == 'invalid' ){
            $data['Status']='False';
            $data['StatusCode']='2';
            $data['Message']=$message;
        }elseif ($status == 'u') {
            $data['Status'] = 'Unprocessable';
        }
        echo json_encode($data);
        exit;
    }

    /*check the token is valid or not by sending token*/
    public function checkTokenAPI(){

        $token='';
        $ln='';

        if(array_key_exists("token", getallheaders())) {
            foreach (getallheaders() as $name => $value) {
                if ($name == 'token') {
                    $token = $value;
                    $connection = ConnectionManager::get('default');
                    $query = $connection->execute("SELECT tkn.iUserId,tkn.vToken as token
                                               FROM tbl_access_token as tkn                              
                                               WHERE vToken ='" . $token . "'")->fetchAll('assoc');
                    if (count($query) == 0) {
                        $this->response('invalid', '', INVALID_TOKEN);
                    }
                }
                if ($name == 'lang') {
                    $ln = $value;
                    Configure::write('lang', $ln);
                    $this->render('/Elements/' . $ln);
                } else {
                    $this->render('/Elements/en');
                }

            }
        }else{
            $this->response('f', '', 'Unauthorized access');
        }

    }
    public function genrateOTP($length=null){
        $characters = '0123456789';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }

    //Comman function to send OTP by user id
    // sendvia will mobile / email / both

    public function sendOTP($userid,$title,$body,$otp,$sendvia){

        $connection = ConnectionManager::get('default');
        $udata = $connection->execute("select * from tbl_user_master where iUserId= :userid ", ['userid' => $userid])->fetch('assoc');
        $phone = $udata['vMobile'];
        $email = $udata['vEmail'];
        $name = $udata['vUsername'];

        if($sendvia=='both' || $sendvia=='mobile') {
            //SEND SMS
            $url = 'https://rest.nexmo.com/sms/json?' . http_build_query([
                    'api_key' => '8c378284',
                    'api_secret' => '295910ad97e3c9d3',
                    'to' => '91' . $phone,
                    'from' => '917383963824',
                    'text' => $body . ':' . $otp
                ]);

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_exec($ch);
        }

        if($sendvia=='email' || $sendvia=='both') {
            //SEND EMAIL
            $emails = $email;
            $username = $name;

            $dir = new Folder(WWW_ROOT . 'templates');
            $files = $dir->find('welcome.html', true);

            foreach ($files as $file) {
                $file = new File($dir->pwd() . DS . $file);
                $contents = $file->read();
                $file->close();
            }
            $emails_content = $contents;

            $patterns = array();
            $outputs = preg_replace($patterns, '', $emails_content);

            $message = str_replace(array('{TITLE}', '{FIRSTNAME}', '{BODY}'),
                array('OTP', $username, $body . ' : <b>' . $otp . '</b>'), $outputs);

            $email = new Email();
            if(EMAILTYPE == 'gmail'){
                Email::dropTransport('Gmail');
                Email::configTransport('Gmail', [
                    'host' => SMTPHOST,
                    'port' => SMTPPORT,
                    'username' => SMTPUSERNAME,
                    'password' => SMTPPASSWORD,
                    'className' => 'Smtp'
                ]);
                $email ->transport('Gmail');
            }else{
                Email::dropTransport('default');
                Email::configTransport('default', [
                    'host' => SMTPHOST,
                    'port' => SMTPPORT,
                    'username' => SMTPUSERNAME,
                    'password' => SMTPPASSWORD,
                    'className' => 'Mail',
                    'client' => null,
                    'tls' => null,
                ]);
                $email ->transport('default');
            }

            $email->emailFormat('html')
                ->from([ADMIN_EMAIL => PROJECTNAME])
                ->to([$emails])
                ->subject($title)
                ->send($message);
        }
        $connection->update('tbl_user_master', ['vOTP' => $otp,'eStatus'=>'inactive','eIsVerified'=>'0'],['iUserId'=>$userid]);

    }
    public function getUserinfo($id){
        $connection = ConnectionManager::get('default');
        $user_id = $id;
        $query = $connection->execute("SELECT um.iUserId,um.iParentUserId,
                                       um.vFirstName,um.vLastName,um.vUsername,um.vPassword,um.eGender,um.vEmail,
                                       um.vZipCode,um.vAddress,um.vMobile,um.vImage,um.vLongitude,
                                       um.vLatitude,um.dtLastLogin,um.eStatus,um.eIsOwner
                                       FROM  tbl_user_master as um
                                       WHERE `iUserId`= :userid AND um.eStatus='active'",['userid'=>$user_id])->fetch('assoc');


        if (file_exists(WWW_ROOT . 'img/user/' . $query['vImage'])) {
            $query['vImage'] = $query['vImage'];

        } else {
            $query['vImage'] = 'default_user.png';
        }
        return $query;
    }


}