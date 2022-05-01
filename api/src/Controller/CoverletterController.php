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
use Intervention\Image\ImageManagerStatic as Image;

class CoverletterController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT mcl.*,fd.vFolderName FROM  mst_cover_letter as mcl
                                             LEFT JOIN mst_folder as fd ON fd.iPkFolderId = mcl.iFkFolderId
                                             WHERE mcl.eCoverLetterStatus != 'deleted'
                                             ORDER BY iPriority ASC , dtPriority DESC")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function view($id){

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  mst_cover_letter where iPkCoverLetterId=:catid",['catid' => $id])->fetch('assoc');
        if(!empty($query))
        {
            $query['cover_image'] = str_replace("_org","_thumbnail",$query['vCoverLetterThumbFile']);
            $this->response('s',$query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function add(){
        foreach ($this->request->data as $key=>$value){
            if($this->request->data[$key] == 'undefined'){
                $this->request->data[$key] = null;
            }
        }
        error_reporting(0);

        $iFkFolderId = '';
        $vCoverLetterTitle = '';
        $eCoverFee = '';

        if(isset($this->request->data['catName'])){
            $vCoverLetterTitle = $this->request->data['catName'];
        }

        if(isset($this->request->data['iPkFolderId'])){
            $iFkFolderId = $this->request->data['iPkFolderId'];
        }

        if(isset($this->request->data['feeId'])){
            $eCoverFee = $this->request->data['feeId'];
        }

        if(empty($vCoverLetterTitle)){
            $this->response('f','','Cover Letter Name is required.');
        }

        if(empty($iFkFolderId)){
            $this->response('f','','Please select appropriate folder.');
        }

        if(empty($eCoverFee)){
            $this->response('f','','Please select cover fee.');
        }

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');

            $checkCatExist = $connection->execute("SELECT * FROM mst_cover_letter WHERE  LOWER(vCoverLetterTitle)=:catname", ['catname' => strtolower($vCoverLetterTitle)])->fetchAll('assoc');
            $findmaxpriority = $connection->execute("SELECT MAX(iPriority) as priority FROM mst_cover_letter WHERE eCoverLetterStatus != 'deleted'")->fetch('assoc');
            
            $priority = $findmaxpriority['priority'] + 1;
            if (count($checkCatExist) == 0) {
                $connection->begin();
                try {
                    $current = strtotime("now");
                    //UPLOAD THUMBNAIL START
                    if (isset($this->request->data['thumbfileName']['name'])) {
                        $target_dir = WWW_ROOT . 'coverletters/thumbnail/';
                        $target_file = $target_dir . basename($this->request->data['thumbfileName']['name']);
                        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                        $thumbnail_name = 'cl_' .$current . '_org.' . $imageFileType;
                        $thumbnail_name1 = 'cl_' .$current . '_thumbnail.' . $imageFileType;
                        $target_file = $target_dir . $thumbnail_name;
                        Image::configure(array('driver' => 'gd'));
                        if (move_uploaded_file($this->request->data["thumbfileName"]["tmp_name"], $target_file)) {
                            Image::make($target_file)->resize(100, 100)->save($target_dir . $thumbnail_name1);
                        }
                    } else {
                        $thumbnail_name = '';
                    }

                    //UPLOAD THUMBNAIL END

                    // UPLOAD FILE START
                    if (isset($this->request->data['fileName']['name'])) {
                        $target_dir = WWW_ROOT . 'coverletters/file/';
                        $target_file = $target_dir . basename($this->request->data['fileName']['name']);
                        $FileType = pathinfo($target_file, PATHINFO_EXTENSION);

                        $file_name = 'cl_' . $current . '.' . $FileType;
                        $target_file = $target_dir . $file_name;
                        if (move_uploaded_file($this->request->data["fileName"]["tmp_name"], $target_file)) {

                        } else {
                            $file_name = '';
                        }
                    }
                    // UPLOAD FILE END

                    $connection->insert('mst_cover_letter', [
                        'vCoverLetterTitle' => $vCoverLetterTitle,
                        'vCoverLetterDesc' => $this->request->data['catDesc'],
                        'dCoverLetterPrice' => $this->request->data['cover_price'],
                        'vCoverLetterFile' => $file_name,
                        'iPriority' => $priority,
                        'vCoverLetterThumbFile' => $thumbnail_name,
                        'eCoverFee' => $eCoverFee,
                        'iFkFolderId' => $iFkFolderId,
                        'eCoverLetterStatus' => 'active',
                        'dtCoverLetterCreatedOn' => Time::now(),
                        'dtPriority'=>Time::now()]);
                    $connection->commit();
                    $this->response('s', '', 'Cover Letter has been created');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Cover Letter Name already exist');
            }
        } else {
            $this->response('f', '', 'Invalid method');
        }
    }
    
    public function edit(){
        foreach ($this->request->data as $key=>$value){
            if($this->request->data[$key] == 'undefined'){
                $this->request->data[$key] = null;
            }
        }
        error_reporting(0);

        $catId = '';
        $iFkFolderId = '';
        $vCoverLetterTitle = '';
        $eCoverFee = '';

        if(!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if(isset($this->request->data['catName'])){
            $vCoverLetterTitle = $this->request->data['catName'];
        }

        if(isset($this->request->data['iPkFolderId'])){
            $iFkFolderId = $this->request->data['iPkFolderId'];
        }

        if(isset($this->request->data['feeId'])){
            $eCoverFee = $this->request->data['feeId'];
        }

        if(empty($vCoverLetterTitle)){
            $this->response('f','','Cover Letter Name is required.');
        }

        if(empty($iFkFolderId)){
            $this->response('f','','Please select appropriate folder.');
        }

        if(empty($eCoverFee)){
            $this->response('f','','Please select cover fee.');
        }

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $checkCatExist = $connection->execute("SELECT * FROM mst_cover_letter WHERE  LOWER(vCoverLetterTitle)=:catname AND iPkCoverLetterId!=:catid", ['catname' => strtolower($vCoverLetterTitle),'catid' => $catId])->fetchAll('assoc');
            if (count($checkCatExist) == 0) {
                $connection->begin();
                try {
                    $current = strtotime("now");
                    //UPLOAD THUMBNAIL START
                    if (isset($this->request->data['thumbfileName']['name'])) {
                        $target_dir = WWW_ROOT . 'coverletters/thumbnail/';
                        $target_file = $target_dir . basename($this->request->data['thumbfileName']['name']);
                        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                        $thumbnail_name = 'cl_' .$current . '_org.' . $imageFileType;
                        $thumbnail_name1 = 'cl_' .$current . '_thumbnail.' . $imageFileType;
                        $target_file = $target_dir . $thumbnail_name;
                        Image::configure(array('driver' => 'gd'));
                        if (move_uploaded_file($this->request->data["thumbfileName"]["tmp_name"], $target_file)) {
                            Image::make($target_file)->resize(100, 100)->save($target_dir . $thumbnail_name1);
                            if (file_exists($target_dir . $this->request->data['cover_thumbnail'])) {
                                unlink($target_dir . $this->request->data['cover_thumbnail']);
                                unlink($target_dir . str_replace("org", "thumbnail", $this->request->data['cover_thumbnail']));
                            }
                        }else{
                            $thumbnail_name =  $this->request->data['cover_thumbnail'];
                        }
                    } else {
                        $thumbnail_name = $this->request->data['cover_thumbnail'];
                    }

                    //UPLOAD THUMBNAIL END

                    // UPLOAD FILE START
                    if (isset($this->request->data['fileName']['name'])) {
                        $target_dir = WWW_ROOT . 'coverletters/file/';
                        $target_file = $target_dir . basename($this->request->data['fileName']['name']);
                        $FileType = pathinfo($target_file, PATHINFO_EXTENSION);

                        $file_name = 'cl_' . $current . '.' . $FileType;
                        $target_file = $target_dir . $file_name;
                        if (move_uploaded_file($this->request->data["fileName"]["tmp_name"], $target_file)) {
                            if (file_exists($target_dir . $this->request->data['cover_file'])) {
                                unlink($target_dir . $this->request->data['cover_file']);
                            }
                        } else {
                            $file_name = $this->request->data['cover_file'];
                        }
                    }else{
                        $file_name = $this->request->data['cover_file'];
                    }
                    // UPLOAD FILE END

                    $connection->update('mst_cover_letter', [
                        'vCoverLetterTitle' => $vCoverLetterTitle,
                        'vCoverLetterDesc' => $this->request->data['catDesc'],
                        'dCoverLetterPrice' => $this->request->data['cover_price'],
                        'vCoverLetterFile' => $file_name,
                        'vCoverLetterThumbFile' => $thumbnail_name,
                        'eCoverFee' => $eCoverFee,
                        'iFkFolderId' => $iFkFolderId,
                        'dtCoverLetterUpdatedOn' => Time::now()],['iPkCoverLetterId' => $catId]);
                    $connection->commit();
                    $this->response('s', '', 'Cover Letter has been updated');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Cover Letter Name already exist');
            }
        } else {
            $this->response('f', '', 'Invalid method');
        }

        $catName = '';
        $catId = '';
        $feeId = '';
        $price = '';
        error_reporting(0);
        if (!empty($this->request->data['catId']))
            $catId = $this->request->data['catId'];

        if (!empty($this->request->data['catName']))
            $catName = $this->request->data['catName'];

        if (!empty($this->request->data['catDesc']))
            $catDesc = $this->request->data['catDesc'];

        if (!empty($this->request->data['price']))
            $price = $this->request->data['price'];

        if (!empty($this->request->data['feeId']))
            $feeId = $this->request->data['feeId'];

        if($feeId == 'free'){
            $price = null;
        }

        if (!empty($this->request->data['iPkFolderId']))
            $iPkFolderId = $this->request->data['iPkFolderId'];

        if($catId == '' || $catName == '' || $catDesc==''){
            $this->response('f','','Incomplete Parameter');
        }
        $userId = $this->request->data['aid'];

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');

            $checkCatExist = $connection->execute("SELECT * FROM mst_cover_letter WHERE  LOWER(vCoverLetterTitle)=:catname AND iPkCoverLetterId!=:catid", ['catname' => strtolower($catName),'catid' => $catId])->fetchAll('assoc');
            if (count($checkCatExist) == 0) {
                $connection->begin();
                try {
                    //UPLOAD THUMBNAIL START

                    if (isset($this->request->data['ThumbFilename']['name'])) {

                        $target_dir = WWW_ROOT . 'coverletters/thumbnail/';
                        $target_file = $target_dir . basename($this->request->data['ThumbFilename']['name']);
                        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                        $current = strtotime("now");

                        $thumbnail_name = $current . '_org.' . $imageFileType;
                        $thumbnail_name1 = $current . '_thumbnail.' . $imageFileType;
                        $target_file = $target_dir . $thumbnail_name;
                        Image::configure(array('driver' => 'gd'));
                        if (move_uploaded_file($this->request->data["ThumbFilename"]["tmp_name"], $target_file)) {
                            if (file_exists($target_dir . $this->request->data['ThumbFilename']['tmp_name'])) {
                                unlink($target_dir . $this->request->data['ThumbFilename']);
                                unlink($target_dir . str_replace("org", "100x100", $this->request->data['ThumbFilename']));
                            }
                            Image::make($target_file)->resize(100, 100)->save($target_dir . $thumbnail_name1);
                        }

                    } else {
                        $thumbnail_name = $this->request->data['ThumbFileName'];
                    }

                    //UPLOAD THUMBNAIL END

                    if(isset($this->request->data['Filename']['name'])){
                        $target_dir = WWW_ROOT . 'coverletters/file/';
                        $target_file = $target_dir . basename($this->request->data['Filename']['name']);
                        $type= $target_dir . basename($this->request->data['Filename']['type']);
                        $current = strtotime("now");

                        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                        $image_name = $current . '.' . $imageFileType;
                        $target_file = $target_dir . $image_name;
                        move_uploaded_file($this->request->data['Filename']["tmp_name"], $target_file);
                    }else{

                        $image_name = $this->request->data['Filename'];
                    }
                    $query = $connection->update('mst_cover_letter', [
                        'vCoverLetterTitle' => $catName,
                        'vCoverLetterDesc' => $catDesc,
                        'dCoverLetterPrice'=>$price,
                        'eCoverFee' => $feeId,
                        'vCoverLetterFile'=>$image_name,
                        'vCoverLetterThumbFile'=>$thumbnail_name,
                        'iFkFolderId' => $iPkFolderId,
                        'dtCoverLetterUpdatedOn' => Time::now()],['iPkCoverLetterId' => $catId]);
                    $connection->commit();
                    $this->response('s', '', 'Cover Letter updated successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Cover Letter already exist');
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
                $query = $connection->update('mst_cover_letter', [
                    'eCoverLetterStatus' => $status,
                    'dtCoverLetterUpdatedOn' => Time::now()],['iPkCoverLetterId' => $id]);
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
                    $connection->query("UPDATE `mst_cover_letter` SET `eCoverLetterStatus` = '".$status."',`dtCoverLetterUpdatedOn` = now() WHERE iPkCoverLetterId IN (".implode(',',$ids).")")->execute();
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
            $file = $connection->execute("SELECT vCoverLetterFile FROM  mst_cover_letter WHERE iPkCoverLetterId = $id")->fetch('assoc');
            if($file)
            {
                $filepath = WWW_ROOT . 'coverletters/'.$file['vCoverLetterFile'];
                if (file_exists($filepath)){
                    unlink($filepath);
                }
            }
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                try {
                    $connection->begin();
                    $connection->query("DELETE FROM `mst_cover_letter` WHERE iPkCoverLetterId=".$id)->execute();
                    $connection->commit();
                    $this->response('s', '', 'Cover letter deleted successfully');

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

                $file = $connection->execute("SELECT vCoverLetterFile FROM  mst_cover_letter WHERE iPkCoverLetterId = $valueid")->fetch('assoc');
                if($file['vCoverLetterFile'])
                {
                    $filepath = WWW_ROOT . 'coverletters/'.$file['vCoverLetterFile'];
                    if (file_exists($filepath)){
                        unlink($filepath);
                    }
                }
            }
            if ($this->request->is(['post'])) {
                $connection->begin();
                try {
                    $connection->query("DELETE FROM `mst_cover_letter` WHERE iPkCoverLetterId IN (".implode(',',$ids).")")->execute();
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


    public function getCoverLetter(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT iPkCoverLetterId,vCoverLetterTitle,eCoverLetterStatus FROM  mst_cover_letter where eCoverLetterStatus='active'")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function changePriority(){
        
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $iPkCoverLetterId = $this->request->data['pid'];
        $iPriority = $this->request->data['prio'];
        $connection = ConnectionManager::get('default');
        if($iPkCoverLetterId != '' && $iPriority != ''){
            $query = $connection->update('mst_cover_letter', [                            
                'iPriority'=>$iPriority,
                'dtPriority'=>Time::now()
            ], ['iPkCoverLetterId' => $iPkCoverLetterId]);
            $this->response('s', '', 'Priority Change');
        }else{
            $this->response('f', '', 'Somethig went wrong');
        }
    }
}
