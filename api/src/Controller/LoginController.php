<?php
/**
 * CakePHP(tm) : Rapid Development Framework (http://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (http://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 * @copyright Copyright (c) Cake Software Foundation, Inc. (http://cakefoundation.org)
 * @link      http://cakephp.org CakePHP(tm) Project
 * @since     0.2.9
 * @license   http://www.opensource.org/licenses/mit-license.php MIT License
 */
namespace App\Controller;

use Cake\Event\Event;
use Cake\Core\Configure;
use Cake\Network\Exception\NotFoundException;
use Cake\View\Exception\MissingTemplateException;
use Cake\ORM\TableRegistry;
use Cake\Datasource\ConnectionManager;
use Cake\I18n\Time;
use Cake\Mailer\Email;
use Cake\Utility\Security;
use Cake\Routing\Router;

class LoginController extends AppController{
    public function initialize(){
        $this->loadComponent('RequestHandler');
    }
    public function checkValidToken(){

        $uid = $this->request->data['aid'];
        $token = $this->request->data['token'];
        $connection = ConnectionManager::get('default');
        $res = $connection->execute("SELECT  a_token.eStatus,admin.iPkAdminId,admin.vAdminEmail,admin.vAdminFirstName,admin.eAdminStatus
                                     FROM tbl_access_token as a_token
                                     LEFT JOIN mst_admin as admin ON admin.iPkAdminId = a_token.iAdminId
                                     WHERE a_token.iAdminId='" . $uid . "' AND a_token.vToken='".$token."' AND  a_token.eStatus='active'")->fetch('assoc');


        if (count($res) <= 1) {
            $this->response('f', '');
        } else {
            $this->response('s', $res);
        }
    }

    public function gettoken($adminid){
        $connection = ConnectionManager::get('default');
        $ip         = $_SERVER['REMOTE_ADDR'];
        $date       = date('Y-m-d H:i:s');

        $chk_token  = $connection->execute("select * from tbl_access_token where iAdminId ='".$adminid."'")->fetchAll('assoc');
        if(count($chk_token) >0) {
            $date_time = date_create_from_format('U.u', microtime(true))->format('YmdHisu');
            $hashkey   = sha1($date_time);
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $starttime = Time::now();
            $endtime   = Time::now();
            $endtime1   = $endtime->modify('+8 hours');
            $connection->update('tbl_access_token',['vToken' => $hashkey,'eStatus' =>'active','dtCreatedDate'=>$starttime,'vUserIp' => $ip,'dtExpireDate' => $endtime1],['iAdminId' => $adminid]);
        } else {

            $date_time = date_create_from_format('U.u', microtime(true))->format('YmdHisu');
            $hashkey   = sha1($date_time);
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $starttime = Time::now();
            $endtime   = Time::now();
            $endtime1   = $endtime->modify('+8 hours');
            $connection->insert('tbl_access_token', [
                'iUserId' => null,
                'iAdminId'=>$adminid,
                'vToken' => $hashkey,
                'vUserIp' => $ip,
                'eAppName' =>'admin',
                'eStatus' =>'active',
                'dtExpireDate' =>$endtime1,
                'dtCreatedDate' =>$starttime
            ]);
        }
    }

    public function index(){

        $email = '';
        $pwd = '';

        if (!empty($this->request->data['email']))
            $email = $this->request->data['email'];
        if (!empty($this->request->data['password']))
            $pwd = md5($this->request->data['password']);

        if($email != '' && $pwd != ''){
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("CALL sp_login('systemadmin','$email','$pwd')")->fetch('assoc');

            if (count($query) <= 1) {
                $this->response('f','','Invalid email or password');
            }else {
                $this->gettoken($query['iPkAdminId']);
                $get_token = $connection->execute("select vToken from tbl_access_token where iAdminId='{$query['iPkAdminId']}'")->fetch('assoc');
                $query['vToken'] = $get_token['vToken'];
                $this->response('s',$query,'Welcome To Admin Panel');
            }
        }else{
            $error = 'Email and password is required.';
            $this->response('f','',$error);
        }
    }
    public function logout(){

        $connection = ConnectionManager::get('default');
        $id  = $this->request->data['aid'];

        $update_expire = $connection->execute("update tbl_access_token set eStatus='expired' where iAdminId = '".$id."'");
        $this->response('s');
    }

}
