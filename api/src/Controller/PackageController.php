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
use Cake\Database\Statement\PDOStatement;
use Intervention\Image\ImageManagerStatic as Image;

class PackageController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT mvp.*,mp.vMPName FROM  mst_visa_product as mvp
                                             LEFT JOIN mst_marketplace as mp ON mp.iPKMPId = mvp.iFKMPId
                                             WHERE mvp.eVisaProductStatus != 'deleted'
                                             ORDER BY mvp.iPkVisaProductId DESC")->fetchAll('assoc');

        foreach ($query as $key=> $data){
            $id = $data['iPkVisaProductId'];

            $checkuserProduct = $connection->execute("SELECT * FROM user_products where iFkVisaProductId=$id")->fetchAll('assoc');
            if (!empty($checkuserProduct)){
                $query[$key]['assign'] = 'yes';
            }else{
                $query[$key]['assign'] = 'no';
            }


        }

        $this->response('s',$query);
    }

    public function view($id){

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  mst_visa_product where iPkVisaProductId=:pkgid and eVisaProductStatus != 'deleted'",['pkgid' => $id])->fetch('assoc');
        if(!empty($query))
        {
            $query['iFkLessonId'] = explode(',',$query['iFkLessonId']);
            $query['iFkSummaryId'] = explode(',',$query['iFkSummaryId']);
            $query['iFkToDoId'] = explode(',',$query['iFkToDoId']);
            $query['iFkCoverLetterId'] = explode(',',$query['iFkCoverLetterId']);
            $query['iFkFAQId'] = explode(',',$query['iFkFAQId']);
            $query['product_image'] = str_replace("_org","_300x300",$query['vVisaProductImage']);
            $tags = $connection->execute("SELECT * FROM mst_tags where iFKProductId=:pkgid",['pkgid' => $id])->fetchAll('assoc');
            $query['tags'] = $tags;
            $this->response('s',$query);
        }else{
            $connection->rollback();
            $this->response('f', '', 'Invalid product selection.');
        }

    }

    public function add(){
        foreach ($this->request->data as $key=>$value){
            if($this->request->data[$key] == 'undefined'){
                $this->request->data[$key] = null;
            }
        }
        error_reporting(0);

        $iFKMPId = '';
        $iFkVisaCatId = '';
        $vVisaProductTitle = '';
        $payment_type = '';
        $allowapplicant = 'no';
        $allowbusiness = 'no';
        $allowfut = 'no';
        $allowfamilysponsor = 'no';
        $allowsponsorworker = 'no';
        $allowdocument = 'no';
        $allowlessons = 'no';
        $lessonpayment = 'no';
        $allowsummary = 'no';
        $allowfaq = 'no';
        $allowcoverletter = 'no';
        $allowtodo = 'no';

        if(!empty($this->request->data['iFKMPId'])){
            $iFKMPId = $this->request->data['iFKMPId'];
        }

        if($this->request->data['Pro_Features'] == 'true'){
            $Pro_Features = 'yes';
        }
        
        if(!empty($this->request->data['iFkVisaCatId'])){
            $iFkVisaCatId = $this->request->data['iFkVisaCatId'];
        }

        if(!empty($this->request->data['vVisaProductTitle'])){
            $vVisaProductTitle = $this->request->data['vVisaProductTitle'];
        }        

        if($this->request->data['allowapplicant'] == 'true'){
            $allowapplicant = 'yes';
        }

        if($this->request->data['allowbusiness'] == 'true'){
            $allowbusiness = 'yes';
        }

        if($this->request->data['allowfut'] == 'true'){
            $allowfut = 'yes';
        }

        if($this->request->data['allowfamilysponsor'] == 'true'){
            $allowfamilysponsor = 'yes';
        }

        if($this->request->data['allowsponsorworker'] == 'true'){
            $allowsponsorworker = 'yes';
        }

        if($this->request->data['allowdocument'] == 'true'){
            $allowdocument = 'yes';
        }

        if($this->request->data['allowlessons'] == 'true'){
            $allowlessons = 'yes';
        }


        if($this->request->data['lessonpayment'] == 'true'){
            $lessonpayment = 'yes';
        }

        if($this->request->data['allowsummary'] == 'true'){
            $allowsummary = 'yes';
        }

        if($this->request->data['allowfaq'] == 'true'){
            $allowfaq = 'yes';
        }

        if($this->request->data['allowcoverletter'] == 'true'){
            $allowcoverletter = 'yes';
        }

        if($this->request->data['allowtodo'] == 'true'){
            $allowtodo = 'yes';
        }

        if($iFKMPId == ''){
            $this->response('f', '', 'Please select appropriate market place.');
        }

        if($iFkVisaCatId == ''){
            $this->response('f', '', 'Please select appropriate product category.');
        }

        if($iFkVisaCatId == ''){
            $this->response('f', '', 'Please select appropriate product category.');
        }

        if($vVisaProductTitle == ''){
            $this->response('f', '', 'Product Title is required.');
        }              

        if($allowapplicant == 'no' && $allowbusiness == 'no'){
            $this->response('f', '', 'Please allow either applicant details or business details.');
        }

        if($lessonpayment == 'yes'){
            if($this->request->data['lesson_price'] == '' || $this->request->data['lesson_price'] <= 0){
                $this->response('f', '', 'Lesson price is required and must be greater than 0.');
            }
        }

        $TAGS = json_decode($this->request->data['tags']);
        if($allowdocument == 'yes'){
            foreach($TAGS as $tag){
                foreach($tag as $value){
                    if(empty($value->folder)){
                        $tag_name = $value->name;
                        $this->response('f', '', 'Please select document folder for tag: '.$tag_name);
                    }
                }
            }
        }

        $RECORDS = json_decode($this->request->data['records']);
        $LESSON_IDS = '';
        $SUMMARY_IDS = '';
        $FAQ_IDS = '';
        $CL_IDS = '';
        $TODO_IDS = '';
        if($allowlessons == 'yes'){
            if(empty($RECORDS->lessons)){
                $this->response('f', '', 'Please select lessons');
            }else{
                $LESSON_IDS = implode(',', $RECORDS->lessons);
            }
        }

        if($allowsummary == 'yes'){
            if(empty($RECORDS->summaries)){
                $this->response('f', '', 'Please select SOC');
            }else{
                $SUMMARY_IDS = implode(',', $RECORDS->summaries);
            }
        }

        if($allowfaq == 'yes'){
            if(empty($RECORDS->faq)){
                $this->response('f', '', 'Please select FAQ');
            }else{
                $FAQ_IDS = implode(',', $RECORDS->faq);
            }
        }

        if($allowcoverletter == 'yes'){
            if(empty($RECORDS->coverletters)){
                $this->response('f', '', 'Please select Cover Letters');
            }else{
                $CL_IDS = implode(',', $RECORDS->coverletters);
            }
        }

        if($allowtodo == 'yes'){
            if(empty($RECORDS->todo)){
                $this->response('f', '', 'Please select To Do list');
            }else{
                $TODO_IDS = implode(',', $RECORDS->todo);
            }
        }

        if ($this->request->is(['post']))
        {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $checkCatExist = $connection->execute("SELECT * FROM mst_visa_product WHERE eVisaProductStatus != 'deleted' AND LOWER(vVisaProductTitle)=:pkgname", ['pkgname' => strtolower($vVisaProductTitle)])->fetchAll('assoc');
            if (count($checkCatExist) == 0) {
                $connection->begin();

                try {
                    $target_dir = WWW_ROOT . 'product/';
                    $current = strtotime("now");
                    if (isset($this->request->data['productImage']['name'])) {
                        $target_file = $target_dir . basename($this->request->data['productImage']['name']);
                        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);

                        $image_name = 'product_' .$current . '_org.' . $imageFileType;
                        $image_name1 = 'product_' .$current . '_300x300.' . $imageFileType;
                        $target_file = $target_dir . $image_name;
                        Image::configure(array('driver' => 'gd'));
                        if (move_uploaded_file($this->request->data["productImage"]["tmp_name"], $target_file)) {
                            Image::make($target_file)->resize(300, 200)->save($target_dir . $image_name1);
                        } else {
                            $image_name = '';
                        }
                    }

                    if (isset($this->request->data['productVideo']['name'])) {
                        $target_video = $target_dir . basename($this->request->data['productVideo']['name']);
                        $videoFileType = pathinfo($target_video, PATHINFO_EXTENSION);

                        $video_name = 'product_' .$current . '_video.' . $videoFileType;
                        $target_video = $target_dir . $video_name;
                        if (move_uploaded_file($this->request->data["productVideo"]["tmp_name"], $target_video)) {

                        } else {
                            $video_name = '';
                        }
                    }

                    $query = $connection->insert('mst_visa_product', [
                        'vVisaProductTitle' => $vVisaProductTitle,
                        'vVisaProductDesc' => $this->request->data['vVisaProductDesc'],
                        'iFKMPId' => $iFKMPId,
                        'iFkVisaCatId' => $iFkVisaCatId,
                        'iFkLessonId' => $LESSON_IDS,
                        'iFkSummaryId' => $SUMMARY_IDS,
                        'iFkToDoId' => $TODO_IDS,
                        'iFkCoverLetterId' => $CL_IDS,
                        'iFkFAQId' => $FAQ_IDS,
                        'eVisaproductFee' => 'free',
                        'vVisaProductImage' => $image_name,
                        'vVisaProductVideo' => $video_name,
                        'eAllowApplicantDetails' => $allowapplicant,
                        'eAllowBusinessDetails' => $allowbusiness,
                        'eAllowFUT' => $allowfut,
                        'eAllowFUTsponser' => $allowfamilysponsor,
                        'eAllowSponser' => $allowsponsorworker,
                        'eAllowSummary' => $allowsummary,
                        'eAllowFaq' => $allowfaq,
                        'eAllowDocumentChecklist' => $allowdocument,
                        'eAllowToDo' => $allowtodo,
                        'Pro_Features'=>$Pro_Features,
                        'eAllowCoverLetter' => $allowcoverletter,
                        'eAllowLession' => $allowlessons,
                        'eLessionPayment' => $lessonpayment,                        
                        'dLessionsPrice' => $this->request->data['lesson_price'],
                        'eVisaProductStatus' => 'active',
                        'dtVisaProductCreatedOn' => Time::now()
                    ]);

                    $PRODUCT_ID =  $query->lastInsertId('mst_visa_product');
                    foreach($TAGS as $key=>$tag){
                        foreach($tag as $value){
                            $price = 0;
                            if(isset($value->price)){
                                $price = $value->price;
                            }
                            $tag_name = $value->name;
                            $folder = $value->folder;
                            $type = $key;
                            $connection->insert('mst_tags', [
                                'iFKProductId' => $PRODUCT_ID,
                                'vTagName' => $tag_name,
                                'iDocFolderId' => $folder,
                                'dDocPrice' => $price,
                                'applicantType' => $type
                                ]);
                        }
                    }
                    $connection->commit();
                    $this->response('s', '', 'Product has been created');
                } catch (\PDOException $e) {
                    echo $e->getMessage();
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Product Name already exist');
            }
        } else {
            $this->response('f', '', 'Invalid method selection');
        }
    }
    
    public function edit(){

        foreach ($this->request->data as $key=>$value){
            if($this->request->data[$key] == 'undefined'){
                $this->request->data[$key] = null;
            }
        }
        error_reporting(0);

        $pkgId = $this->request->data['pkgId'];
        $iFKMPId = '';
        $iFkVisaCatId = '';
        $vVisaProductTitle = '';
        $payment_type = '';
        $allowapplicant = 'no';
        $allowbusiness = 'no';
        $allowfut = 'no';
        $allowfamilysponsor = 'no';
        $allowsponsorworker = 'no';
        $allowdocument = 'no';
        $allowlessons = 'no';
        $lessonpayment = 'no';
        $allowsummary = 'no';
        $allowfaq = 'no';
        $allowcoverletter = 'no';
        $allowtodo = 'no';

        if(!empty($this->request->data['iFKMPId'])){
            $iFKMPId = $this->request->data['iFKMPId'];
        }
        
        if($this->request->data['Pro_Features'] == 'true'){
            $Pro_Features = 'yes';
        }
        if(!empty($this->request->data['iFkVisaCatId'])){
            $iFkVisaCatId = $this->request->data['iFkVisaCatId'];
        }

        if(!empty($this->request->data['vVisaProductTitle'])){
            $vVisaProductTitle = $this->request->data['vVisaProductTitle'];
        }        

        if($this->request->data['allowapplicant'] == 'true'){
            $allowapplicant = 'yes';
        }

        if($this->request->data['allowbusiness'] == 'true'){
            $allowbusiness = 'yes';
        }

        if($this->request->data['allowfut'] == 'true'){
            $allowfut = 'yes';
        }

        if($this->request->data['allowfamilysponsor'] == 'true'){
            $allowfamilysponsor = 'yes';
        }

        if($this->request->data['allowsponsorworker'] == 'true'){
            $allowsponsorworker = 'yes';
        }

        if($this->request->data['allowdocument'] == 'true'){
            $allowdocument = 'yes';
        }

        if($this->request->data['allowlessons'] == 'true'){
            $allowlessons = 'yes';
        }


        if($this->request->data['lessonpayment'] == 'true'){
            $lessonpayment = 'yes';
        }

        if($this->request->data['allowsummary'] == 'true'){
            $allowsummary = 'yes';
        }

        if($this->request->data['allowfaq'] == 'true'){
            $allowfaq = 'yes';
        }

        if($this->request->data['allowcoverletter'] == 'true'){
            $allowcoverletter = 'yes';
        }

        if($this->request->data['allowtodo'] == 'true'){
            $allowtodo = 'yes';
        }

        if($iFKMPId == ''){
            $this->response('f', '', 'Please select appropriate market place.');
        }

        if($iFkVisaCatId == ''){
            $this->response('f', '', 'Please select appropriate product category.');
        }

        if($iFkVisaCatId == ''){
            $this->response('f', '', 'Please select appropriate product category.');
        }

        if($vVisaProductTitle == ''){
            $this->response('f', '', 'Product Title is required.');
        }        

        if($allowapplicant == 'no' && $allowbusiness == 'no'){
            $this->response('f', '', 'Please allow either applicant details or business details.');
        }

        if($lessonpayment == 'yes'){
            if($this->request->data['lesson_price'] == '' || $this->request->data['lesson_price'] <= 0){
                $this->response('f', '', 'Lesson price is required and must be greater than 0.');
            }
        }

        $TAGS = json_decode($this->request->data['tags']);
        if($allowdocument == 'yes'){
            foreach($TAGS as $tag){
                foreach($tag as $value){
                    if(empty($value->folder)){
                        $tag_name = $value->name;
                        $this->response('f', '', 'Please select document folder for tag: '.$tag_name);
                    }
                }
            }
        }

        $RECORDS = json_decode($this->request->data['records']);
        $LESSON_IDS = '';
        $SUMMARY_IDS = '';
        $FAQ_IDS = '';
        $CL_IDS = '';
        $TODO_IDS = '';
        if($allowlessons == 'yes'){
            if(empty($RECORDS->lessons)){
                $this->response('f', '', 'Please select lessons');
            }else{
                $LESSON_IDS = implode(',', $RECORDS->lessons);
            }
        }

        if($allowsummary == 'yes'){
            if(empty($RECORDS->summaries)){
                $this->response('f', '', 'Please select SOC');
            }else{
                $SUMMARY_IDS = implode(',', $RECORDS->summaries);
            }
        }

        if($allowfaq == 'yes'){
            if(empty($RECORDS->faq)){
                $this->response('f', '', 'Please select FAQ');
            }else{
                $FAQ_IDS = implode(',', $RECORDS->faq);
            }
        }

        if($allowcoverletter == 'yes'){
            if(empty($RECORDS->coverletters)){
                $this->response('f', '', 'Please select Cover Letters');
            }else{
                $CL_IDS = implode(',', $RECORDS->coverletters);
            }
        }

        if($allowtodo == 'yes'){
            if(empty($RECORDS->todo)){
                $this->response('f', '', 'Please select To Do list');
            }else{
                $TODO_IDS = implode(',', $RECORDS->todo);
            }
        }

        if ($this->request->is(['post'])) {

            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $checkCatExist = $connection->execute("SELECT * FROM mst_visa_product WHERE  LOWER(vVisaProductTitle)=:pkgname AND iPkVisaProductId!=:pkgid", ['pkgname' => strtolower($vVisaProductTitle),'pkgid' => $pkgId])->fetchAll('assoc');
            if (count($checkCatExist) == 0) {
                $connection->begin();
                try {
                    $target_dir = WWW_ROOT . 'product/';
                    $current = strtotime("now");
                    if (isset($this->request->data['productImage']['name'])) {
                        $target_file = $target_dir . basename($this->request->data['productImage']['name']);
                        $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);

                        $image_name = 'product_' .$current . '_org.' . $imageFileType;
                        $image_name1 = 'product_' .$current . '_300x300.' . $imageFileType;
                        $target_file = $target_dir . $image_name;
                        Image::configure(array('driver' => 'gd'));
                        if (move_uploaded_file($this->request->data["productImage"]["tmp_name"], $target_file)) {
                            if (file_exists($target_dir . $this->request->data['product_img_name'])) {
                                unlink($target_dir . $this->request->data['product_img_name']);
                                unlink($target_dir . str_replace("org", "300x300", $this->request->data['product_img_name']));
                            }
                            Image::make($target_file)->resize(300, 200)->save($target_dir . $image_name1);
                        }else{
                            $image_name = $this->request->data['product_img_name'];
                        }
                    } else {
                        $image_name = $this->request->data['product_img_name'];
                    }

                    if (isset($this->request->data['productVideo']['name'])) {
                        $target_video = $target_dir . basename($this->request->data['productVideo']['name']);
                        $videoFileType = pathinfo($target_video, PATHINFO_EXTENSION);

                        $video_name = 'product_' .$current . '_video.' . $videoFileType;
                        $target_video = $target_dir . $video_name;
                        if (move_uploaded_file($this->request->data["productVideo"]["tmp_name"], $target_video)) {
                            if (file_exists($target_dir . $this->request->data['product_video_name'])) {
                                unlink($target_dir . $this->request->data['product_video_name']);
                            }
                        }else{
                            $video_name = $this->request->data['product_video_name'];
                        }
                    } else {
                        $video_name = $this->request->data['product_video_name'];
                    }

                    $query = $connection->update('mst_visa_product', [
                        'vVisaProductTitle' => $vVisaProductTitle,
                        'vVisaProductDesc' => $this->request->data['vVisaProductDesc'],
                        'iFKMPId' => $iFKMPId,
                        'iFkVisaCatId' => $iFkVisaCatId,
                        'iFkLessonId' => $LESSON_IDS,
                        'iFkSummaryId' => $SUMMARY_IDS,
                        'iFkToDoId' => $TODO_IDS,
                        'iFkCoverLetterId' => $CL_IDS,
                        'iFkFAQId' => $FAQ_IDS,
                        'eVisaproductFee' => 'free',
                        'vVisaProductImage' => $image_name,
                        'vVisaProductVideo' => $video_name,
                        'eAllowApplicantDetails' => $allowapplicant,
                        'eAllowBusinessDetails' => $allowbusiness,
                        'eAllowFUT' => $allowfut,
                        'eAllowFUTsponser' => $allowfamilysponsor,
                        'eAllowSponser' => $allowsponsorworker,
                        'eAllowSummary' => $allowsummary,
                        'eAllowFaq' => $allowfaq,
                        'eAllowDocumentChecklist' => $allowdocument,
                        'eAllowToDo' => $allowtodo,
                        'Pro_Features'=>$Pro_Features,
                        'eAllowCoverLetter' => $allowcoverletter,
                        'eAllowLession' => $allowlessons,
                        'eLessionPayment' => $lessonpayment,                        
                        'dLessionsPrice' => $this->request->data['lesson_price'],
                        'eVisaProductStatus' => 'active',
                        'dtVisaProductUpdatedOn' => Time::now()],['iPkVisaProductId' => $pkgId]);

                    $tags = $connection->execute("SELECT * FROM mst_tags where iFKProductId=:pkgid",['pkgid' => $pkgId])->fetchAll('assoc');

                    $EXIST_TAGS = [];
                    foreach($tags as $tag){
                        $EXIST_TAGS[] = $tag['iPKTagId'];
                    }

                    $ADD_TAGS = [];
                    foreach($TAGS as $key=>$tag){
                        foreach($tag as $value){
                            $price = 0;
                            if(isset($value->price)){
                                $price = $value->price;
                            }
                            $tag_name = $value->name;
                            $folder = $value->folder;
                            $type = $key;
                            if(!isset($value->tag_id)){
                                $connection->insert('mst_tags', [
                                    'iFKProductId' => $pkgId,
                                    'vTagName' => $tag_name,
                                    'iDocFolderId' => $folder,
                                    'dDocPrice' => $price,
                                    'applicantType' => $type
                                ]);
                            }else{
                                $ADD_TAGS[] = $value->tag_id;
                                $connection->update('mst_tags', [
                                    'iFKProductId' => $pkgId,
                                    'vTagName' => $tag_name,
                                    'iDocFolderId' => $folder,
                                    'dDocPrice' => $price,
                                    'applicantType' => $type
                                ],['iPKTagId' => $value->tag_id]);
                            }
                        }
                    }
                    $DELETE_TAGS = array_diff($EXIST_TAGS,$ADD_TAGS);
                    if(!empty($DELETE_TAGS)){
                        $connection->query("DELETE FROM `mst_tags` WHERE iPKTagId IN (".implode(',',$DELETE_TAGS).")")->execute();
                    }
                    $connection->commit();
                    $this->response('s', '', 'Product has been updated');
                } catch (\PDOException $e) {
                    $connection->rollback();
                    $this->response('f', '', $e);
                }
            } else {
                $this->response('f', '', 'Product Name already exist');
            }
        } else {
            $this->response('f', '', 'Invalid method');
        }
    }

    public function changeStatus(){
        if(isset($this->request->data['productId'])){
            $id = $this->request->data['productId'];
            $msg = 'activated';
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
                $msg = 'inactivated';
            }else{
                $status = 'active';
            }
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $query = $connection->update('mst_visa_product', ['eVisaProductStatus' => $status],['iPkVisaProductId' => $id]);
                $connection->commit();
                $this->response('s', '', 'Product has been '.$msg.' successfully.');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        }else{
            $this->response('f', '', 'Incomplete parameter');
        }
    }

    public function changevisiblity(){
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
                $query = $connection->update('mst_visa_product', [
                    'is_Visible' => $status,
                ],['iPkVisaProductId' => $id]);
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
        if(isset($this->request->data['productIds'])){
            $ids = $this->request->data['productIds'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
                $msg = 'inactivated';
            }else{
                $status = 'active';
                $msg = 'activated';
            }

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE `mst_visa_product` SET `eVisaProductStatus` = '".$status."' WHERE iPkVisaProductId IN (".implode(',',$ids).")")->execute();
                    $connection->commit();
                    $this->response('s','', 'Products has been '.$msg.'.');
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
        if (isset($this->request->data['productId'])) {
            $id = $this->request->data['productId'];
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $connection->begin();
                $checkuserProduct = $connection->execute("SELECT * FROM user_products where iFkVisaProductId=$id")->fetchAll('assoc');
                //echo "<pre>"; print_r($checkuserProduct); exit;
                if(!empty($checkuserProduct) || count($checkuserProduct) > 0){
                    $this->response('f', '', 'You can not Delete this Product. Because Some Users are Using this');
                }else{
                    try {
                        $status = 'deleted';
                        $connection->update('mst_visa_product', ['eVisaProductStatus' => $status],['iPkVisaProductId' => $id]);
                        $connection->commit();
                        $this->response('s', '', 'Product has been deleted.');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                }

            }else{
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function deleteAll(){
        if(isset($this->request->data['productIds'])){
            $ids = $this->request->data['productIds'];

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $status = 'deleted';
                    $connection->query("UPDATE `mst_visa_product` SET `eVisaProductStatus` = '".$status."' WHERE iPkVisaProductId IN (".implode(',',$ids).")")->execute();
                    $connection->commit();
                    $this->response('s', '', 'Products has been deleted.');
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

    public function front_getPackage()
    {
        $connection = ConnectionManager::get('default');
        if ($this->request->is(['GET'])) {
            $query = $connection->execute("select * from mst_visa_product ")->fetchAll('assoc');
            $this->response('s', $query);
        }
    }
    public function getCategory(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM mst_visa_category where eVisaCatStatus = 'active'")->fetchAll('assoc');
        $this->response('s', $query);
    }
}
