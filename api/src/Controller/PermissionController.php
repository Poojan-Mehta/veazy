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

class PermissionController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT iPkRoleId,vRoleName FROM  mst_role  where eStatus='active' AND vRoleName!='superadmin' ORDER BY dtCreatedOn DESC ")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function view($id){
        $connection = ConnectionManager::get('default');

        $query = $connection->execute("SELECT iPkRoleId,vRoleName FROM  mst_role where iPkRoleId='".$id."'")->fetch('assoc');

        if($query){
            $this->response('s', $query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function add(){
        if (isset($this->request->data['vRolName'])) {
            $roleName = $this->request->data['vRolName'];
            $userId = $this->request->data['aid'];
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $checkRoleExist = $connection->execute("SELECT * FROM mst_role WHERE eStatus != 'deleted' AND LOWER(vRoleName)=:rolename", ['rolename' => strtolower($roleName)])->fetchAll('assoc');
                if (count($checkRoleExist) == 0) {
                    $connection->begin();
                    try {
                        $query = $connection->insert('mst_role', [
                            'vRoleName' => $roleName,
                            'eStatus' => 'active',
                            'dtCreatedOn' => Time::now()]);
                        $connection->commit();
                        $this->response('s', '', 'Role added successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                } else {
                    $this->response('f', '', 'Role Name already exist');
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
        }
    }
    
    public function edit(){
        $roleName = '';
        $roleId = '';

        if (!empty($this->request->data['roleId']))
            $roleId = $this->request->data['roleId'];

        if (!empty($this->request->data['vRolName']))
            $roleName = $this->request->data['vRolName'];

        if($roleId == '' || $roleName == ''){
            $this->response('s','','Incomplete Parameter');
        }
        $userId = $this->request->data['aid'];

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $checkRoleExist = $connection->execute("SELECT * FROM mst_role WHERE eStatus != 'deleted' AND LOWER(vRoleName)=:rolename AND iPkRoleId!=:roleid", ['rolename' => strtolower($roleName),'roleid' => $roleId])->fetchAll('assoc');
            if (count($checkRoleExist) == 0) {
                $connection->begin();
                try {
                    $query = $connection->update('mst_role', [
                        'vRoleName' => $roleName],['iPkRoleId' => $roleId]);
                    $connection->commit();
                    $this->response('s', '', 'Role updated successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Role Name already exist');
            }
        } else {
            $this->response('f', '', 'Invalid method');
        }
    }

    public function delete()
    {
        if (isset($this->request->data['deleteId'])) {
            $id = $this->request->data['deleteId'];
            $userId = $this->request->data['aid'];
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $connection->begin();

                $checkerole = $connection->execute("SELECT count(*) as cnt FROM mst_admin where iPkAdminId = '$id' and eAdminStatus!='deleted' ")->fetch('assoc');

                if ($checkerole['cnt'] == 0) {
                    try {
                        $query = $connection->update('mst_role', [
                            'eStatus' => 'deleted'], ['iPkRoleId' => $id]);
                        $connection->commit();
                        $this->response('s', '', 'Role deleted successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                } else {
                    $this->response('f', '', 'This Role is in use');
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function deleteAll()
    {
        if (isset($this->request->data['deleteIds'])) {
            $ids = $this->request->data['deleteIds'];
            $userId = $this->request->data['aid'];

            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $connection->begin();

                $checkerole = $connection->execute("SELECT count(*) as cnt FROM mst_admin where eAdminStatus!='deleted' AND iPkAdminId IN (" . implode(',', $ids) . ")")->fetch('assoc');

                if ($checkerole['cnt'] == 0) {

                    try {
                        $connection->query("UPDATE mst_role SET `eStatus` = 'deleted' WHERE iPkRoleId IN (" . implode(',', $ids) . ")")->execute();
                        $connection->commit();
                        $this->response('s', '', 'Role deleted successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('e', '', $error);
                    }

                } else {
                    $this->response('e', '', 'This Role is in use');
                }
            } else {
                $this->response('e', '', 'Invalid method');
            }
        }
    }

    public function getrole(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM mst_role where eStatus = 'active' and vRoleName != 'superadmin'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function viewselected(){

        if($this->request->data['rid']){
            $id = $this->request->data['rid'];
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("SELECT iPkPermissionId,iFkRoleId,vPermissionMenu FROM mst_role_permission where iFkRoleId='".$id."'")->fetch('assoc');
            $this->response('s',$query);
        }else{
            $this->response('f');
        }
    }

    public function saverole(){
        $connection = ConnectionManager::get('default');
        $main_menu = $this->request->data['main_menu'];
        $role_id = $this->request->data['role_id'];

        $check_data = $connection->execute("SELECT iPkPermissionId FROM mst_role_permission where iFkRoleId='".$role_id."'")->fetchAll('assoc');
        if(count($check_data) > 0){
            $query = $connection->execute("UPDATE  mst_role_permission SET iFkRoleId ='".$role_id."',vPermissionMenu ='".$main_menu."' WHERE  iFkRoleId='".$role_id."'");
        }else{
            $query = $connection->execute("INSERT INTO mst_role_permission SET iFkRoleId ='".$role_id."',vPermissionMenu ='".$main_menu."'");
        }
        $this->response('s',$query);
    }
}
