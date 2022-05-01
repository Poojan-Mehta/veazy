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
use Cake\Filesystem\Folder;
use Cake\Filesystem\File;

class AdminController extends AppController
{
    public function initialize(){
        $this->loadComponent('RequestHandler');
        $this->checkValidToken();
    }


    public function index(){
        $date  = date('2018-02-01');
        $connection = ConnectionManager::get('default');
        $id = $this->request->query['aid'];
        $query = $connection->execute("SELECT sa.*,sa.iPkAdminId,sa.iFkRoleId,sa.vAdminEmail,sa.vAdminFirstName,sa.vAdminLastName,sa.vAdminMobile,sa.dtAdminCreatedOn,sa.eAdminStatus,rm.vRoleName
        FROM mst_admin AS sa
        LEFT JOIN mst_role AS rm ON sa.iFkRoleId = rm.iPkRoleId
        WHERE sa.eAdminStatus != 'deleted' AND iPkAdminId != $id AND sa.iFkRoleId != 1 ORDER BY sa.dtAdminCreatedOn DESC")->fetchAll('assoc');

        $this->response('s', $query);
    }
    public function changeStatus(){
        if(isset($this->request->data['statusId'])){
            $id = $this->request->data['statusId'];

            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            }else{
                $status = 'active';
            }
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("UPDATE mst_admin SET eAdminStatus='".$status."',
            dtAdminUpdatedOn=now() WHERE iPkAdminId='".$id."'");
            $this->response('s');
        }else{
            $this->response('f');
        }
    }

    public function changeStatusAll(){
        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];
            $userId = $this->request->data['aid'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            }else{
                $status = 'active';
            }
            $connection = ConnectionManager::get('default');
            foreach($ids as $id){
                $query = $connection->execute("UPDATE mst_admin SET eAdminStatus='".$status."',
                dtAdminUpdatedOn=now() WHERE iPkAdminId='".$id."'");
            }
            $this->response('s');
        }
    }


