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

class CategoryController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT mvc.*,mvcj.vVisaCat as parentCategory
        FROM  mst_visa_category as mvc
        LEFT JOIN mst_visa_category as mvcj on mvcj.iPkVisaCatId=mvc.iParentVisaCatId
        ORDER BY mvc.iPkVisaCatId DESC ")->fetchAll('assoc');

        foreach($query as $key=>$value){
            $visacatid = $value['iPkVisaCatId'];
            $assign = 'no';
            $product = $connection ->execute("SELECT * FROM mst_visa_product WHERE iFkVisaCatId = $visacatid")->fetchall('assoc');

            if(count($product)>0){
                $assign = 'yes';
            }
            $query[$key]['assign'] = $assign;
        }
        $this->response('s',$query);
    }

    public function view($id){

        if($id == ''){
            $this->response('s','','Incomplete Parameter');
        }
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  mst_visa_category where iPkVisaCatId=:catid",['catid' => $id])->fetch('assoc');
        if($query){
            $this->response('s', $query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function getSelectedCategoryName(){
        error_reporting(0);
        if (!empty($this->request->data['fk_parent_cat_id']))
            $fk_parent_cat_id= $this->request->data['fk_parent_cat_id'];

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT vVisaCat,iPkVisaCatId FROM  mst_visa_category where iPkVisaCatId='".$fk_parent_cat_id."'")->fetch('assoc');
        $this->response('s',$query);
    }

    public function add(){
        error_reporting(0);
        if (isset($this->request->data['catName'])) {
            $catName = $this->request->data['catName'];
            $catDesc = $this->request->data['catDesc'];
            $fk_parent_cat_id = $this->request->data['fk_parent_cat_id'];


            $userId = $this->request->data['aid'];
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $checkCatExist = $connection->execute("SELECT * FROM mst_visa_category WHERE  LOWER(vVisaCat)=:catname", ['catname' => strtolower($catName)])->fetchAll('assoc');
                if (count($checkCatExist) == 0) {
                    $connection->begin();
                    if(isset($fk_parent_cat_id)){
                        $fk_parent_cat_id=$this->request->data['fk_parent_cat_id'];
                    }else{
                        $fk_parent_cat_id='0';
                    }
                    try {
                        $query = $connection->insert('mst_visa_category', [
                            'vVisaCat' => $catName,
                            'vVisaCatDesc' => $catDesc,
                            'iParentVisaCatId'=>$fk_parent_cat_id,
                            'eVisaCatStatus' => 'active',
                            'dtVisaCatCreatedOn' => Time::now()]);
                        $connection->commit();
                        $this->response('s', '', 'Category added successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                } else {
                    $this->response('f', '', 'Category Name already exist');
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
        }
    }
    
    public function edit(){

        error_reporting(0);
        $catName = '';
        $catId = '';

        if (!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if (!empty($this->request->data['catName']))
            $catName = $this->request->data['catName'];


        if (!empty($this->request->data['catDesc']))
            $catDesc = $this->request->data['catDesc'];

        $fk_parent_cat_id = $this->request->data['fk_parent_cat_id'];

        if($catId == '' || $catName == '' || $catDesc==''){
            $this->response('s','','Incomplete Parameter');
        }
        $userId = $this->request->data['aid'];

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $checkCatExist = $connection->execute("SELECT * FROM mst_visa_category WHERE  LOWER(vVisaCat)=:catname AND iPkVisaCatId!=:catid", ['catname' => strtolower($catName),'catid' => $catId])->fetchAll('assoc');
            if (count($checkCatExist) == 0) {
                $connection->begin();
                if(isset($fk_parent_cat_id)){
                    $fk_parent_cat_id=$this->request->data['fk_parent_cat_id'];
                }else{
                    $fk_parent_cat_id='0';
                }
                try {
                    $query = $connection->update('mst_visa_category', [
                        'vVisaCat' => $catName,
                        'vVisaCatDesc' => $catDesc,
                        'iParentVisaCatId'=>$fk_parent_cat_id,
                        'dtVisaCatUpdatedOn' => Time::now()],['iPkVisaCatId' => $catId]);
                    $connection->commit();
                    $this->response('s', '', 'Category updated successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Category Name already exist');
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
                $query = $connection->update('mst_visa_category', [
                    'eVisaCatStatus' => $status,
                    'dtVisaCatUpdatedOn' => Time::now()],['iPkVisaCatId' => $id]);
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
                    $connection->query("UPDATE `mst_visa_category` SET `eVisaCatStatus` = '".$status."',`dtVisaCatUpdatedOn` = now() WHERE iPkVisaCatId IN (".implode(',',$ids).")")->execute();
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
                    $connection->query("DELETE FROM `mst_visa_category` WHERE iPkVisaCatId=".$id)->execute();
                    $connection->commit();
                    $this->response('s', '', 'Category deleted successfully');
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
                    $connection->query("DELETE FROM `mst_visa_category` WHERE iPkVisaCatId IN (".implode(',',$ids).")")->execute();
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
        $query = $connection->execute("SELECT * FROM  mst_visa_category WHERE eVisaCatStatus='active' ORDER BY iPkVisaCatId DESC ")->fetchAll('assoc');
        return $query;
    }

    public function getParentCategory()
    {
        $connection = ConnectionManager::get('default');
        if(isset($this->request->data['cat_id'])){
            $cat_id = $this->request->data['cat_id'];
            $result = $connection->execute("SELECT * FROM mst_visa_category WHERE iPkVisaCatId != ".$cat_id." AND iParentVisaCatId != ".$cat_id)->fetchAll('assoc');
        }else{
            $result = $connection->execute("SELECT * FROM mst_visa_category")->fetchAll('assoc');
        }

        $category = array(
            'categories' => array(),
            'parent_cats' => array()
        );

        foreach($result as $row){
            $category['categories'][$row['iPkVisaCatId']] = $row;
            $category['parent_cats'][$row['iParentVisaCatId']][] = $row['iPkVisaCatId'];
        }

        $this->response('s',$this->buildCategory(0, $category));
    }

   public function buildCategory($parent, $category)
   {
        $data=array();
        if (isset($category['parent_cats'][$parent]))
        {
            foreach ($category['parent_cats'][$parent] as $cat_id) {
                if (!isset($category['parent_cats'][$cat_id])) {
                    $data[] = array('id'=>"".$category['categories'][$cat_id]['iPkVisaCatId']."",'name' => $category['categories'][$cat_id]['vVisaCat']);
                }
                if (isset($category['parent_cats'][$cat_id])) {
                    $data[] = array('id' => "".$category['categories'][$cat_id]['iPkVisaCatId']."",'name' => $category['categories'][$cat_id]['vVisaCat'], 'children' => $this->buildCategory($cat_id, $category));
                }
            }
        }
        return $data;
    }
}
