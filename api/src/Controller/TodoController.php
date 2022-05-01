<?php

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

class TodoController extends AppController
{
    /********** FORMASTER CALL PROCEDURE "sp_system_admin" **********************************/
    public function initialize() {
        $this->loadComponent('RequestHandler');
        $this->checkValidToken(); }


    public function index(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT mt.*,fd.vFolderName, mdc.vDocCat FROM  mst_todo as mt
                                             JOIN mst_doc_category as mdc ON mdc.iPkDocCatId = mt.iFkDocCatId
                                             LEFT JOIN mst_folder as fd ON fd.iPkFolderId = mt.iFkFolderId
                                             WHERE mt.eToDoStatus != 'deleted'
                                             ORDER BY iPriority ASC , dtPriority DESC")->fetchAll('assoc');
        $this->response('s', $query);
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
                $query = $connection->update('mst_todo', [
                    'eToDoStatus' => $status,
                    'dtToDoUpdatedOn' => Time::now()],['iPkToDoId' => $id]);
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

            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            }else{
                $status = 'active';
            }

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE `mst_todo` SET `eToDoStatus` = '".$status."',`dtToDoUpdatedOn` = now() WHERE iPkToDoId IN (".implode(',',$ids).")")->execute();
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
        if(isset($this->request->data['deleteId'])){
            $id = $this->request->data['deleteId'];
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $query = $connection->update('mst_todo', [
                    'eToDoStatus'=>'deleted',
                    'dtToDoUpdatedOn' => Time::now()],['iPkToDoId' => $id]);
                $connection->commit();
                $this->response('s', '', 'Deleted successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }


        }
    }

