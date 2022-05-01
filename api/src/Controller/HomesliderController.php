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

class HomesliderController extends AppController
{
    /********** FORMASTER CALL PROCEDURE "sp_system_admin" **********************************/
    public function initialize() {
        $this->loadComponent('RequestHandler');
        $this->checkValidToken(); }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT msc.*,fd.vFolderName, mdc.vDocCat FROM  mst_summary_of_criteria as msc
                                             JOIN mst_doc_category as mdc ON mdc.iPkDocCatId = msc.iFkDocCatId
                                             LEFT JOIN mst_folder as fd ON fd.iPkFolderId = msc.iFkFolderId
                                             WHERE msc.eSummaryStatus != 'deleted'
                                             ORDER BY iPriority ASC , dtPriority DESC")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function getSearchData()
    {
        $where  = '';
        if($this->request->data['iPkFolderId'] != ''){
            $where .= 'and msc.iFkFolderId = "'. $this->request->data['iPkFolderId'].'"';
        }

        if($this->request->data['iDocumentCategoryId'] != ''){
            $where .= 'and msc.iFkDocCatId = "'. $this->request->data['iDocumentCategoryId'].'"';
        }
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT msc.*,fd.vFolderName, mdc.vDocCat FROM  mst_summary_of_criteria as msc
                                             JOIN mst_doc_category as mdc ON mdc.iPkDocCatId = msc.iFkDocCatId
                                             LEFT JOIN mst_folder as fd ON fd.iPkFolderId = msc.iFkFolderId
                                             WHERE msc.eSummaryStatus!='deleted' $where
                                             ORDER BY iPriority ASC , dtPriority DESC")->fetchAll('assoc');

        $this->response('s', $query);
    }

