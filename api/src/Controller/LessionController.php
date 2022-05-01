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
use Intervention\Image\ImageManagerStatic as Image;

class LessionController extends AppController
{
    /********** FORMASTER CALL PROCEDURE "sp_system_admin" **********************************/
    public function initialize() {
        $this->loadComponent('RequestHandler');
        $this->checkValidToken(); }


    public function index(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT ml.*,mlr.vLessonResource,mf.vFolderName,mlr.vthumbnailFile
                                             FROM mst_lessons as ml
                                             LEFT JOIN mst_lessons_resource as mlr on mlr.iFkLessonId=ml.iPkLessonId AND mlr.eLessonResourceType = 'VIDEO'
                                             LEFT JOIN mst_folder as mf on mf.iPkFolderId = ml.iFkFolderId
                                             where ml.eLessonStatus!='deleted' ORDER BY iPriority ASC , dtPriority DESC")->fetchAll('assoc');

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
                $query = $connection->update('mst_lessons', [
                    'eLessonStatus' => $status,
                    'dtLessonUpdatedDate' => Time::now()],['iPkLessonId' => $id]);
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
                    $connection->query("UPDATE `mst_lessons` SET `eLessonStatus` = '".$status."',`dtLessonUpdatedDate` = now() WHERE iPkLessonId IN (".implode(',',$ids).")")->execute();
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
                $query = $connection->update('mst_lessons', [
                    'eLessonStatus'=>'deleted',
                    'dtLessonUpdatedDate' => Time::now()],['iPkLessonId' => $id]);
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
                    $connection->query("UPDATE `mst_lessons` SET `eLessonStatus` = 'deleted',`dtLessonUpdatedDate` = now() WHERE iPkLessonId IN (".implode(',',$ids).")")->execute();
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
        $query = $connection->execute("select * from mst_lessons where  iPkLessonId='".$id."'")->fetch('assoc');
        if(!empty($query))
        {
            $query['lesson_image'] = str_replace("_org","_thumbnail",$query['vthumbnailFile']);
            $this->response('s',$query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }


    public function addLession(){


        if (!empty($this->request->data['vTitle']))
            $vTitle= $this->request->data['vTitle'];

        if (!empty($this->request->data['vDescription']))
            $vDescription = $this->request->data['vDescription'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_lessons WHERE eLessonStatus != 'deleted'")->fetch('assoc');
            
            $priority = $findmaxpriority['priority'] + 1;
            
            $connection->begin();
            try {
                $query = $connection->insert('mst_lessons', [
                    'vLessonTitle' => $vTitle,
                    'iPriority' => $priority,
                    'vLessonDescription' => $vDescription,
                    'eLessonStatus' => 'active',
                    'iFkFolderId' => $iPkFolderId,
                    'dtLessonCreatedDate' => Time::now(),
                    'dtPriority'=>Time::now()
                ]);
                $connection->commit();
                $last_id = $connection->execute("SELECT LAST_INSERT_ID()")->fetchAll('assoc');
                $lastID = $last_id[0]['LAST_INSERT_ID()'];
                $this->response('s', array('iPkLessonId' => $lastID));
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        }
    }

    public function editLession(){

        if (!empty($this->request->data['vTitle']))
            $vTitle= $this->request->data['vTitle'];

        if (!empty($this->request->data['vDescription']))
            $vDescription = $this->request->data['vDescription'];

        if (!empty($this->request->data['iPkLessonId']))
            $iPkLessonId = $this->request->data['iPkLessonId'];

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $query = $connection->update('mst_lessons', [
                    'vLessonTitle' => $vTitle,
                    'vLessonDescription' => $vDescription,
                    'iFkFolderId' => $iPkFolderId,
                    'dtLessonUpdatedDate' => Time::now()
                ], ['iPkLessonId' => $iPkLessonId]);

                $connection->commit();
                $this->response('s', array('iPkLessonId' => $iPkLessonId));

            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        }
    }

    public function getLessons($id){

        $connection = ConnectionManager::get('default');

        $query = $connection->execute("SELECT ml.iFkFolderId,ml.iPkLessonId,ml.vLessonTitle,ml.vLessonDescription,mlr.vLessonResource, mlr.vthumbnailFile,ml.vLessonVideoLink
        FROM mst_lessons AS ml
        LEFT JOIN mst_lessons_resource AS mlr ON mlr.iFkLessonId=ml.iPkLessonId AND mlr.eLessonResourceType = 'VIDEO'
        WHERE ml.iPkLessonId = '" . $id . "'")->fetch('assoc');


        if ($query) {

            $query['lesson_image'] = str_replace("_org","_thumbnail",$query['vthumbnailFile']);
            $this->response('s', $query);
        } else {
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function  checkVideoLesson(){
        if (!empty($this->request->data['iPkLessonId'])) {
            $iPkLessonId = $this->request->data['iPkLessonId'];
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("SELECT ml.iPkLessonId,mlr.iPkLessonRId
          from mst_lessons as ml
          left join mst_lessons_resource as mlr on mlr.iFkLessonId=ml.iPkLessonId
          WHERE mlr.iFkLessonId = '" . $iPkLessonId . "' AND mlr.eLessonResourceType = 'VIDEO'")->fetchAll('assoc');
            if (count($query) > 0) {
                $this->response('s', array('Status'=>'yes'));
            } else {
                $this->response('s', array('Status'=>'no'));
            }
        } else {
            $this->response('s', array('Status'=>'no'));
        }
    }

    public function editVideo(){
        $connection = ConnectionManager::get('default');
        if ($this->request->is(['post'])) {
            //echo "<pre>"; print_r($this->request->data); exit;
            if (!empty($this->request->data['iPkLessonId']))
                $iPkLessonId = $this->request->data['iPkLessonId'];

            if(!empty($this->request->data['vLessonVideoLink']))
                $vLessonVideoLink = $this->request->data['vLessonVideoLink']; 

                $query2 = $connection->update('mst_lessons', [                            
                    'vLessonVideoLink' => $vLessonVideoLink
                ], ['iPkLessonId' => $iPkLessonId]);               
            //UPLOAD THUMBNAIL START
            if (isset($this->request->data['thumbnail']['name'])) {                
                $current = strtotime("now");
                $target_dir = WWW_ROOT . 'videos/thumbnail/';
                $target_file = $target_dir . basename($this->request->data['thumbnail']['name']);
                $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                $thumbnail_name = 'lesson_' .$current . '_org.' . $imageFileType;
                $thumbnail_name1 = 'lesson_' .$current . '_thumbnail.' . $imageFileType;
                $target_file = $target_dir . $thumbnail_name;
                Image::configure(array('driver' => 'gd'));
                if (move_uploaded_file($this->request->data["thumbnail"]["tmp_name"], $target_file)) {
                    Image::make($target_file)->resize(200, 200)->save($target_dir . $thumbnail_name1);
                    if (file_exists($target_dir . $this->request->data['lesson_thumbnail'])) {
                        unlink($target_dir . $this->request->data['lesson_thumbnail']);
                        // unlink($target_dir . str_replace("org", "thumbnail", $this->request->data['lesson_thumbnail']));
                    }

                    $connection->begin();
                    try {
                        $query = $connection->update('mst_lessons_resource', [                            
                            'vthumbnailFile' => $thumbnail_name1,                            
                            'dtLessonRUpdatedDate' => Time::now()
                        ], ['iFkLessonId' => $iPkLessonId, 'eLessonResourceType' => 'VIDEO']);                          
    
                        $connection->commit();
                        $this->response('s', array('thumbnail_Name' => $thumbnail_name1));
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                }else{
                    $thumbnail_name =  $this->request->data['lesson_thumbnail'];
                }
            } else {
                $thumbnail_name = $this->request->data['lesson_thumbnail'];
            }

            //UPLOAD THUMBNAIL END

            if (isset($this->request->data['videoFile']['name'])) {

                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');              

                $target_dir = WWW_ROOT . 'videos/';
                $target_file = $target_dir . basename($this->request->data['videoFile']['name']);
                $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                $current = strtotime("now");

                $file_name = 'lesson'.$iPkLessonId.'_'.$current .'_video.' . $imageFileType;

                $target_file = $target_dir . $file_name;

                if (move_uploaded_file($this->request->data["videoFile"]["tmp_name"], $target_file)) {
                    $get_old_video_file = $connection->execute("SELECT vLessonResource,eLessonResourceType,vthumbnailFile FROM mst_lessons_resource WHERE iFkLessonId ='".$iPkLessonId."' AND eLessonResourceType ='video'")->fetch('assoc');
                    $OLD_VIDEO = $get_old_video_file['vLessonResource'];
                    $OLD_THUMBNAIL = $get_old_video_file['vthumbnailFile'];
                    if (file_exists($target_dir . $OLD_VIDEO)) {
                        unlink($target_dir . $OLD_VIDEO);
                    }

                    $this->creatingvideothumbimage_ffmpeg($target_file,$target_dir,'lesson'.$iPkLessonId.'_'.$current .'_video');
                    
                    $connection->begin();
                    try {
                        $query = $connection->update('mst_lessons_resource', [
                            'iFkLessonId' => $iPkLessonId,
                            'vLessonResource' => $file_name,                            
                            'eLessonResourceType' => 'VIDEO',
                            'eLessonRStatus' => 'active',
                            'dtLessonRUpdatedDate' => Time::now()
                        ], ['iFkLessonId' => $iPkLessonId, 'eLessonResourceType' => 'VIDEO']);  
    
                        $connection->commit();
                        $this->response('s', array('fileName' => $file_name));
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }                    
                }                   
            }else {
                $success = 'Video Successfully Edited.';
                $this->response('s',$success);

                //$lesson_video_name = $this->request->data['lesson_video_name'];
            }
                       
        }else{
            
        }        
    }

    public function addVideo()
    {
        $connection = ConnectionManager::get('default');
        if (!empty($this->request->data['iPkLessonId']))
            $iPkLessonId = $this->request->data['iPkLessonId'];

        if(!empty($this->request->data['vLessonVideoLink']))
                $vLessonVideoLink = $this->request->data['vLessonVideoLink']; 

                $query2 = $connection->update('mst_lessons', [                            
                    'vLessonVideoLink' => $vLessonVideoLink
                ], ['iPkLessonId' => $iPkLessonId]);

        if ($this->request->is(['post'])) {
            //echo "<pre>"; print_r($this->request->data()); exit;
            //UPLOAD THUMBNAIL START
            if (isset($this->request->data['thumbnail']['name'])) {
                $current = strtotime("now");
                $target_dir = WWW_ROOT . 'videos/thumbnail/';
                $target_file = $target_dir . basename($this->request->data['thumbnail']['name']);
                $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                $thumbnail_name = 'lesson_' .$current . '_org.' . $imageFileType;
                $thumbnail_name1 = 'lesson_' .$current . '_thumbnail.' . $imageFileType;
                $target_file = $target_dir . $thumbnail_name;
                Image::configure(array('driver' => 'gd'));
                if (move_uploaded_file($this->request->data["thumbnail"]["tmp_name"], $target_file)) {
                    Image::make($target_file)->resize(460, 183)->save($target_dir . $thumbnail_name1);
                }
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $connection->begin();
                $query = $connection->insert('mst_lessons_resource', [
                    'iFkLessonId' => $iPkLessonId,
                    'vLessonResource' => $file_name,
                    'vthumbnailFile' => $thumbnail_name1,
                    'eLessonResourceType' => 'VIDEO',
                    'eLessonRStatus' => 'active',
                    'dtLessonRCreatedDate' => Time::now()
                ]);
                $connection->commit();
            } else {
                $thumbnail_name = '';
            }
            /*if (isset($this->request->data['videoFile']['name'])) 
            {
                $current = strtotime("now");
                $target_dir = WWW_ROOT . 'videos/';
                $target_file = $target_dir . basename($this->request->data['videoFile']['name']);              
                
                
                $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                
                $file_name = 'lesson'.$iPkLessonId.'_'.$current .'_video.' . $imageFileType;
                $target_file = $target_dir . $file_name;
                if (move_uploaded_file($this->request->data["videoFile"]["tmp_name"], $target_file)) {
                    $uploadOk = 1;
                    //$this->creatingvideothumbimage_ffmpeg($target_file,$target_dir,'lesson'.$iPkLessonId.'_'.$current .'_video');
                }else{
                    $uploadOk = 0;
                }

                if($uploadOk == 1){
                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                    $connection = ConnectionManager::get('default');
                    $connection->begin();
                    try {
                        $query = $connection->insert('mst_lessons_resource', [
                            'iFkLessonId' => $iPkLessonId,
                            'vLessonResource' => $file_name,
                            'vthumbnailFile' => $thumbnail_name1,
                            'eLessonResourceType' => 'VIDEO',
                            'eLessonRStatus' => 'active',
                            'dtLessonRCreatedDate' => Time::now()
                        ]);
                        $connection->commit();
                        $this->response('s', array('fileName' => $file_name));
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                }else{
                        $error = 'Unable to upload video. Something went wrong.';                    
                        $this->response('f', '', $error);
                }            
            }*/
        }

        $error = 'Unable to upload video. Something went wrong.';     
        $this->response('f', '', $error);
    }

    public function creatingvideothumbimage_ffmpeg($target_file,$target_dir,$file_name)
    {
        // where ffmpeg is located
        $ffmpeg = '/usr/bin/ffmpeg';
        //video dir
        $video = $target_file;
        //where to save the image
        //time to take screenshot at
        $interval = 5;

        $video_thumb_460x183 =  $target_dir.'thumbnail_'.$file_name.'.jpg';
        $image = $video_thumb_460x183;
        $size = '460x183';
        $cmd_460x183 = "$ffmpeg -i \"$video\" -deinterlace -an -ss $interval -f mjpeg -t 1 -r 1 -y -s $size \"$image\" 2>&1";
        exec($cmd_460x183);
    }

    public function addSubResourceFile(){
        if ($this->request->is(['post'])) {
            $type = '';
            $iPkLessonId = '';
            $resourceName = '';
            $connection = ConnectionManager::get('default');
            $target_dir = WWW_ROOT . 'resources/';
            
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');

            if (!empty($this->request->data['iPkLessonId'])){
                $iPkLessonId = $this->request->data['iPkLessonId'];
            }

            if (!empty($this->request->data['resourceName'])){
                $resourceName = $this->request->data['resourceName'];
            }

            if($resourceName != '' && $resourceName != 'undefined'){
                $connection->begin();
                try {
                    $target_file = $target_dir . basename($this->request->data['resources']['name']);
                    $current = strtotime("now");

                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $image_name = $resourceName .'_'.$current . '.' . $imageFileType;
                    $target_file = $target_dir . $image_name;
                    $doc_type = strtoupper($imageFileType);

                    move_uploaded_file($this->request->data['resources']["tmp_name"], $target_file);

                    if($doc_type == 'BMP' || $doc_type == 'GIF' || $doc_type == 'JPEG' || $doc_type == 'JPG' || $doc_type == 'PNG'){
                        $type='IMAGE';
                    }
                    else if($doc_type == 'PDF'){
                        $type='PDF';
                    }
                    else if($doc_type == 'DOC' || $doc_type == 'DOCX' || $doc_type == 'PPT' || $doc_type == 'PPTX'){
                        $type='DOC';
                    }
                    else if($doc_type == 'CSV' || $doc_type == 'XLS' || $doc_type == 'XLSX' || $doc_type == 'XLSX'){
                        $type='XLSX';
                    }

                    $connection->insert('mst_lessons_resource', [
                        'iFkLessonId' => $iPkLessonId,
                        'vResourceName' => $resourceName,
                        'vLessonResource' => $image_name,
                        'eLessonResourceType' => $type,
                        'eLessonRStatus' => 'active',
                        'dtLessonRCreatedDate' => Time::now()]);

                    $connection->commit();
                    $this->response('s', '', 'Added Successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            }else{
                $error = 'Resource Name is required';
                $this->response('f', '', $error);
            }
        }
    }

    public function getSubResources(){

        if (!empty($this->request->data['iPkLessonId'])) {
            $iPkLessonId = $this->request->data['iPkLessonId'];
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("SELECT * from mst_lessons_resource WHERE iFkLessonId = '" . $iPkLessonId . "' and eLessonResourceType!='VIDEO'")->fetchAll('assoc');
            if (count($query) > 0) {
                $this->response('s', $query);
            } else {
                $this->response('f','');
            }
        } else {
            $this->response('f', '');
        }
    }

    public function deleteResources(){

        $connection = ConnectionManager::get('default');

        if (!empty($this->request->data['iPkLessonRId']))
            $iPkLessonRId = $this->request->data['iPkLessonRId'];

        $img = $connection->execute("select * from mst_lessons_resource WHERE iPkLessonRId=".$iPkLessonRId)->fetch('assoc');
        $image_dir = WWW_ROOT . 'resources/';
        if (file_exists($image_dir . $img['vLessonResource'])) {
            unlink($image_dir . $img['vLessonResource']);
        }
        $connection->delete('mst_lessons_resource', ['iPkLessonRId' => $iPkLessonRId,'']);
        $this->response('s');
    }

    public function getLesson()
    {
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select iPkLessonId,vLessonTitle,vLessonDescription from mst_lessons where eLessonStatus='active'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function createduplicate(){

        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];

            $connection = ConnectionManager::get('default');
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            if ($this->request->is(['post'])) {
                $records = $connection->query("SELECT * FROM mst_lessons WHERE iPkLessonId IN (" . implode(',', $ids) . ")")->fetchAll('assoc');
                //echo "<pre>"; print_r($records); exit;
                $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_lessons WHERE eLessonStatus != 'deleted'")->fetch('assoc');
                
                $priority = $findmaxpriority['priority'] + 1;
                foreach ($records as $key => $value) {

                    $vLessonTitle = $value['vLessonTitle'];
                    $folder_id = $value['iFkFolderId'];
                    $vLessonDescription = $value['vLessonDescription'];
                    $eLessonStatus = $value['eLessonStatus'];
                    $dtLessonCreatedDate = $value['dtLessonCreatedDate'];
                    $dtLessonUpdatedDate = $value['dtLessonUpdatedDate'];

                    $query = $connection->insert('mst_lessons', ['vLessonTitle' => $vLessonTitle,
                        'iFkFolderId' => $folder_id,
                        'vLessonDescription' => $vLessonDescription,
                        'eLessonStatus' => 'inactive',
                        'iPriority' => $priority,
                        'dtLessonCreatedDate' => $dtLessonCreatedDate,
                        'dtLessonUpdatedDate' => $dtLessonUpdatedDate,
                        'dtPriority'=>Time::now()]);

                        $priority++;
                }
                $this->response('s', '', 'added successfully');
            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function changePriority(){
        
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $iPkLessonId = $this->request->data['pid'];
        $iPriority = $this->request->data['prio'];
        $connection = ConnectionManager::get('default');
        if($iPkLessonId != '' && $iPriority != ''){
            $query = $connection->update('mst_lessons', [                            
                'iPriority'=>$iPriority,
                'dtPriority'=>Time::now()
            ], ['iPkLessonId' => $iPkLessonId]);
            $this->response('s', '', 'Lession Priority Change');
        }else{
            $this->response('f', '', 'Somethig went wrong');
        }
    }
}

?>
