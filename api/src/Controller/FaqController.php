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

class FaqController extends AppController
{
    /********** FORMASTER CALL PROCEDURE "sp_system_admin" **********************************/
    public function initialize() {
        $this->loadComponent('RequestHandler');
        $this->checkValidToken(); }


    public function index(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT mf.*,fd.vFolderName FROM  mst_faq as mf
                                             LEFT JOIN mst_folder as fd ON fd.iPkFolderId = mf.iFkFolderId
                                             WHERE mf.eFAQStatus != 'deleted'
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
                $query = $connection->update('mst_faq', [
                    'eFAQStatus' => $status,
                    'dtFAQUpdatedOn' => Time::now()],['iPkFAQId' => $id]);
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
                    $connection->query("UPDATE `mst_faq` SET `eFAQStatus` = '".$status."',`dtFAQUpdatedOn` = now() WHERE iPkFAQId IN (".implode(',',$ids).")")->execute();
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
                $query = $connection->update('mst_faq', [
                    'eFAQStatus'=>'deleted',
                    'dtFAQUpdatedOn' => Time::now()],['iPkFAQId' => $id]);
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
                    $connection->query("UPDATE `mst_faq` SET `eFAQStatus` = 'deleted',`dtFAQUpdatedOn` = now() WHERE iPkFAQId IN (".implode(',',$ids).")")->execute();
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
        $query = $connection->execute("select * from mst_faq where  iPkFAQId='".$id."'")->fetch('assoc');
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
        if (!empty($this->request->data['vSliderTitle']))
            $vSliderTitle = $this->request->data['vSliderTitle'];

        if (!empty($this->request->data['vSliderDescription']))
            $vSliderDescription = $this->request->data['vSliderDescription'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if ($this->request->is(['post'])) {
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');

            $checkCatExist = $connection->execute("SELECT * FROM mst_faq WHERE eFAQStatus!='deleted' and LOWER(vFAQ)=:catname", ['catname' => strtolower($vSliderTitle)])->fetchAll('assoc');
            $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_faq WHERE eFAQStatus != 'deleted'")->fetch('assoc');
            
            $priority = $findmaxpriority['priority'] + 1;
            if (count($checkCatExist) == 0) {

                $connection->begin();
                try {
                    $query = $connection->insert('mst_faq', [
                        'vFAQ' => $vSliderTitle,
                        'vFAQAnswer' => $vSliderDescription,
                        'iPriority' => $priority,
                        'eFAQStatus' => 'active',
                        'iFkFolderId' => $iPkFolderId,
                        'dtFAQCreatedOn' => Time::now(),
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

        if (!empty($this->request->data['vSliderTitle']))
            $vSliderTitle = $this->request->data['vSliderTitle'];

        if (!empty($this->request->data['vSliderDescription']))
            $vSliderDescription = $this->request->data['vSliderDescription'];

        if (!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];


        if ($this->request->is(['post'])) {

            $connection = ConnectionManager::get('default');
            $checkCatExist = $connection->execute("SELECT * FROM mst_faq WHERE eFAQStatus!='deleted' and vFAQ = '".$vSliderTitle."' AND iPkFAQId!=$catId")->fetchAll('assoc');
            //echo "SELECT * FROM mst_faq WHERE eFAQStatus!='deleted' and vFAQ = '".$vSliderTitle."' AND iPkFAQId!=$catId"; exit;
            if (count($checkCatExist) == 0) {
                $connection->begin();
                try {
                    $query = $connection->update('mst_faq', [
                        'vFAQ' => $vSliderTitle,
                        'vFAQAnswer' => $vSliderDescription,
                        'iFkFolderId' => $iPkFolderId,
                        'dtFAQUpdatedOn' => Time::now()],['iPkFAQId' => $catId]);
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
    public function getFaq(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select iPkFAQId,vFAQ,eFAQStatus from mst_faq where eFAQStatus='active'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function createduplicate(){
        
        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];            
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            if ($this->request->is(['post'])) {
                $records = $connection->query("SELECT * FROM mst_faq WHERE iPkFAQId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                //echo "<pre>"; print_r($records); exit;
                $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_faq WHERE eFAQStatus != 'deleted'")->fetch('assoc');
                
                $priority = $findmaxpriority['priority'] + 1;
                
                foreach ($records as $key => $value) {

                    $iFkFolderId = $value['iFkFolderId'];
                    $vFAQ = $value['vFAQ'];
                    $vFAQAnswer = $value['vFAQAnswer'];
                    $eFAQStatus = $value['eFAQStatus'];                               
                    $dtFAQCreatedOn = $value['dtFAQCreatedOn'];
                    $dtFAQUpdatedOn = $value['dtFAQUpdatedOn'];

                    $query = $connection->insert('mst_faq', ['iFkFolderId' => $iFkFolderId,
                        'vFAQ' => $vFAQ,
                        'vFAQAnswer' => $vFAQAnswer,
                        'eFAQStatus' => 'inactive',
                        'iPriority' => $priority,
                        'dtFAQCreatedOn' => $dtFAQCreatedOn,
                        'dtFAQUpdatedOn' => $dtFAQUpdatedOn,
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
        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];            
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            if ($this->request->is(['post'])) {
                $records = $connection->query("SELECT * FROM mst_faq WHERE iPkFAQId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                foreach ($records as $key => $value) {
                    $iPkFAQId = $value['iPkFAQId'];
                    $iFkFolderId = $value['iFkFolderId'];                                       

                    $query = $connection->update('mst_faq', [                            
                        'iFkFolderId'=>$fid,                        
                    ], ['iPkFAQId' => $iPkFAQId]);
                }
                $this->response('s', '', 'added successfully');
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function changePriority(){
        
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $iPkFAQId = $this->request->data['pid'];
        $iPriority = $this->request->data['prio'];
        $connection = ConnectionManager::get('default');
        if($iPkFAQId != '' && $iPriority != ''){
            $query = $connection->update('mst_faq', [                            
                'iPriority'=>$iPriority,
                'dtPriority'=>Time::now()
            ], ['iPkFAQId' => $iPkFAQId]);
            $this->response('s', '', 'FAQ Priority Change');
        }else{
            $this->response('f', '', 'Somethig went wrong');
        }
    }
}

?>