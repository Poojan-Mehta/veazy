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
        $transliterationTable = array('á' => 'a', 'Á' => 'A', 'à' => 'a', 'À' => 'A', 'ă' => 'a', 'Ă' => 'A', 'â' => 'a', 'Â' => 'A', 'å' => 'a', 'Å' => 'A', 'ã' => 'a', 'Ã' => 'A', 'ą' => 'a', 'Ą' => 'A', 'ā' => 'a', 'Ā' => 'A', 'ä' => 'ae', 'Ä' => 'AE', 'æ' => 'ae', 'Æ' => 'AE', 'ḃ' => 'b', 'Ḃ' => 'B', 'ć' => 'c', 'Ć' => 'C', 'ĉ' => 'c', 'Ĉ' => 'C', 'č' => 'c', 'Č' => 'C', 'ċ' => 'c', 'Ċ' => 'C', 'ç' => 'c', 'Ç' => 'C', 'ď' => 'd', 'Ď' => 'D', 'ḋ' => 'd', 'Ḋ' => 'D', 'đ' => 'd', 'Đ' => 'D', 'ð' => 'dh', 'Ð' => 'Dh', 'é' => 'e', 'É' => 'E', 'è' => 'e', 'È' => 'E', 'ĕ' => 'e', 'Ĕ' => 'E', 'ê' => 'e', 'Ê' => 'E', 'ě' => 'e', 'Ě' => 'E', 'ë' => 'e', 'Ë' => 'E', 'ė' => 'e', 'Ė' => 'E', 'ę' => 'e', 'Ę' => 'E', 'ē' => 'e', 'Ē' => 'E', 'ḟ' => 'f', 'Ḟ' => 'F', 'ƒ' => 'f', 'Ƒ' => 'F', 'ğ' => 'g', 'Ğ' => 'G', 'ĝ' => 'g', 'Ĝ' => 'G', 'ġ' => 'g', 'Ġ' => 'G', 'ģ' => 'g', 'Ģ' => 'G', 'ĥ' => 'h', 'Ĥ' => 'H', 'ħ' => 'h', 'Ħ' => 'H', 'í' => 'i', 'Í' => 'I', 'ì' => 'i', 'Ì' => 'I', 'î' => 'i', 'Î' => 'I', 'ï' => 'i', 'Ï' => 'I', 'ĩ' => 'i', 'Ĩ' => 'I', 'į' => 'i', 'Į' => 'I', 'ī' => 'i', 'Ī' => 'I', 'ĵ' => 'j', 'Ĵ' => 'J', 'ķ' => 'k', 'Ķ' => 'K', 'ĺ' => 'l', 'Ĺ' => 'L', 'ľ' => 'l', 'Ľ' => 'L', 'ļ' => 'l', 'Ļ' => 'L', 'ł' => 'l', 'Ł' => 'L', 'ṁ' => 'm', 'Ṁ' => 'M', 'ń' => 'n', 'Ń' => 'N', 'ň' => 'n', 'Ň' => 'N', 'ñ' => 'n', 'Ñ' => 'N', 'ņ' => 'n', 'Ņ' => 'N', 'ó' => 'o', 'Ó' => 'O', 'ò' => 'o', 'Ò' => 'O', 'ô' => 'o', 'Ô' => 'O', 'ő' => 'o', 'Ő' => 'O', 'õ' => 'o', 'Õ' => 'O', 'ø' => 'oe', 'Ø' => 'OE', 'ō' => 'o', 'Ō' => 'O', 'ơ' => 'o', 'Ơ' => 'O', 'ö' => 'oe', 'Ö' => 'OE', 'ṗ' => 'p', 'Ṗ' => 'P', 'ŕ' => 'r', 'Ŕ' => 'R', 'ř' => 'r', 'Ř' => 'R', 'ŗ' => 'r', 'Ŗ' => 'R', 'ś' => 's', 'Ś' => 'S', 'ŝ' => 's', 'Ŝ' => 'S', 'š' => 's', 'Š' => 'S', 'ṡ' => 's', 'Ṡ' => 'S', 'ş' => 's', 'Ş' => 'S', 'ș' => 's', 'Ș' => 'S', 'ß' => 'SS', 'ť' => 't', 'Ť' => 'T', 'ṫ' => 't', 'Ṫ' => 'T', 'ţ' => 't', 'Ţ' => 'T', 'ț' => 't', 'Ț' => 'T', 'ŧ' => 't', 'Ŧ' => 'T', 'ú' => 'u', 'Ú' => 'U', 'ù' => 'u', 'Ù' => 'U', 'ŭ' => 'u', 'Ŭ' => 'U', 'û' => 'u', 'Û' => 'U', 'ů' => 'u', 'Ů' => 'U', 'ű' => 'u', 'Ű' => 'U', 'ũ' => 'u', 'Ũ' => 'U', 'ų' => 'u', 'Ų' => 'U', 'ū' => 'u', 'Ū' => 'U', 'ư' => 'u', 'Ư' => 'U', 'ü' => 'ue', 'Ü' => 'UE', 'ẃ' => 'w', 'Ẃ' => 'W', 'ẁ' => 'w', 'Ẁ' => 'W', 'ŵ' => 'w', 'Ŵ' => 'W', 'ẅ' => 'w', 'Ẅ' => 'W', 'ý' => 'y', 'Ý' => 'Y', 'ỳ' => 'y', 'Ỳ' => 'Y', 'ŷ' => 'y', 'Ŷ' => 'Y', 'ÿ' => 'y', 'Ÿ' => 'Y', 'ź' => 'z', 'Ź' => 'Z', 'ž' => 'z', 'Ž' => 'Z', 'ż' => 'z', 'Ż' => 'Z', 'þ' => 'th', 'Þ' => 'Th', 'µ' => 'u', 'а' => 'a', 'А' => 'a', 'б' => 'b', 'Б' => 'b', 'в' => 'v', 'В' => 'v', 'г' => 'g', 'Г' => 'g', 'д' => 'd', 'Д' => 'd', 'е' => 'e', 'Е' => 'E', 'ё' => 'e', 'Ё' => 'E', 'ж' => 'zh', 'Ж' => 'zh', 'з' => 'z', 'З' => 'z', 'и' => 'i', 'И' => 'i', 'й' => 'j', 'Й' => 'j', 'к' => 'k', 'К' => 'k', 'л' => 'l', 'Л' => 'l', 'м' => 'm', 'М' => 'm', 'н' => 'n', 'Н' => 'n', 'о' => 'o', 'О' => 'o', 'п' => 'p', 'П' => 'p', 'р' => 'r', 'Р' => 'r', 'с' => 's', 'С' => 's', 'т' => 't', 'Т' => 't', 'у' => 'u', 'У' => 'u', 'ф' => 'f', 'Ф' => 'f', 'х' => 'h', 'Х' => 'h', 'ц' => 'c', 'Ц' => 'c', 'ч' => 'ch', 'Ч' => 'ch', 'ш' => 'sh', 'Ш' => 'sh', 'щ' => 'sch', 'Щ' => 'sch', 'ъ' => '', 'Ъ' => '', 'ы' => 'y', 'Ы' => 'y', 'ь' => '', 'Ь' => '', 'э' => 'e', 'Э' => 'e', 'ю' => 'ju', 'Ю' => 'ju', 'я' => 'ja', 'Я' => 'ja');
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