    public function delete(){
        if(isset($this->request->data['deleteId'])){
            $id = $this->request->data['deleteId'];
            $userId = $this->request->data['aid'];
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("UPDATE mst_admin SET eAdminStatus='deleted',
            dtAdminUpdatedOn=now() WHERE iPkAdminId='".$id."'");
            $this->response('s');
        }
    }

    public function deleteAll(){
        if(isset($this->request->data['deleteIds'])){
            $ids = $this->request->data['deleteIds'];
            $userId = $this->request->data['aid'];

            $connection = ConnectionManager::get('default');
            foreach($ids as $id){
                $query = $connection->execute("UPDATE mst_admin SET eAdminStatus='deleted',
                dtAdminUpdatedOn=now() WHERE iPkAdminId='".$id."'");
            }
            $this->response('s');
        }
    }

    public function view(){
        $userId = $this->request->query['aid'];
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select sa.*,sa.iPkAdminId,sa.iFkRoleId,sa.vAdminEmail,sa.vAdminFirstName,sa.vAdminLastName,sa.vAdminMobile,sa.dtAdminCreatedOn,sa.eAdminStatus,rm.vRoleName
        from mst_admin as sa
        left join mst_role as rm on sa.iFkRoleId = rm.iPkRoleId
        where sa.iPkAdminId='".$userId."'")->fetch('assoc');
        $this->response('s', $query);
    }

    public function generateRandomString($length = 10) {
        $connection = ConnectionManager::get('default');
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }

    public function add(){
        $vFirstName = '';
        $vLastName = '';
        $vPhone = '';
        $vEmail = '';
        $vDescription = '';
        $iRoleId = '';

        if (!empty($this->request->data['vFirstName']))
            $vFirstName = $this->request->data['vFirstName'];

        if (!empty($this->request->data['vLastName']))
            $vLastName = $this->request->data['vLastName'];

        if (!empty($this->request->data['vEmail']))
             $vEmail = $this->request->data['vEmail'];

        if (!empty($this->request->data['vMobile']))
            $vPhone = $this->request->data['vMobile'];

        if (!empty($this->request->data['vDescription']))
            $vDescription = $this->request->data['vDescription'];

        if (!empty($this->request->data['iRoleId']))
            $iRoleId = $this->request->data['iRoleId'];

        if($vFirstName == '' || $vLastName == '' || $vEmail == '' || $vPhone == '' || $iRoleId == ''){
            $this->response('f', '', 'Incomplete parameter');
        }

        if ($this->request->is(['post'])){
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $password = $this->generateRandomString();
            $connection = ConnectionManager::get('default');
            $connection->begin();

            $checkemailExist = $connection->execute("SELECT * FROM mst_admin WHERE vAdminEmail='".$vEmail."' AND eAdminStatus != 'deleted'")->fetchAll('assoc');

            if(count($checkemailExist) == 0){
                    try {
                        $query = $connection->insert('mst_admin', [
                            'vAdminFirstName' => $vFirstName,
                            'vAdminLastName' => $vLastName,
                            'vAdminPassword' => md5($password),
                            'vAdminEmail' => $vEmail,
                            'vAdminMobile' => $vPhone,
                            'vAdminAddress' => $vDescription,
                            'iFkRoleId' => $iRoleId,
                            'eAdminStatus' => 'active',
                            'dtAdminCreatedOn' => Time::now()]);

                        $baseurl = Router::url('/', true);
                        $baseurl = explode('api',$baseurl);
                        $baseurl = $baseurl[0];

                        $link_login=$baseurl."admin";
                        $message_login="<a href=".$link_login.">here</a>";

                        //link set password
                        $message_setpass = $password;

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
                        $email->template('new_user')
                            ->emailFormat('html')
                            ->viewVars(['first' => $vFirstName,'email' => $vEmail,'link_login' => $message_login, 'link_crate_pass' =>$message_setpass])
                            ->from([ADMIN_EMAIL => PROJECTNAME])
                            ->to([$vEmail => $vFirstName.' '.$vLastName])
                            ->subject(PROJECTNAME.' - New Account')
                            ->send();

                        $connection->commit();
                        $this->response('s','','User has been created successfully.');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
            }else{
                $this->response('f','','Email already exist');
            }
        }
    }


    public function edit(){

        $id = '';
        $userid = '';
        $vFirstName = '';
        $vLastName = '';
        $vPhone = '';
        $vEmail = '';
        $vDescription = '';
        $iRoleId = '';

        if (!empty($this->request->data['id']))
            $id = $this->request->data['id'];

        if (!empty($this->request->data['userId']))
            $userid = $this->request->data['userId'];

        if (!empty($this->request->data['vFirstName']))
            $vFirstName = $this->request->data['vFirstName'];

        if (!empty($this->request->data['vLastName']))
            $vLastName = $this->request->data['vLastName'];


        if (!empty($this->request->data['vEmail']))
            $vEmail = $this->request->data['vEmail'];

        if (!empty($this->request->data['vMobile']))
            $vPhone = $this->request->data['vMobile'];

        if (!empty($this->request->data['vDescription']))
            $vDescription = $this->request->data['vDescription'];

        if (!empty($this->request->data['iRoleId']))
            $iRoleId = $this->request->data['iRoleId'];

        if($id == '' || $userid == '' || $vFirstName == '' || $vLastName == '' || $vEmail == '' || $vPhone == '' || $iRoleId == ''){
            $this->response('f', '', 'Incomplete parameter');
        }

        if ($this->request->is(['post'])){


            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            $checkemailExist = $connection->execute("SELECT * FROM mst_admin WHERE vAdminEmail='".$vEmail."' AND eAdminStatus != 'deleted' AND iPkAdminId != '".$id."'")->fetchAll('assoc');
            if(count($checkemailExist) == 0){
                    try {
                        $query = $connection->update('mst_admin', [
                            'vAdminFirstName' => $vFirstName,
                            'vAdminLastName' => $vLastName,
                            'vAdminEmail' => $vEmail,
                            'vAdminMobile' => $vPhone,
                            'vAdminAddress' => $vDescription,
                            'iFkRoleId' => $iRoleId,
                            'dtAdminUpdatedOn' => Time::now()],
                            ['iPkAdminId' => $userid]);
                        $connection->commit();
                        $this->response('s',$vFirstName,'User updated successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }

            }else{
                $this->response('f','','Email already exist');
            }
        }
    }

    public function  changepassword(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $id = $this->request->data['userid'];
        $currentpassword = $this->request->data['currentpassword'];
        $newpassword = md5($this->request->data['newpassword']);


        $query = $connection->execute("select * from mst_admin where iPkAdminId='".$id."' and eAdminStatus='active'")->fetchAll('assoc');
        $password = $query[0]['vAdminPassword'];

        if ($password == md5($currentpassword)) {

            $connection->execute("CALL `sp_changepassword`('systemadmin',$id,'$newpassword')");
            $this->response('s');
        } else {
            $this->response('False');
        }

    }

    public function demopay(){
        echo '<pre>';
        print_r($_REQUEST);exit;
    }

}
