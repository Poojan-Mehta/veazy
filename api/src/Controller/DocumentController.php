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

class DocumentController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT md.*,mf.vFolderName,mdc.vDocCat
                                            FROM  mst_documents as md
                                            JOIN mst_doc_category as mdc ON mdc.iPkDocCatId = md.iFkDocCatId
                                            LEFT JOIN mst_folder as mf ON mf.iPkFolderId = md.iFkFolderId
                                            WHERE md.eDocStatus != 'deleted'
                                            ORDER BY iPriority ASC , dtPriority DESC")->fetchAll('assoc');

        $this->response('s',$query);
    }

    public function view($id){
        $connection = ConnectionManager::get('default');

        $query = $connection->execute("SELECT * FROM  mst_documents where iPkDocId=:catid",['catid' => $id])->fetch('assoc');
        if($query){
            $this->response('s', $query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function add(){

        if (isset($this->request->data['DocumentName'])) {
            $DocumentName = $this->request->data['DocumentName'];
            $documentSuggestion = $this->request->data['documentSuggestion'];
            $DocumentGuide = $this->request->data['DocumentGuide'];
            $iDocumentCategoryId= $this->request->data['iDocumentCategoryId'];
            $iPkFolderId = $this->request->data['iPkFolderId'];

            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
//                $checkCatExist = $connection->execute("SELECT * FROM mst_documents WHERE  LOWER(vDocName)=:catname", ['catname' => strtolower($DocumentName)])->fetchAll('assoc');
//                if (count($checkCatExist) == 0) {
                    $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_documents;")->fetch('assoc');
                            
                    $priority = $findmaxpriority['priority'] + 1;         
                    $connection->begin();
                    try {
                        $statement = $connection->insert('mst_documents', [
                            'vDocName' => $DocumentName,
                            'iFkFolderId'=>$iPkFolderId,
                            'iPriority' => $priority,
                            'vDocSuggestion' => $documentSuggestion,
                            'vDocGuide' => $DocumentGuide,
                            'iFkDocCatId' => $iDocumentCategoryId,
                            'eDocStatus' => 'active',
                            'dtPriority'=>Time::now(),
                            'dtDocCreatedOn' => Time::now()]);
                        $lastID =  $statement->lastInsertId('mst_documents');
                        $connection->commit();
                        $this->response('s', array('iPkDocId' => $lastID), 'Document has been created');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
//                } else {
//                    $this->response('f', '', 'Document Name already exist');
//                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
        }
    }
    
    public function edit(){
        $catId = '';
        $DocumentName = '';
        $documentSuggestion = '';
        $DocumentGuide = '';
        $iDocumentCategoryId = '';
        $iPkFolderId = '';

        if (!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if (!empty($this->request->data['DocumentName']))
            $DocumentName = $this->request->data['DocumentName'];

        if (!empty($this->request->data['documentSuggestion']))
            $documentSuggestion = $this->request->data['documentSuggestion'];

        if (!empty($this->request->data['DocumentGuide']))
            $DocumentGuide = $this->request->data['DocumentGuide'];

        if (!empty($this->request->data['iDocumentCategoryId']))
            $iDocumentCategoryId = $this->request->data['iDocumentCategoryId'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
//            $checkCatExist = $connection->execute("SELECT * FROM mst_documents WHERE  LOWER(vDocName)=:catname AND iPkDocId!=:catid", ['catname' => strtolower($DocumentName),'catid' => $catId])->fetchAll('assoc');
//            if (count($checkCatExist) == 0) {
                $connection->begin();
                try {
                    $connection->update('mst_documents', [
                        'vDocName' => $DocumentName,
                        'vDocSuggestion' => $documentSuggestion,
                        'vDocGuide' => $DocumentGuide,
                        'iFkDocCatId' => $iDocumentCategoryId,
                        'iFkFolderId'=>$iPkFolderId,
                        'dtDocUpdatedOn' => Time::now()],['iPkDocId' => $catId]);
                    $connection->commit();
                    $this->response('s', '', 'Document has been updated');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
//            } else {
//                $this->response('f', '', 'Document Name already exist');
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
                $query = $connection->update('mst_documents', [
                    'eDocStatus' => $status,
                    'dtDocUpdatedOn' => Time::now()],['iPkDocId' => $id]);
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
                    $connection->query("UPDATE `mst_documents` SET `eDocStatus` = '".$status."',`dtDocUpdatedOn` = now() WHERE iPkDocId IN (".implode(',',$ids).")")->execute();
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
                    $connection->update('mst_documents', [
                        'eDocStatus' => 'deleted',
                        'dtDocUpdatedOn' => Time::now()],['iPkDocId' => $id]);
                    $connection->commit();
                    $this->response('s', '', 'document deleted successfully');
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
                    $connection->query("UPDATE `mst_documents` SET `eDocStatus` = 'deleted',`dtDocUpdatedOn` = now() WHERE iPkDocId IN (".implode(',',$ids).")")->execute();
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
    public function getSearchData()
    {        
        $where  = '';
        if($this->request->data['iPkFolderId'] != ''){
            $where .= 'and md.iFkFolderId = "'. $this->request->data['iPkFolderId'].'"';
        }

        if($this->request->data['iDocumentCategoryId'] != ''){
            $where .= 'and md.iFkDocCatId = "'. $this->request->data['iDocumentCategoryId'].'"';
        }
        $connection = ConnectionManager::get('default');

        $query = $connection->execute("SELECT md.*,fd.vFolderName, mdc.vDocCat FROM  mst_documents as md
                                             JOIN mst_doc_category as mdc ON mdc.iPkDocCatId = md.iFkDocCatId
                                             LEFT JOIN mst_folder as fd ON fd.iPkFolderId = md.iFkFolderId
                                             WHERE md.eDocStatus!='deleted' $where
                                             ORDER BY iPriority ASC , dtPriority DESC")->fetchAll('assoc');

        $this->response('s', $query);
    }

    public function front_getcategory(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  mst_documents WHERE eDocStatus='active' ORDER BY iPkDocId DESC ")->fetchAll('assoc');
        return $query;
    }

    public function getDocumentCategory($id){
        $connection = ConnectionManager::get('default');
        $type= $this->request->data['type'];
        $query = $connection->execute("SELECT iPkDocCatId,vDocCat,eDocStatus FROM mst_doc_category where etype='".$type."' AND iFKFolderId= '".$id."' AND eDocStatus = 'active'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    // Tcfd means T= todo, c= coverletter, f= faq, d=document

    public function getTcfdCategory(){
        $connection = ConnectionManager::get('default');
        $type= $this->request->data['type'];
        $query = $connection->execute("SELECT iPkDocCatId,vDocCat,eDocStatus FROM mst_doc_category where etype='".$type."' AND eDocStatus = 'active'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function getDocumentTemplate(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT iPkDocTemplateId,vDocTemplate,eDocTemplateStatus FROM mst_doc_template where eDocTemplateStatus = 'active'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function getDocuments(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT iPkDocId,vDocName,vDocSuggestion,eDocStatus
        FROM  mst_documents where eDocStatus='active'")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function UploadTemplate()
    {
        if ($this->request->is(['post'])) {
            // Check file size
            if ($this->request->data["fileToUpload"]["size"] > 5242880) {
                $this->response('f', '','Sorry, Selected file is too large in size.');
            }
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');

            $target_dir = WWW_ROOT . 'doctemplates/';
            $connection->begin();

            if(!empty($this->request->data['fileToUpload']['name']))
            {
                try {
                    $target_file = $target_dir . basename($this->request->data['fileToUpload']['name']);
                    $current = strtotime("now");
                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $arr_ext = array('jpg','jpeg','gif','png','pdf','doc','docx');
                    if(in_array($imageFileType, $arr_ext))
                    {
                        $image_name = pathinfo($this->request->data['fileToUpload']['name'], PATHINFO_FILENAME).'_'.$current . '.' . $imageFileType;
                        $target_file = $target_dir . $image_name;

                        if(move_uploaded_file($this->request->data['fileToUpload']["tmp_name"], $target_file)){

                            if($imageFileType == 'jpg' || $imageFileType == 'jpeg' || $imageFileType == 'gif' || $imageFileType == 'png'){
                                $type = 'IMAGE';
                            }
                            else if($imageFileType == 'pdf'){
                                $type = 'PDF';
                            }
                            else if($imageFileType == 'doc' || $imageFileType == 'docx'){
                                $type = 'DOC';
                            }

                            $connection->insert('mst_doc_template', [
                                'iFkDocId' => $this->request->data['iPkDocId'],
                                'vDocTemplateFile'=>$image_name,
                                'eDocFileType' => $type,
                                'dtDocTemplateCreatedOn' => Time::now()]);
                            $connection->commit();
                            $this->response('s','','Template has been uploaded');
                        }else{
                            $this->response('f','','Unable to upload file, please try again.');
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
                $this->response('f', '', 'Please select document.');
            }
        } else {
            $this->response('f', '', 'Unprocessable entity');
        }
    }

    public function getTemplates()
    {
        if (!empty($this->request->data['iPkDocId'])) {
            $iPkDocId = $this->request->data['iPkDocId'];
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("SELECT * from mst_doc_template WHERE iFkDocId = '" . $iPkDocId . "'")->fetchAll('assoc');
            $this->response('s', $query);
        } else {
            $this->response('f', '');
        }
    }

    public function deleteTemplate()
    {
        $connection = ConnectionManager::get('default');
        $iPkDocTemplateId = $this->request->data['iPkDocTemplateId'];

        $record = $connection->execute("select * from mst_doc_template WHERE iPkDocTemplateId =".$iPkDocTemplateId)->fetch('assoc');
        $image_dir = WWW_ROOT . 'doctemplates/';
        if (file_exists($image_dir . $record['vDocTemplateFile'])) {
            unlink($image_dir . $record['vDocTemplateFile']);
        }
        $connection->delete('mst_doc_template', ['iPkDocTemplateId' => $iPkDocTemplateId]);
        $this->response('s','','Template has been removed.');
    }

    public function createduplicate(){
        
        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];            
            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            if ($this->request->is(['post'])) {
                $records = $connection->query("SELECT * FROM mst_documents WHERE iPkDocId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                //echo "<pre>"; print_r($records); exit;

                $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_documents;")->fetch('assoc');
                
                $priority = $findmaxpriority['priority'] + 1;
                foreach ($records as $key => $value) {

                    $iFkDocCatId = $value['iFkDocCatId'];
                    $iFkFolderId = $value['iFkFolderId'];
                    $vDocName = $value['vDocName'];
                    $vDocSuggestion = $value['vDocSuggestion'];
                    $vDocGuide = $value['vDocGuide'];
                    $eDocStatus = $value['eDocStatus'];
                    $dtDocCreatedOn = $value['dtDocCreatedOn'];
                    $dtDocUpdatedOn = $value['dtDocUpdatedOn'];

                    $query = $connection->insert('mst_documents', ['iFkDocCatId' => $iFkDocCatId,
                        'iFkFolderId' => $iFkFolderId,
                        'vDocName' => $vDocName,
                        'iPriority' => $priority,
                        'vDocSuggestion' => $vDocSuggestion,
                        'vDocGuide' => $vDocGuide,
                        'eDocStatus' => 'inactive',
                        'dtDocCreatedOn'=>$dtDocCreatedOn,
                        'dtDocUpdatedOn'=>$dtDocUpdatedOn,
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
                $records = $connection->query("SELECT * FROM mst_documents WHERE iPkDocId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                foreach ($records as $key => $value) {
                    $iPkDocId = $value['iPkDocId'];
                    $iFkFolderId = $value['iFkFolderId'];
                    $iFkDocCatId = $value['iFkDocCatId'];                    

                    $query = $connection->update('mst_documents', [                            
                        'iFkFolderId'=>$fid,
                        'iFkDocCatId'=>$cid
                    ], ['iPkDocId' => $iPkDocId]);
                }
                $this->response('s', '', 'added successfully');
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function changePriority(){
        
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $iPkDocId = $this->request->data['pid'];
        $iPriority = $this->request->data['prio'];
        $connection = ConnectionManager::get('default');
        if($iPkDocId != '' && $iPriority != ''){
            $query = $connection->update('mst_documents', [                            
                'iPriority'=>$iPriority,
                'dtPriority'=>Time::now()
            ], ['iPkDocId' => $iPkDocId]);
            $this->response('s', '', 'Priority Change');
        }else{
            $this->response('f', '', 'Somethig went wrong');
        }
    }
}
