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

class MenuController extends AppController
{
    public function index(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("call sp_cms_menu ('select','0','','','0','0','deleted')")->fetchAll('assoc');
        foreach ($query as $key => $value) {
            $menuID = $value['iPkMenuId'];

            $assign = 'no';
            $menu = $connection->execute("select * from mst_cms_page WHERE vCmsPageName= '".$menuID."' AND eCmsPageStatus != 'deleted'")->fetchAll('assoc');

            if (count($menu)) {
                $assign = 'yes';
            }
            $query[$key]['assign'] = $assign;
        }
        $this->response('s', $query);
    }

    public function view($menuId){

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("call sp_cms_menu ('selectbyId','$menuId','','','0','0','')")->fetch('assoc');
        if($query){
            $this->response('s', $query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function changeStatus(){
        if(isset($this->request->data['statusId'])){
            $id = $this->request->data['statusId'];
            $menuId = $this->request->data['aid'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            }else{
                $status = 'active';
            }
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("call sp_cms_menu ('$status','$id','','','','','$status')");
            $this->response('s');
        }else{
            $this->response('f');
        }
    }

    public function changeStatusAll(){

        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            }else{
                $status = 'active';
            }

            $connection = ConnectionManager::get('default');
            foreach($ids as $id){
                $query = $connection->execute("call sp_cms_menu ('$status','$id','','','','','$status')");
            }
            $this->response('s');
        }
    }

    public function delete(){

        if(isset($this->request->data['deleteId'])){
            $id = $this->request->data['deleteId'];
            $connection = ConnectionManager::get('default');
            $checkepage = $connection->execute("SELECT count(*) as cnt FROM mst_cms_page where vCmsPageName = '".$id."' and eCmsPageStatus!='deleted' ")->fetch('assoc');
            if($checkepage['cnt'] == 0) {

            $query = $connection->execute("call sp_cms_menu ('delete','$id','','','','','deleted')");
            } else {
                $this->response('f', '', 'This Page Is in use');
            }
            $this->response('s');
        }
    }

    public function deleteAll(){
        if(isset($this->request->data['deleteIds'])){
            $ids = $this->request->data['deleteIds'];
            $userId = $this->request->data['aid'];
            $connection = ConnectionManager::get('default');

            $checkepage = $connection->execute("SELECT count(*) as cnt FROM mst_cms_page where vCmsPageName IN (" . implode(',', $ids) . ") and eCmsPageStatus!='deleted' ")->fetch('assoc');

            if($checkepage['cnt'] == 0) {

                foreach($ids as $id) {

                $query = $connection->execute("call sp_cms_menu ('delete','$id','','','','','deleted')");
               }
            } else {
                $this->response('e', '', 'This Page Is in use');
            }
            $this->response('s');
        }
    }

    public function add(){
        $vMenuName = '';
        $eMenuStatus = '';

        if (!empty($this->request->data['vMenuName']))
            $vMenuName = $this->request->data['vMenuName'];
            $string = preg_replace('/\s+/', '', $vMenuName);
            $menuslug=strtolower($string);

        if (!empty($this->request->data['eMenuStatus']))
            $eMenuStatus = $this->request->data['eMenuStatus'];

        if($vMenuName == '' || $eMenuStatus == ''){
            $this->response('f', '', 'Incomplete parameter');
        }

        if ($this->request->is(['post'])){
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');

            $connection = ConnectionManager::get('default');
            $connection->begin();
                    try {
                        $query = $connection->insert('mst_cms_menu', [
                            'vMenuName' => $vMenuName,
                            'vMenuSlug' => $menuslug,
                            'dtMenuCreatedDate' => Time::now(),
                            'eMenuStatus' => $eMenuStatus ]);
                        $connection->commit();
                        $this->response('s','','Menu added successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
            }else{
                $this->response('f','','Menu Order already exist');
            }
    }

    public function edit(){

        $menuId = '';
        $vMenuName = '';
        $eMenuStatus = '';

        if (!empty($this->request->data['id']))
            $id = $this->request->data['id'];

        if (!empty($this->request->data['menuId']))
            $menuId = $this->request->data['menuId'];

        if (!empty($this->request->data['vMenuName']))
            $vMenuName = $this->request->data['vMenuName'];

            $string = preg_replace('/\s+/', '', $vMenuName);
            $menuslug=strtolower($string);
            $vMenuSlug = $menuslug;

        if (!empty($this->request->data['eMenuStatus']))
            $eMenuStatus = $this->request->data['eMenuStatus'];

        if($vMenuName == '' || $vMenuSlug == '' || $eMenuStatus == ''){
            $this->response('f', '', 'Incomplete parameter');
        }

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
                try {
                    $query = $connection->update('mst_cms_menu', [
                        'vMenuName' => $vMenuName,
                        'vMenuSlug' => $vMenuSlug,
                        'eMenuStatus' => $eMenuStatus], ['iPkMenuId' => $menuId]);
                    $connection->commit();
                    $this->response('s', '', 'Menu updated successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            }else{
                $this->response('f','','Menu Order already exist');
            }
    }
}
