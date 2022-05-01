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

class DocumentCategoryController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $type= $this->request->data['type'];
        if($type == 'faq' || $type == 'cover' || $type == 'summary' || $type == 'todo' || $type == 'document'){
            $records = $connection->execute("SELECT mdc.*,mf.vFolderName FROM  mst_doc_category AS mdc 
                                                   LEFT JOIN mst_folder as mf ON mf.iPkFolderId = mdc.iFKFolderId 
                                                   WHERE mdc.etype='".$type."' ORDER BY iPriority ASC , dtPriority DESC ")->fetchAll('assoc');

            foreach($records as $key=>$value){
                if($type == 'faq'){
                    $tablename = 'mst_faq';
                    $tablestatus = 'eFAQStatus';
                }else if($type == 'cover'){
                    $tablename = 'mst_cover_letter';
                    $tablestatus = 'eCoverLetterStatus';
                }else if($type == 'summary'){
                    $tablestatus = 'eSummaryStatus';
                    $tablename = 'mst_summary_of_criteria';
                }else if($type == 'todo'){
                    $tablename = 'mst_todo';
                    $tablestatus = 'eToDoStatus';
                }else if($type == 'document'){
                    $tablename = 'mst_documents';
                    $tablestatus = 'eDocStatus';
                }

                $cat = $connection->execute("SELECT * FROM $tablename WHERE iFkDocCatId='".$value['iPkDocCatId']."' AND $tablestatus != 'deleted'")->fetchAll('assoc');
                $assign = 'no';
                if(count($cat) >0){
                    $assign = 'yes';
                }
                $records[$key]['assign'] = $assign;
            }
        }
        $this->response('s',$records);
    }

    public function view($id){

        $type = '';
        $where = '';

        if (!empty($this->request->query['id']))
            $id = $this->request->query['id'];

        if($id == ''){
            $this->response('s','','Incomplete Parameter');
        }
        if(!empty($this->request->data['eType'])){
            $type = $this->request->data['eType'];
        }

        if(!empty($type)){
            $where = 'etype = "'.$type.'" AND';
        }

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  mst_doc_category where $where iPkDocCatId='".$id."'")->fetch('assoc');
        if($query){
            $this->response('s', $query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function add(){

        if (isset($this->request->data['catName'])) {
            $catName = $this->request->data['catName'];
            $catDesc = $this->request->data['catDesc'];
            $type= $this->request->data['type'];

            $iPkFolderId = null;
            if (!empty($this->request->data['iPkFolderId'])){
                $iPkFolderId = $this->request->data['iPkFolderId'];
            }

            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_doc_category WHERE eDocStatus != 'deleted' AND etype = '".$type."'")->fetch('assoc');
            
                $priority = $findmaxpriority['priority'] + 1;
//                $checkCatExist = $connection->execute("SELECT * FROM mst_doc_category WHERE  LOWER(vDocCat)=:catname AND etype=:cattype", ['catname' => strtolower($catName),'cattype' => $type])->fetchAll('assoc');
//                if (count($checkCatExist) == 0) {
                    $connection->begin();
                    try {
                        $connection->insert('mst_doc_category', [
                            'vDocCat' => $catName,
                            'vDocCatDesc' => $catDesc,
                            'iPriority' => $priority,
                            'iFKFolderId' => $iPkFolderId,
                            'eDocStatus' => 'active',
                            'etype'=>$type,
                            'dtDocCreatedDate' => Time::now(),
                            'dtPriority'=>Time::now()]);
                        $connection->commit();
                        $this->response('s', '', 'Category has been created');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
//                } else {
//                    $this->response('f', '', 'Category already exist');
//                }
            } else {
                $this->response('f', '', 'Invalid Method selection');
            }
        }
    }
    
    public function edit(){
        $catName = '';
        $catId = '';
        $type = '';

        if (!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if (!empty($this->request->data['catName']))
            $catName = $this->request->data['catName'];

        if (!empty($this->request->data['catDesc']))
            $catDesc = $this->request->data['catDesc'];

        if (!empty($this->request->data['type']))
            $type= $this->request->data['type'];

        $iPkFolderId = null;
        if (!empty($this->request->data['iPkFolderId'])){
            $iPkFolderId = $this->request->data['iPkFolderId'];
        }

        if($catId == '' || $catName == ''){
            $this->response('s','','Incomplete Parameter');
        }

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
//            $checkCatExist = $connection->execute("SELECT * FROM mst_doc_category WHERE  LOWER(vDocCat)=:catname AND iPkDocCatId!=:catid AND etype=:cattype", ['catname' => strtolower($catName),'catid' => $catId,'cattype' => $type])->fetchAll('assoc');
//            if (count($checkCatExist) == 0) {
                $connection->begin();
                try {
                    $connection->update('mst_doc_category', [
                        'vDocCat' => $catName,
                        'vDocCatDesc' => $catDesc,
                        'iFKFolderId' => $iPkFolderId,
                        'etype'=>$type,
                        'dtDocUpdatedDate' => Time::now()],['iPkDocCatId' => $catId]);

                    $connection->commit();
                    $this->response('s', '', 'Category has been updated');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
//            } else {
//                $this->response('f', '', 'Category name already exist');
//            }
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
                $query = $connection->update('mst_doc_category', [
                    'eDocStatus' => $status,
                    'dtDocUpdatedDate' => Time::now()],['iPkDocCatId' => $id]);
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
                    $connection->query("UPDATE `mst_doc_category` SET `eDocStatus` = '".$status."',`dtDocUpdatedDate` = now() WHERE iPkDocCatId IN (".implode(',',$ids).")")->execute();
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
                    $connection->query("DELETE FROM `mst_doc_category` WHERE iPkDocCatId=".$id)->execute();
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
                    $connection->query("DELETE FROM `mst_doc_category` WHERE iPkDocCatId IN (".implode(',',$ids).")")->execute();
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
        $query = $connection->execute("SELECT * FROM  mst_doc_category WHERE eDocStatus='active' ORDER BY iPkDocCatId DESC ")->fetchAll('assoc');
        return $query;
    }

    public function changePriority(){        
        
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $iPkDocCatId = $this->request->data['pid'];
        $iPriority = $this->request->data['prio'];
        $etype = $this->request->data['type'];
        $connection = ConnectionManager::get('default');
        if($iPkDocCatId != '' && $iPriority != ''){
            $query = $connection->update('mst_doc_category', [                            
                'iPriority'=>$iPriority,
                'dtPriority'=>Time::now()
            ], ['iPkDocCatId' => $iPkDocCatId,'etype'=>$etype]);
            $this->response('s', '', 'Priority Change');
        }else{
            $this->response('f', '', 'Somethig went wrong');
        }
    }

    public function createduplicate(){
        
        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];            
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            if ($this->request->is(['post'])) {
                $records = $connection->query("SELECT * FROM mst_doc_category WHERE iPkDocCatId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');                

                $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_doc_category;")->fetch('assoc');
                
                $priority = $findmaxpriority['priority'] + 1;
                foreach ($records as $key => $value) {

                    $iFKFolderId = $value['iFKFolderId'];
                    $vDocCat = $value['vDocCat'];
                    $vDocCatDesc = $value['vDocCatDesc'];
                    $etype = $value['etype'];
                    $eDocStatus = $value['eDocStatus'];
                    $dtDocCreatedDate = $value['dtDocCreatedDate'];

                    $connection->insert('mst_doc_category', [
                        'vDocCat' => $vDocCat,
                        'vDocCatDesc' => $vDocCatDesc,
                        'iPriority' => $priority,
                        'iFKFolderId' => $iFKFolderId,
                        'eDocStatus' => 'inactive',
                        'etype'=>$etype,
                        'dtDocCreatedDate' => Time::now(),
                        'dtPriority'=>Time::now()]);

                    $priority++;
                }
                $this->response('s', '', 'added successfully');
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }
}