    public function deleteAll(){
        if(isset($this->request->data['deleteIds'])){
            $ids = $this->request->data['deleteIds'];

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE `mst_todo` SET `eToDoStatus` = 'deleted',`dtToDoUpdatedOn` = now() WHERE iPkToDoId IN (".implode(',',$ids).")")->execute();

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

    public function view($id)
    {
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select * from mst_todo where  iPkToDoId='".$id."'")->fetch('assoc');
        if($query){
            $this->response('s', $query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function add() {

        error_reporting(0);
        if (!empty($this->request->data['vtodo']))
            $vtodo = $this->request->data['vtodo'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if (!empty($this->request->data['iDocumentCategoryId']))
            $iDocumentCategoryId = $this->request->data['iDocumentCategoryId'];

        if ($this->request->is(['post'])) {
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');

            $checkCatExist = $connection->execute("SELECT * FROM mst_todo WHERE eToDoStatus!='deleted' and  LOWER(vToDo)=:catname", ['catname' => strtolower($vtodo)])->fetchAll('assoc');
            $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_todo;")->fetch('assoc');
            
            $priority = $findmaxpriority['priority'] + 1;
            
            if (count($checkCatExist) == 0) {

                $connection->begin();
                try {
                    $query = $connection->insert('mst_todo', [
                        'vToDo' => $vtodo,
                        'iPriority' => $priority,
                        'iFkFolderId'=>$iPkFolderId,
                        'iFkDocCatId'=>$iDocumentCategoryId,
                        'eToDoStatus' => 'active',
                        'dtToDoCreatedOn' => Time::now(),
                        'dtPriority'=>Time::now()]);
                    $connection->commit();
                    $this->response('s', '', 'added successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Title Name already exist');
            }
        }
    }
    public function edit()
    {

        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        error_reporting(0);

        if (!empty($this->request->data['vtodo']))
            $vtodo = $this->request->data['vtodo'];

        if (!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if (!empty($this->request->data['iDocumentCategoryId']))
            $iDocumentCategoryId = $this->request->data['iDocumentCategoryId'];

        if ($this->request->is(['post'])) {

            $connection = ConnectionManager::get('default');
            $checkCatExist = $connection->execute("SELECT * FROM mst_todo WHERE eToDoStatus!='deleted' and  LOWER(vToDo)=:catname AND iPkToDoId!=:catid", ['catname' => strtolower($vtodo),'catid' => $catId])->fetchAll('assoc');

            if (count($checkCatExist) == 0) {
            $connection->begin();
            try {
                $query = $connection->update('mst_todo', [
                    'vToDo' => $vtodo,
                    'iFkFolderId'=>$iPkFolderId,
                    'iFkDocCatId'=>$iDocumentCategoryId,
                    'dtToDoUpdatedOn' => Time::now()],['iPkToDoId' => $catId]);
                $connection->commit();
                $this->response('s', '', ' Updated successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
            }else {
                $this->response('f', '', 'Title Name already exist');
            }
        }
    }


    public function getToDo(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select iPkToDoId,vToDo,eToDoStatus from mst_todo where eToDoStatus='active'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function getSearchData()
    {
        $where  = '';
        if($this->request->data['iPkFolderId'] != ''){
            $where .= 'and mt.iFkFolderId = "'. $this->request->data['iPkFolderId'].'"';
        }

        if($this->request->data['iDocumentCategoryId'] != ''){
            $where .= 'and mt.iFkDocCatId = "'. $this->request->data['iDocumentCategoryId'].'"';
        }
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT mt.*,fd.vFolderName, mdc.vDocCat FROM  mst_todo as mt
                                             JOIN mst_doc_category as mdc ON mdc.iPkDocCatId = mt.iFkDocCatId
                                             LEFT JOIN mst_folder as fd ON fd.iPkFolderId = mt.iFkFolderId
                                             WHERE mt.eToDoStatus != 'deleted' $where
                                             ORDER BY iPriority ASC , dtPriority DESC")->fetchAll('assoc');


        $this->response('s', $query);
    }

    public function createduplicate(){
        
        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];            
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            if ($this->request->is(['post'])) {
                $records = $connection->query("SELECT * FROM mst_todo WHERE iPkToDoId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                
                $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_todo;")->fetch('assoc');
                
                $priority = $findmaxpriority['priority'] + 1;
                foreach ($records as $key => $value) {
                    
                    $iFkFolderId = $value['iFkFolderId'];
                    $iFkDocCatId = $value['iFkDocCatId'];
                    $vToDo = $value['vToDo'];
                    $eToDoStatus = $value['eToDoStatus'];           
                    $dtToDoCreatedOn = $value['dtToDoCreatedOn'];
                    $dtToDoUpdatedOn = $value['dtToDoUpdatedOn'];

                    $query = $connection->insert('mst_todo', ['iFkFolderId' => $iFkFolderId,
                        'iFkDocCatId' => $iFkDocCatId,
                        'vToDo' => $vToDo,
                        'iPriority' => $priority,
                        'eToDoStatus' => 'inactive',
                        'dtToDoCreatedOn' => $dtToDoCreatedOn,
                        'dtToDoUpdatedOn' => $dtToDoUpdatedOn,
                        'dtPriority'=>Time::now()]);

                    $priority++;
                }
                $this->response('s', '', 'added successfully');
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function bulkallocation(){        
        $fid = $this->request->data['fid'];
        $cid = $this->request->data['cid'];
        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];            
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            if ($this->request->is(['post'])) {
                $records = $connection->query("SELECT * FROM mst_todo WHERE iPkToDoId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                foreach ($records as $key => $value) {
                    $iPkToDoId = $value['iPkToDoId'];
                    $iFkFolderId = $value['iFkFolderId'];
                    $iFkDocCatId = $value['iFkDocCatId'];                    

                    $query = $connection->update('mst_todo', [                            
                        'iFkFolderId'=>$fid,
                        'iFkDocCatId'=>$cid
                    ], ['iPkToDoId' => $iPkToDoId]);
                }
                $this->response('s', '', 'added successfully');
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function changePriority(){
        
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $iPkToDoId = $this->request->data['pid'];
        $iPriority = $this->request->data['prio'];
        $connection = ConnectionManager::get('default');
        if($iPkToDoId != '' && $iPriority != ''){
            $query = $connection->update('mst_todo', [                            
                'iPriority'=>$iPriority,
                'dtPriority'=>Time::now()
            ], ['iPkToDoId' => $iPkToDoId]);
            $this->response('s', '', 'TODO Priority Change');
        }else{
            $this->response('f', '', 'Somethig went wrong');
        }
    }
}

?>