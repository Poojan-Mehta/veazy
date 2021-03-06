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

use Cake\Core\Configure;
use Cake\ORM\TableRegistry;
use Cake\Datasource\ConnectionManager;
use Cake\I18n\Time;
use Cake\Utility\Security;
class AuthController extends AppController
{
    public function initialize()
    {
         $this->loadComponent('RequestHandler');
    }

    public function gettoken($userid)
    {
        $this->autoRender = false;
        $articles = TableRegistry::get('Token');
        $sql=$articles->find()->where(['user_id' => $userid]);
        $sql->hydrate(false);
        $res=$sql->toArray();

        if(count($res) > 0){
            $date_time=date_create_from_format('U.u', microtime(true))->format('YmdHisu');
            $hashkey = sha1($date_time);
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $starttime = Time::now();
            $endtime = Time::now();
            $endtime= $endtime->modify('+8 hours');
            $connection = ConnectionManager::get('default');
            $connection->update('token',['token' => $hashkey,'start_time'=>$starttime,'end_time' => $endtime],['user_id' => $userid]);
            return $hashkey;
        }else{

            $date_time=date_create_from_format('U.u', microtime(true))->format('YmdHisu');
            $hashkey = sha1($date_time);
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $starttime = Time::now();
            $endtime = Time::now();
            $endtime= $endtime->modify('+8 hours');

            $connection = ConnectionManager::get('default');
            $connection->insert('token', [
                'user_id' => $userid,
                'token' => $hashkey,
                'start_time' => $starttime,
                'end_time' => $endtime
            ]);
            return $hashkey;
        }
    }
    public function login()
    {
       $type="";
       $email="";
       $password="";

        if(!empty($this->request->data['type']))
            $type= $this->request->data['type'];
        if(!empty($this->request->data['email']))
            $email= $this->request->data['email'];
        if(!empty($this->request->data['password'])){
            $password= $this->request->data['password'];
            $password=Security::hash($password, 'md5');
        }

        if($this->request->is('GET'))
            $this->response('f','',METHOD_NOT_ALLOWED);

        if($type == '' || $email == '' || $password == '')
            $this->response('f','',UNPROCESSABLE_ENTITY);

        $typeArray = array("web", "mobile");
        if (!in_array($type, $typeArray)){
            $this->response('f','',TYPE_WRONG);
        }


        if($type == 'web')
            $role = '1,2,3';
        else if($type == 'mobile')
            $role = '3';

        //$this->request->session()->write('role', $role);

        $this->request->Session()->write('role',$role);
        $connection = ConnectionManager::get('default');

        $query=$connection->execute("CALL `pr_user_admin_master`('" .$email. "', '" .$password. "')")->fetchAll('assoc');
       // $res = $query->fetchAll('assoc');
       // $query->hydrate(false);
       // $res = $query->toArray();
       // $query->hydrate(false);
       // print_r($query);
        if(count($query) > 0){
            // $res[0]['token']=$this->gettoken($res[0]['id']);
            $this->response('s',$query[0]);
        }else
            $this->response('f','',DETAIL_WRONG);


    }

    public function logout()
    {
        $type="";

        if(!empty($this->request->query['type']))
            $type= $this->request->query['type'];

        if($type == '')
            $this->response('f','',UNPROCESSABLE_ENTITY);
        $typeArray = array("web","ios","android");
        if (!in_array($type, $typeArray)){
            $this->response('f','',TYPE_WRONG);
        }

        $connection = ConnectionManager::get('default');
        $id    = $this->request->query['uid'];
        $logindata = unserialize(file_get_contents('http://www.geoplugin.net/php.gp?ip='.$_SERVER['REMOTE_ADDR']));

        $country = $this->transliterateString($logindata['geoplugin_countryName']);
        $state   = $this->transliterateString($logindata['geoplugin_region']);
        $city    = $this->transliterateString($logindata['geoplugin_city']);
        echo $city;exit;

        $query = $connection->execute("CALL `sp_lastlogin`('frontenduser','$id','','$country','$state','$city')");


        $this->response('s');
    }

