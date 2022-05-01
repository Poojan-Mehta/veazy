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

class FolderController extends AppController
{
    public function initialize() {
        $this->loadComponent('RequestHandler');
        $this->checkValidToken();
    }

    /** index Method return folder listing by type */
    public function index(){
        $connection = ConnectionManager::get('default');
        $type = '';
        if (!empty($this->request->data['eType'])){
            $type = $this->request->data['eType'];
        }
        if($type == 'faq' || $type == 'cover' || $type == 'summary' || $type == 'todo' || $type == 'lesson'|| $type == 'document')
        {
            $query = $connection->execute("select * from mst_folder where eType= '".$type."' ORDER BY iPkFolderId DESC")->fetchAll('assoc');

            foreach ($query as $key => $value) {
                $folderID = $value['iPkFolderId'];
                if($type == 'faq'){
                    $tablename = 'mst_faq';
                    $tablestatus = 'eFAQStatus';
                }else if($type == 'cover'){
                    $tablename = 'mst_cover_letter';
                    $tablestatus = 'eCoverLetterStatus';
                }else if($type == 'summary'){
                    $tablename = 'mst_summary_of_criteria';
                    $tablestatus = 'eSummaryStatus';
                }else if($type == 'todo'){
                    $tablename = 'mst_todo';
                    $tablestatus = 'eToDoStatus';
                }else if($type == 'lesson'){
                    $tablename = 'mst_lessons';
                    $tablestatus = 'eLessonStatus';
                }else if($type == 'document'){
                    $tablename = 'mst_documents';
                    $tablestatus = 'eDocStatus';
                }

                $assign = 'no';
                $foldertype = $connection->execute("select * from $tablename WHERE iFkFolderId = '". $folderID ."' AND $tablestatus != 'deleted'")->fetchAll('assoc');
                $categorytype = $connection->execute("select * from mst_doc_category WHERE iFKFolderId= '".$folderID."'")->fetchAll('assoc');
                if (count($foldertype) || $categorytype) {
                    $assign = 'yes';
                }

                $query[$key]['assign'] = $assign;
            }
        }
        $this->response('s', $query);
    }

    public function delete(){
        if(isset($this->request->data['deleteId'])){
            $id = $this->request->data['deleteId'];
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            try {
                $query = $connection->execute("DELETE FROM mst_folder WHERE iPkFolderId= $id");
                $this->response('s', '', 'Folder has been deleted');
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
                try {
                    $query = $connection->execute("DELETE FROM `mst_folder` WHERE iPkFolderId IN (".implode(',',$ids).")");
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
        $type = '';
        if(!empty($this->request->data['eType'])){
            $type = $this->request->data['eType'];
        }

        if($id == ''){
            $this->response('s','','Incomplete Parameter');
        }

        $where = '';
        if(!empty($type)){
            $where = 'eType = "'.$type.'" AND';
        }

        $query = $connection->execute("select * from mst_folder where $where iPkFolderId='".$id."'")->fetch('assoc');

        if($query){
            $this->response('s', $query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function add()
    {
        error_reporting(0);
        $vFolderName = '';
        $eType = '';

        if (!empty($this->request->data['vFolderName'])){
            $vFolderName = $this->request->data['vFolderName'];
        }

        if (!empty($this->request->data['eType'])){
            $eType = $this->request->data['eType'];
        }

        if ($this->request->is(['post'])) {
            if (!empty($vFolderName) || !empty($eType)) {
                $connection = ConnectionManager::get('default');
                $checkfoldername = $connection->execute("SELECT vFolderName FROM mst_folder WHERE eType = '".$eType."' AND  vFolderName = '".$vFolderName."'")->fetchAll('assoc');
                if(count($checkfoldername) == 0){
                    try{
                        $connection->insert('mst_folder', ['vFolderName' => $vFolderName, 'eType' => $eType]);
                        $this->response('s', '', 'Folder has been created');
                    } catch (\PDOException $e) {
                        $error = 'Unable to create new folder';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                }else{
                    $error="Folder name is already exist";
                    $this->response('f', '', $error);
                }
            }else{
                $error="Folder name is required";
                $this->response('f', '', $error);
            }
        }
    }

    public function edit()
    {
        error_reporting(0);
        $vFolderName = '';
        $eType = '';
        $fid = '';
        if (!empty($this->request->data['vFolderName']))
            $vFolderName = $this->request->data['vFolderName'];

        if (!empty($this->request->data['eType']))
            $eType = $this->request->data['eType'];

        if (!empty($this->request->data['fid']))
            $fid = $this->request->data['fid'];

        if ($this->request->is(['post'])) {
            if (!empty($vFolderName) || !empty($eType)) {
                $connection = ConnectionManager::get('default');

                $checkfolderexist = $connection->execute("SELECT * FROM mst_folder WHERE vFolderName = '".$vFolderName."' AND eType = '".$eType."' AND iPkFolderId != $fid")->fetchAll('assoc');

                if(count($checkfolderexist)){
                    $error="Folder name is already exist";
                    $this->response('f', '', $error);
                }else{
                    $connection->update('mst_folder', ['vFolderName' => $vFolderName],['iPkFolderId' => $fid,'eType' => $eType]);
                    $this->response('s', '', 'Folder name has been updated');
                }
            }else{
                $error="Folder name is required";
                $this->response('f', '', $error);
            }
        }
    }

    public function getFolder(){
        error_reporting(0);
        $type = '';
        if (!empty($this->request->data['eType']))
            $type= $this->request->data['eType'];

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT iPkFolderId,vFolderName FROM mst_folder where eType='".$type."'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function getFolderName(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT iPkFolderId,vFolderName FROM mst_folder")->fetchAll('assoc');
        $this->response('s', $query);
    }
}

?>