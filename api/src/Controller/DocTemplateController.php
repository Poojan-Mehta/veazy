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
use Cake\Validation\Validator;


class DocTemplateController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  mst_doc_template ORDER BY iPkDocTemplateId DESC ")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function view(){
        $id = '';

        if (!empty($this->request->query['id']))
            $id = $this->request->query['id'];

        if($id == ''){
            $this->response('s','','Incomplete Parameter');
        }
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  mst_doc_template where iPkDocTemplateId=:catid",['catid' => $id])->fetch('assoc');
        $this->response('s',$query);
    }

    public function add(){
        $catName = '';
        $catDesc = '';
        $price = '';

        if(isset($this->request->data['catName'])){
            $catName = $this->request->data['catName'];
        }

        if(isset($this->request->data['catDesc'])){
            $catDesc = $this->request->data['catDesc'];
        }

        if(isset($this->request->data['price'])){
            $price = $this->request->data['price'];
        }

        if($catName == ''){
            $this->response('f', '', 'Template name is required field');
        }

        if($catDesc == ''){
            $this->response('f', '', 'Description is required field');
        }

        if($price == ''){
            $this->response('f', '', 'Price is required field');
        }

        if ($this->request->is(['post'])) {
            // Check file size
            if ($this->request->data["Filename"]["size"] > 500000) {
                $this->response('f', '', 'Sorry, your file is too large.');
            }
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');

            $target_dir = WWW_ROOT . 'doctemplates/';
            $checkCatExist = $connection->execute("SELECT * FROM mst_doc_template WHERE  LOWER(vDocTemplate)=:catname", ['catname' => strtolower($catName)])->fetchAll('assoc');
            if (count($checkCatExist) == 0) {
                $connection->begin();
                if(!empty($this->request->data['Filename']['name'])){
                    try {
                        $target_file = $target_dir . basename($this->request->data['Filename']['name']);
                        $current = strtotime("now");
                        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                        $arr_ext = array('jpg', 'jpeg', 'gif', 'png', 'pdf','doc', 'docx');
                        if(in_array(strtolower($imageFileType), $arr_ext))
                        {
                            $image_name = pathinfo($this->request->data['Filename']['name'], PATHINFO_FILENAME).'_'.$current . '.' . $imageFileType;
                            $target_file = $target_dir . $image_name;

                            if(move_uploaded_file($this->request->data['Filename']["tmp_name"], $target_file)){
                                $connection->insert('mst_doc_template', [
                                    'vDocTemplate' => $catName,
                                    'vDocTemplateDesc' => $catDesc,
                                    'dDocTemplatePrice'=>$price,
                                    'vDocTemplateFile'=>$image_name,
                                    'eDocTemplateStatus' => 'active',
                                    'dtDocTemplateCreatedOn' => Time::now()]);
                                $connection->commit();
                                $this->response('s', '', 'Template has been uploaded and inserted successfully.');
                            }else{
                                $this->response('f', '', 'Unable to upload file, please try again.');
                            }
                        }else{
                            $this->response('f', '', 'Invalid file selection');
                        }
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                }else{
                    $this->response('f', '', 'Please choose a file to upload.');
                }

            } else {
                $this->response('f', '', 'Template name already exist');
            }
        } else {
            $this->response('f', '', 'Unprocessable entity');
        }
    }
    
    public function edit(){


        $catName = '';
        $catId = '';
        error_reporting(0);
        if (!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if (!empty($this->request->data['catName']))
            $catName = $this->request->data['catName'];


        if (!empty($this->request->data['catDesc']))
            $catDesc = $this->request->data['catDesc'];

        if (!empty($this->request->data['price']))
            $price = $this->request->data['price'];


        if($catId == '' || $catName == '' || $catDesc=='' || $price==''){
            $this->response('f','','Incomplete Parameter');
        }
        $userId = $this->request->data['aid'];

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');


            $checkCatExist = $connection->execute("SELECT * FROM mst_doc_template WHERE  LOWER(vDocTemplate)=:catname AND iPkDocTemplateId!=:catid", ['catname' => strtolower($catName),'catid' => $catId])->fetchAll('assoc');
            if (count($checkCatExist) == 0) {
                $connection->begin();
                try {

                    if(isset($this->request->data['Filename']['name'])){
                        $target_dir = WWW_ROOT . 'doctemplates/';
                        $target_file = $target_dir . basename($this->request->data['Filename']['name']);
                        $type= $target_dir . basename($this->request->data['Filename']['type']);
                        $current = strtotime("now");

                        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                        $image_name = pathinfo($this->request->data['Filename']['name'], PATHINFO_FILENAME).'_'.$current . '.' . $imageFileType;
                        $target_file = $target_dir . $image_name;
                        move_uploaded_file($this->request->data['Filename']["tmp_name"], $target_file);
                    }else{
                        $image_name = $this->request->data['Filename'];
                    }
                    $query = $connection->update('mst_doc_template', [
                        'vDocTemplate' => $catName,
                        'vDocTemplateDesc' => $catDesc,
                        'dDocTemplatePrice'=>$price,
                        'vDocTemplateFile'=> $image_name,
                        'dtDocTemplateUpdatedOn' => Time::now()],['iPkDocTemplateId' => $catId]);
                    $connection->commit();
                    $this->response('s', '', 'Template updated successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Template Name already exist');
            }
        } else {
            $this->response('f', '', 'Invalid method');
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
                $query = $connection->update('mst_doc_template', [
                    'eDocTemplateStatus' => $status,
                    'dtDocTemplateUpdatedOn' => Time::now()],['iPkDocTemplateId' => $id]);
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
                    $connection->query("UPDATE `mst_doc_template` SET `eDocTemplateStatus` = '".$status."',`dtDocTemplateUpdatedOn` = now() WHERE iPkDocTemplateId IN (".implode(',',$ids).")")->execute();
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
            $connection = ConnectionManager::get('default');
            $file = $connection->execute("SELECT vDocTemplateFile FROM  mst_doc_template WHERE iPkDocTemplateId = $id")->fetch('assoc');
            if($file)
            {
                $filepath = WWW_ROOT . 'doctemplates/'.$file['vDocTemplateFile'];
                if (file_exists($filepath)){
                    unlink($filepath);
                }
            }
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("DELETE FROM `mst_doc_template` WHERE iPkDocTemplateId=".$id)->execute();
                    $connection->commit();
                    $this->response('s', '', 'Template deleted successfully');
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
            $connection = ConnectionManager::get('default');
            foreach($ids as $valueid){

                $file = $connection->execute("SELECT vDocTemplateFile FROM  mst_doc_template WHERE iPkDocTemplateId = $valueid")->fetch('assoc');
                if($file['vDocTemplateFile'])
                {
                    $filepath = WWW_ROOT . 'doctemplates/'.$file['vDocTemplateFile'];
                    if (file_exists($filepath)){
                        unlink($filepath);
                    }
                }
            }
            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("DELETE FROM `mst_doc_template` WHERE iPkDocTemplateId IN (".implode(',',$ids).")")->execute();
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
    public function front_getcategory(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  mst_doc_template WHERE eDocTemplateStatus='active' ORDER BY iPkDocTemplateId DESC ")->fetchAll('assoc');
        return $query;
    }
}