    function transliterateString($txt)
    {
        $transliterationTable = array('??' => 'a', '??' => 'A', '??' => 'a', '??' => 'A', '??' => 'a', '??' => 'A', '??' => 'a', '??' => 'A', '??' => 'a', '??' => 'A', '??' => 'a', '??' => 'A', '??' => 'a', '??' => 'A', '??' => 'a', '??' => 'A', '??' => 'ae', '??' => 'AE', '??' => 'ae', '??' => 'AE', '???' => 'b', '???' => 'B', '??' => 'c', '??' => 'C', '??' => 'c', '??' => 'C', '??' => 'c', '??' => 'C', '??' => 'c', '??' => 'C', '??' => 'c', '??' => 'C', '??' => 'd', '??' => 'D', '???' => 'd', '???' => 'D', '??' => 'd', '??' => 'D', '??' => 'dh', '??' => 'Dh', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '???' => 'f', '???' => 'F', '??' => 'f', '??' => 'F', '??' => 'g', '??' => 'G', '??' => 'g', '??' => 'G', '??' => 'g', '??' => 'G', '??' => 'g', '??' => 'G', '??' => 'h', '??' => 'H', '??' => 'h', '??' => 'H', '??' => 'i', '??' => 'I', '??' => 'i', '??' => 'I', '??' => 'i', '??' => 'I', '??' => 'i', '??' => 'I', '??' => 'i', '??' => 'I', '??' => 'i', '??' => 'I', '??' => 'i', '??' => 'I', '??' => 'j', '??' => 'J', '??' => 'k', '??' => 'K', '??' => 'l', '??' => 'L', '??' => 'l', '??' => 'L', '??' => 'l', '??' => 'L', '??' => 'l', '??' => 'L', '???' => 'm', '???' => 'M', '??' => 'n', '??' => 'N', '??' => 'n', '??' => 'N', '??' => 'n', '??' => 'N', '??' => 'n', '??' => 'N', '??' => 'o', '??' => 'O', '??' => 'o', '??' => 'O', '??' => 'o', '??' => 'O', '??' => 'o', '??' => 'O', '??' => 'o', '??' => 'O', '??' => 'oe', '??' => 'OE', '??' => 'o', '??' => 'O', '??' => 'o', '??' => 'O', '??' => 'oe', '??' => 'OE', '???' => 'p', '???' => 'P', '??' => 'r', '??' => 'R', '??' => 'r', '??' => 'R', '??' => 'r', '??' => 'R', '??' => 's', '??' => 'S', '??' => 's', '??' => 'S', '??' => 's', '??' => 'S', '???' => 's', '???' => 'S', '??' => 's', '??' => 'S', '??' => 's', '??' => 'S', '??' => 'SS', '??' => 't', '??' => 'T', '???' => 't', '???' => 'T', '??' => 't', '??' => 'T', '??' => 't', '??' => 'T', '??' => 't', '??' => 'T', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'u', '??' => 'U', '??' => 'ue', '??' => 'UE', '???' => 'w', '???' => 'W', '???' => 'w', '???' => 'W', '??' => 'w', '??' => 'W', '???' => 'w', '???' => 'W', '??' => 'y', '??' => 'Y', '???' => 'y', '???' => 'Y', '??' => 'y', '??' => 'Y', '??' => 'y', '??' => 'Y', '??' => 'z', '??' => 'Z', '??' => 'z', '??' => 'Z', '??' => 'z', '??' => 'Z', '??' => 'th', '??' => 'Th', '??' => 'u', '??' => 'a', '??' => 'a', '??' => 'b', '??' => 'b', '??' => 'v', '??' => 'v', '??' => 'g', '??' => 'g', '??' => 'd', '??' => 'd', '??' => 'e', '??' => 'E', '??' => 'e', '??' => 'E', '??' => 'zh', '??' => 'zh', '??' => 'z', '??' => 'z', '??' => 'i', '??' => 'i', '??' => 'j', '??' => 'j', '??' => 'k', '??' => 'k', '??' => 'l', '??' => 'l', '??' => 'm', '??' => 'm', '??' => 'n', '??' => 'n', '??' => 'o', '??' => 'o', '??' => 'p', '??' => 'p', '??' => 'r', '??' => 'r', '??' => 's', '??' => 's', '??' => 't', '??' => 't', '??' => 'u', '??' => 'u', '??' => 'f', '??' => 'f', '??' => 'h', '??' => 'h', '??' => 'c', '??' => 'c', '??' => 'ch', '??' => 'ch', '??' => 'sh', '??' => 'sh', '??' => 'sch', '??' => 'sch', '??' => '', '??' => '', '??' => 'y', '??' => 'y', '??' => '', '??' => '', '??' => 'e', '??' => 'e', '??' => 'ju', '??' => 'ju', '??' => 'ja', '??' => 'ja');
        return str_replace(array_keys($transliterationTable), array_values($transliterationTable), $txt);
    }
    /*public function authResponse($status,$response=array(),$message=''){

        $data=array();
        if($status == 's'){
            $data['Status']='True';
            $data['Response']=$response;
        }elseif($status == 'f' || $status == 'e'){
            $data['Status']='False';
            $data['Message']=$message;
        }
        echo json_encode($data);exit;
    }*/

}