    public function getFolderData()
    {
        $ipkfolder = '';
        $type = '';

        if(!empty($this->request->data['iPkFolderId'])){
            $ipkfolder = $this->request->data['iPkFolderId'];
        }

        if(!empty($this->request->data['type'])){
            $type = $this->request->data['type'];
        }

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT mdc.*,mf.vFolderName FROM  mst_doc_category AS mdc 
                                             LEFT JOIN mst_folder as mf ON mf.iPkFolderId = mdc.iFKFolderId 
                                             WHERE mdc.etype='".$type."' AND iFKFolderId= '".$ipkfolder."' ORDER BY iPriority ASC , dtPriority DESC ")->fetchAll('assoc');

        foreach($query as $key=>$value){

            if($type == 'faq'){
                $tablename = 'mst_faq';
            }else if($type == 'cover'){
                $tablename = 'mst_cover_letter';
            }else if($type == 'summary'){
                $tablename = 'mst_summary_of_criteria';
            }else if($type == 'todo'){
                $tablename = 'mst_todo';
            }else if($type == 'document'){
                $tablename = 'mst_documents';
            }

            $cat = $connection->execute("SELECT * FROM $tablename WHERE iFkDocCatId='".$value['iPkDocCatId']."'")->fetchAll('assoc');
            $assign = 'no';
            if(count($cat) >0){
                $assign = 'yes';
            }
            $query[$key]['assign'] = $assign;
        }
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
                $query = $connection->update('mst_summary_of_criteria', [
                    'eSummaryStatus' => $status,
                    'dtSummaryUpdatedDate' => Time::now()],['iPkSummaryId' => $id]);
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

    public function delete(){
        if(isset($this->request->data['deleteId'])){
            $id = $this->request->data['deleteId'];
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $query = $connection->update('mst_summary_of_criteria', [
                    'eSummaryStatus'=>'deleted',
                    'dtSummaryUpdatedDate' => Time::now()],['iPkSummaryId' => $id]);
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
                    $connection->query("UPDATE `mst_summary_of_criteria` SET `eSummaryStatus` = 'deleted',`dtSummaryUpdatedDate` = now() WHERE iPkSummaryId IN (".implode(',',$ids).")")->execute();

                 //  $connection->query("DELETE FROM `mst_summary_of_criteria` WHERE iPkSummaryId IN (".implode(',',$ids).")")->execute();
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
        $query = $connection->execute("select * from mst_summary_of_criteria where iPkSummaryId='".$id."'")->fetch('assoc');

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

        if (!empty($this->request->data['iDocumentCategoryId']))
            $iDocumentCategoryId = $this->request->data['iDocumentCategoryId'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if ($this->request->is(['post'])) {
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');

//            $checkCatExist = $connection->execute("SELECT * FROM mst_summary_of_criteria WHERE vSummaryTitle= '".$vSliderTitle."' AND eSummaryStatus != 'deleted'")->fetchAll('assoc');
//
//            if (count($checkCatExist) == 0) {
            $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_summary_of_criteria WHERE eSummaryStatus != 'deleted'")->fetch('assoc');
            
            $priority = $findmaxpriority['priority'] + 1;
                 $connection->begin();
                try {
                    $query = $connection->insert('mst_summary_of_criteria', [

                        'vSummaryTitle' => $vSliderTitle,
                        'vSummaryDescription' => $vSliderDescription,
                        'iPriority' => $priority,
                        'iFkDocCatId'=>$iDocumentCategoryId,
                        'iFkFolderId'=>$iPkFolderId,
                        'eSummaryStatus' => 'active',
                        'dtSummaryCreatedDate' => Time::now(),
                        'dtPriority'=>Time::now()]);
                    $connection->commit();
                    $this->response('s', '', 'added successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
//            } else {
//                $this->response('f', '', 'Summary Title Name already exist');
//            }
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


        if (!empty($this->request->data['iDocumentCategoryId']))
            $iDocumentCategoryId = $this->request->data['iDocumentCategoryId'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if (!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if ($this->request->is(['post'])) {

            $connection = ConnectionManager::get('default');
//            $checkCatExist = $connection->execute("SELECT * FROM mst_summary_of_criteria WHERE  LOWER(vSummaryTitle)=:catname AND eSummaryStatus != 'deleted' AND iPkSummaryId!=:catid", ['catname' => strtolower($vSliderTitle),'catid' => $catId])->fetchAll('assoc');
//
//            if (count($checkCatExist) == 0) {
            $connection->begin();
            try {
                $query = $connection->update('mst_summary_of_criteria', [
                    'iFkDocCatId'=>$iDocumentCategoryId,
                    'vSummaryTitle' => $vSliderTitle,
                    'iFkFolderId'=>$iPkFolderId,
                    'vSummaryDescription' => $vSliderDescription,
                    'dtSummaryUpdatedDate' => Time::now()],['iPkSummaryId' => $catId]);
                $connection->commit();
                $this->response('s', '', ' Updated successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
//            }else {
//                $this->response('f', '', 'Summary Title Name already exist');
//            }
        }
    }

    public function getSummary(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select iPkSummaryId,vSummaryTitle,eSummaryStatus from mst_summary_of_criteria where eSummaryStatus='active'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function getSummaryCategory(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT iPkDocCatId,vDocCat FROM mst_doc_category WHERE etype ='summary' && eDocStatus ='active'")->fetchAll('assoc');
        $this->response('s', $query);
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
                    $connection->query("UPDATE `mst_summary_of_criteria` SET `eSummaryStatus` = '".$status."',`dtSummaryUpdatedDate` = now() WHERE iPkSummaryId IN (".implode(',',$ids).")")->execute();
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

    public function createduplicate(){

        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];

            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            if ($this->request->is(['post'])) {
                $records = $connection->query("SELECT * FROM mst_summary_of_criteria WHERE iPkSummaryId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_summary_of_criteria WHERE eSummaryStatus != 'deleted'")->fetch('assoc');
                
                $priority = $findmaxpriority['priority'] + 1;
                foreach ($records as $key => $value) {

                    $doc_id = $value['iFkDocCatId'];
                    $folder_id = $value['iFkFolderId'];
                    $summary_title = $value['vSummaryTitle'];
                    $summary_desc = $value['vSummaryDescription'];

                    $query = $connection->insert('mst_summary_of_criteria', ['vSummaryTitle' => $summary_title,
                        'vSummaryDescription' => $summary_desc,
                        'iFkDocCatId' => $doc_id,
                        'iPriority' => $priority,
                        'iFkFolderId' => $folder_id,
                        'eSummaryStatus' => 'inactive',
                        'dtSummaryCreatedDate' => Time::now(),
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
                $records = $connection->query("SELECT * FROM mst_summary_of_criteria WHERE iPkSummaryId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                foreach ($records as $key => $value) {
                    $iPkSummaryId = $value['iPkSummaryId'];
                    $iFkFolderId = $value['iFkFolderId'];
                    $iFkDocCatId = $value['iFkDocCatId'];                    

                    $query = $connection->update('mst_summary_of_criteria', [                            
                        'iFkFolderId'=>$fid,
                        'iFkDocCatId'=>$cid
                    ], ['iPkSummaryId' => $iPkSummaryId]);
                }
                $this->response('s', '', 'added successfully');
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function changePriority(){
        
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $iPkSummaryId = $this->request->data['pid'];
        $iPriority = $this->request->data['prio'];
        $connection = ConnectionManager::get('default');
        if($iPkSummaryId != '' && $iPriority != ''){
            $query = $connection->update('mst_summary_of_criteria', [                            
                'iPriority'=>$iPriority,
                'dtPriority'=>Time::now()
            ], ['iPkSummaryId' => $iPkSummaryId]);
            $this->response('s', '', 'SOC Priority Change');
        }else{
            $this->response('f', '', 'Somethig went wrong');
        }
    }
}

?>