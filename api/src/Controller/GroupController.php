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

class GroupController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  tbl_mst_groups ORDER BY iPkGroupId DESC ")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function view($id){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  tbl_mst_groups where iPkGroupId=:grpid",['grpid' => $id])->fetch('assoc');
        $this->response('s',$query);
    }

    public function add(){

        $connection = ConnectionManager::get('default');
        error_reporting(0);
        if (!empty($this->request->data['grpName']))
            $vGroupName = $this->request->data['grpName'];

        if (!empty($this->request->data['grpDesc']))
            $vGroupDescription = $this->request->data['grpDesc'];

        if (!empty($this->request->data['vSliderImage']))
            $vSliderImage = $this->request->data['vSliderImage'];


        if(isset($this->request->data['vGroupImage']['name'])){

            $target_dir = WWW_ROOT . 'img/Group/';
            $target_file = $target_dir .basename($this->request->data['vGroupImage']['name']);
            $imageFileType = pathinfo($target_file,PATHINFO_EXTENSION);
            $current = strtotime("now");

            $image_name = $current .'.'. $imageFileType;
            $target_file = $target_dir .$image_name;

            if (move_uploaded_file($this->request->data["vGroupImage"]["tmp_name"], $target_file)) {

                $image_info = getimagesize($target_file);
                $image_width = $image_info[0];
                $image_height = $image_info[1];

                if ($image_width < 105 || $image_height < 104) {
                    $this->response('e');

                } else {

                    require_once(ROOT . DS . "src" . DS . "Controller" . DS . "resize-class.php");

                    $resizeObj = new resize($target_file);

                    $resizeObj->resizeImage(105, 104, 'crop');
                    $resizeObj->saveImage($target_file, 100);

                    $uploadOk = 1;
                    if (file_exists($target_dir . $this->request->data['vGroupImage'])) {
                        unlink($target_dir . $this->request->data['vGroupImage']);
                    }
                }
            } else {
                $image_name = 'default_user.png';
                $uploadOk = 0;
            }
        } else {
            $image_name = 'default_user.png';
            $uploadOk = 1;
        }
        if ($this->request->is(['post'])) {
            $connection = ConnectionManager::get('default');
            /*echo "call sp__group('insert','','$vGroupName','$vGroupDescription','$image_name','$imageFileType','0','active')";exit;*/
            $query = $connection->execute("INSERT INTO tbl_mst_groups(vGroupName,vGroupDescription,vGroupImage,eGroupStatus,tsGroupTime)
            VALUES('".$vGroupName."','".$vGroupDescription."','".$image_name."','active',now())");

/*            $query = $connection->execute("call sp_group('insert','','$vGroupName','$vGroupDescription','$image_name','0','active')");*/
            $this->response('s');
        }

    }
    
    public function edit($id){
        $connection = ConnectionManager::get('default');
        error_reporting(0);

            $vGroupName = $this->request->data['grpName'];

            $vGroupDescription = $this->request->data['grpDesc'];

            $vGroupImage = $this->request->data['vGroupImage'];


        if (isset($this->request->data['vGroupImage']['name']))
        {
            $target_dir = WWW_ROOT . 'img/Group/';
            $target_file = $target_dir . basename($this->request->data['vGroupImage']['name']);
            $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
            $current = strtotime("now");

            $image_name = $current . '.' . $imageFileType;
            $target_file = $target_dir . $image_name;


            if (move_uploaded_file($this->request->data["vGroupImage"]["tmp_name"], $target_file)) {

                $image_info = getimagesize($target_file);
                $image_width = $image_info[0];
                $image_height = $image_info[1];

                if ($image_width < 105 || $image_height < 104) {
                    $this->response('e');
                } else {

                    require_once(ROOT . DS . "src" . DS . "Controller" . DS . "resize-class.php");

                    $resizeObj = new resize($target_file);

                    $resizeObj->resizeImage(1600, 700, 'crop');
                    $resizeObj->saveImage($target_file, 100);

                    $uploadOk = 1;
                    if (file_exists($target_dir . $this->request->data['vSlideroldimage'])) {
                        unlink($target_dir . $this->request->data['vSlideroldimage']);
                    }
                }
            } else {
                $image_name = $vGroupImage;
                $uploadOk = 0;
            }
        } else
        {
            $image_name = $this->request->data['vGroupoldimage'];
            $uploadOk = 1;
        }

        if ($this->request->is(['post'])) {

            $connection = ConnectionManager::get('default');

            $query = $connection->execute("update tbl_mst_groups set 
                                                                vGroupName='$vGroupName',
                                                                vGroupDescription='$vGroupDescription',
                                                                vGroupImage='$image_name'
                                                                where iPkGroupId='".$id."'");

            $this->response('s',$query);
        }
    }

    public function changeStatus(){
        if(isset($this->request->data['statusId'])){
            $id = $this->request->data['statusId'];
            $userId = $this->request->data['aid'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            }else{
                $status = 'active';
            }
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $query = $connection->update('tbl_mst_groups', [
                    'eGroupStatus' => $status],['iPkGroupId' => $id]);
                $connection->commit();
                $this->response('s', '', 'Status change successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        }else{
            $this->response('f', '', 'Incomplete parameter');
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

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE `tbl_mst_groups` SET `eGroupStatus` = '".$status."' WHERE iPkGroupId IN (".implode(',',$ids).")")->execute();
                    $connection->commit();
                    $this->response('s');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function delete(){
        if (isset($this->request->data['deleteId'])) {
            $id = $this->request->data['deleteId'];
            $userId = $this->request->data['aid'];
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("DELETE FROM `tbl_mst_groups` WHERE iPkGroupId=".$id)->execute();
                    $connection->commit();
                    $this->response('s', '', 'Group deleted successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function deleteAll(){
        if(isset($this->request->data['deleteIds'])){
            $ids = $this->request->data['deleteIds'];
            $userId = $this->request->data['aid'];

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("DELETE FROM `tbl_mst_groups` WHERE iPkGroupId IN (".implode(',',$ids).")")->execute();
                    $connection->commit();
                    $this->response('s');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }
    public function front_getgroups(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  tbl_mst_groups WHERE eGroupStatus='active' ORDER BY iPkGroupId DESC ")->fetchAll('assoc');
        return $query;
    }
}
