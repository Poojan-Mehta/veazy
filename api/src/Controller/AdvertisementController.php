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

class AdvertisementController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  tbl_users_posts ORDER BY iPkPostId DESC ")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function view(){
        $id = '';

        if (!empty($this->request->query['id']))
            $id = $this->request->query['id'];

        if($id == ''){
            $this->response('s','','Incomplete Parameter');
        }
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM  tbl_users_posts where iPkPostId=:adtid",['adtid' => $id])->fetch('assoc');
        $this->response('s',$query);
    }

    public function add(){

        if (!empty($this->request->data['postTitle']))
            $vPostTitle = $this->request->data['postTitle'];
        if (!empty($this->request->data['postDesc']))
            $vPostDescription = $this->request->data['postDesc'];
        if (!empty($this->request->data['webURL']))
            $vUsersAdWebsiteLink = $this->request->data['webURL'];

            $userId = $this->request->data['aid'];
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $checkAdtExist = $connection->execute("SELECT * FROM tbl_users_posts WHERE  LOWER(vPostTitle)=:postname", ['postname' => strtolower($vPostTitle)])->fetchAll('assoc');
                if (count($checkAdtExist) == 0) {
                    $connection->begin();
                    try {
                        $query = $connection->insert('tbl_users_posts', [
                            'vPostTitle' => $vPostTitle,
                            'vPostDescription' => $vPostDescription,
                            'vUsersAdWebsiteLink' => $vUsersAdWebsiteLink,
                            'iFkUserId' => $userId,
                            'ePostType' => 'admin',
                            'eIsAd' => '1',
                            'dtPostDate' => Time::now()]);
                        $connection->commit();
                        $this->response('s', '', 'Advertisement added successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                } else {
                    $this->response('f', '', 'Advertisement Title already exist');
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
    }
    
    public function edit(){
        $vPostTitle = '';
        $vPostDescription = '';
        $adtId = '';

        if (!empty($this->request->data['adtId']))
            $adtId = $this->request->data['adtId'];

        if (!empty($this->request->data['postTitle']))
            $vPostTitle = $this->request->data['postTitle'];

        if (!empty($this->request->data['postDesc']))
            $vPostDescription = $this->request->data['postDesc'];

        if (!empty($this->request->data['webURL']))
            $vUsersAdWebsiteLink = $this->request->data['webURL'];

        if($adtId == '' || $vPostTitle == ''){
            $this->response('s','','Incomplete Parameter');
        }
        //$userId = $this->request->data['aid'];

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $checkAdtExist = $connection->execute("SELECT * FROM tbl_users_posts WHERE  LOWER(vPostTitle)=:posttitle AND iPkPostId!=:adtid", ['posttitle' => strtolower($vPostTitle),'adtid' => $adtId])->fetchAll('assoc');
            if (count($checkAdtExist) == 0) {
                $connection->begin();
                try {
                    $query = $connection->update('tbl_users_posts', [
                        'vPostTitle' => $vPostTitle,
                        'vPostDescription' => $vPostDescription,
                        'vUsersAdWebsiteLink' => $vUsersAdWebsiteLink ],
                        ['iPkPostId' => $adtId]);
                    $connection->commit();
                    $this->response('s', '', 'Advertisement updated successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Advertisement Name already exist');
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
                $query = $connection->update('tbl_mst_category', [
                    'eCatStatus' => $status,
                    'iLogUserid' => $userId,
                    'dtModifyDate' => Time::now()],['iPkCatId' => $id]);
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
                    $connection->query("UPDATE `tbl_users_posts` SET `eCatStatus` = '".$status."',`iLogUserid` = $userId,`dtModifyDate` = now() WHERE iPkCatId IN (".implode(',',$ids).")")->execute();
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
                    $connection->query("DELETE FROM `tbl_users_posts` WHERE iPkPostId=".$id)->execute();
                    $connection->commit();
                    $this->response('s', '', 'Advertisement deleted successfully');
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
            //$userId = $this->request->data['aid'];

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("DELETE FROM `tbl_users_posts` WHERE iPkPostId IN (".implode(',',$ids).")")->execute();
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

    public function front_getAdinarea()
    {
        $connection = ConnectionManager::get('default');
        $user = $this->request->query['user'];
        $page = 1;
        if (!empty($this->request->query['page'])) {
            $page = $this->request->query['page'];
        }

        $start = ($page - 1) * 12;
        if ($start < 0) $start = 0;

        $rad = $connection->execute("SELECT * FROM tbl_genral_setting")->fetch('assoc');
        $radious = $rad['iSettingMapCircleRadius'];

        $userlatlong = $connection->execute("SELECT * FROM tbl_user_master WHERE iUserId = $user")->fetch('assoc');

        $dLongitude = $userlatlong['vLongitude'];
        $dLatitude = $userlatlong['vLatitude'];

        $query = $connection->execute("SELECT uap.*,upm.*,up.*,um.*, (6371 * acos (cos ( radians($dLatitude) ) * cos( radians( vMarkGeometrylat ) )
                  * cos( radians( vMarkGeometrylng ) - radians($dLongitude) ) + sin ( radians($dLatitude) ) * sin( radians( vMarkGeometrylat ) ) ) ) AS distance
FROM tbl_user_master as um
left join  tbl_users_posts as up ON up.iFkUserId = um.iUserId
left join tbl_users_ad_posts as uap ON uap.iFkPostId = up.iPkPostId
left join users_posts_media as upm ON upm.iFkPostId = uap.iFkPostId
HAVING distance <= $radious AND uap.eUsersAdStatus ='active' AND uap.eMarkType != ''
ORDER BY distance ASC limit $start,12")->fetchAll('assoc');

        for($i=0;$i<count($query);$i++){
            $query[$i]['dtPostDate'] = $this->humanTiming(strtotime($query[$i]['dtPostDate'])) . ' ago';
        }
        $this->response('s', $query);
    }

    public function front_getAddetail($adid)
    {
        $connection = ConnectionManager::get('default');
        $addetail = $connection->execute("select uap.*,up.*,um.*,upm.*,tc.* from tbl_users_ad_posts as uap 
left join  tbl_users_posts as up ON up.iPkPostId = uap.iFkPostId
left join  tbl_user_master as um ON um.iUserId = up.iFkUserId
left join  users_posts_media as upm ON upm.iFkPostId = up.iPkPostId
left join tbl_city as tc ON tc.iCityId = um.vCity
where uap.iPkUsersAdId = $adid ")->fetch('assoc');

        $addetail['dtPostDate'] = $this->humanTiming(strtotime($addetail['dtPostDate'])) . ' ago';

        $this->response('s', $addetail);
    }

    public function front_AddUserlikes()
    {
        $connection = ConnectionManager::get('default');

        $postid = '';
        $userid = '';

        if (!empty($this->request->data['postid']))
            $postid = $this->request->data['postid'];

        if (!empty($this->request->data['userid']))
            $userid = $this->request->data['userid'];

        $checklike = $connection->execute("SELECT count(*) as cnt FROM users_likes where iFkUserId = '$userid' and iFkPostId ='$postid' ")->fetch('assoc');

        if($checklike['cnt'] == 0) {
            if ($this->request->is(['post'])) {
                try {
                    $query = $connection->insert('users_likes', [
                        'iFkUserId' => $userid,
                        'iFkPostId' => $postid ]);
                    $connection->commit();
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }

        } else {

            $this->response('f', '', 'You have Successfully liked this Post');
        }
    }

    public function front_getUserlikes($adid)
    {
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select * from users_likes where iFkPostId = $adid " )->fetchAll('assoc');

        $this->response('s', count($query));
    }


    public function front_AddUsercomments()
    {
        $connection = ConnectionManager::get('default');

        $postid = '';
        $userid = '';

        if (!empty($this->request->data['postid']))
            $postid = $this->request->data['postid'];

        if (!empty($this->request->data['userid']))
            $userid = $this->request->data['userid'];

        if (empty($this->request->data['vCommentText']))
        {
            $this->response('f', '', 'Please Enter Comment..');
        }
            $reply = $this->request->data['vCommentText'];


        //$checklike = $connection->execute("SELECT count(*) as cnt FROM users_comment where iFkUserId = '$userid' and iFkPostId ='$postid' ")->fetch('assoc');

       // if($checklike['cnt'] == 0) {
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                try {
                    $query = $connection->insert('users_comment', [
                        'iFkUserId' => $userid,
                        'iFkPostId' => $postid,
                        'vCommentText' => $reply,
                        'iCommentTime' => Time::now() ]);
                    $connection->commit();
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
       // } else {

       //     $this->response('f', '', 'You have Successfully Commented in this Post');
        }

    public function front_getUsercomments()
    {
        $connection = ConnectionManager::get('default');
        $adid = $this->request->query['adid'];
        $page = 1;

        if (!empty($this->request->query['page'])) {
            $page = $this->request->query['page'];
        }

        $start = ($page - 1) * 10;
        if ($start < 0) $start = 0;

        $query = $connection->execute("select uc.*,um.*,tc.* from users_comment as uc
left join tbl_user_master as um ON um.iUserId = uc.iFkUserId 
left join tbl_city as tc ON tc.iCityId = um.vCity
where iFkPostId = $adid ORDER BY iPkCommentId DESC limit $start,10")->fetchAll('assoc');

        for($i=0;$i<count($query);$i++){
            $query[$i]['iCommentTime'] = $this->humanTiming(strtotime($query[$i]['iCommentTime'])) . ' ago';
        }
        $this->response('s', $query);
    }

    public function front_getGlobalads()
    {
        $connection = ConnectionManager::get('default');
        $user = $this->request->query['user'];
        $page = 1;
        if (!empty($this->request->query['page'])) {
            $page = $this->request->query['page'];
        }

        $start = ($page - 1) * 12;
        if ($start < 0) $start = 0;

        /*$query = $connection->execute("SELECT uap.*,upm.*,up.*,um.*
FROM tbl_user_master as um
left join  tbl_users_posts as up ON up.iFkUserId = um.iUserId
left join tbl_users_ad_posts as uap ON uap.iFkPostId = up.iPkPostId
left join users_posts_media as upm ON upm.iFkPostId = uap.iFkPostId
where uap.eUsersAdStatus ='active' AND uap.eMarkType != ''
ORDER BY iPkUsersAdId DESC limit $start,12")->fetchAll('assoc');*/
        $query = $connection->execute("SELECT up.*,uap.*,upm.*,um.* FROM tbl_users_posts as up
left join  tbl_users_ad_posts as uap ON uap.iFkPostId = up.iPkPostId
left join users_posts_media as upm ON upm.iFkPostId = uap.iFkPostId
left join tbl_user_master as um ON um.iUserId = up.iFkUserId
where vPostStatus = 'active' AND eIsAd = '1' AND uap.eMarkType != '' AND up.iFkuserId NOT IN($user)
ORDER BY uap.iFkPostId DESC limit $start,12")->fetchAll('assoc');

        /*$query = $connection->execute("SELECT up.*,uap.*,upm.* FROM tbl_users_posts as up
left join  tbl_users_ad_posts as uap ON uap.iFkPostId = up.iPkPostId
left join users_posts_media as upm ON upm.iFkPostId = uap.iFkPostId
where vPostStatus = 'active' AND eIsAd = '1' AND uap.eMarkType != '' AND up.iFkuserId NOT IN($user);
ORDER BY up.iFkPostId DESC limit $start,12 ")->fetchAll('assoc');*/

        for($i=0;$i<count($query);$i++){
            $query[$i]['dtPostDate'] = $this->humanTiming(strtotime($query[$i]['dtPostDate'])) . ' ago';
        }
        $this->response('s', $query);
    }

    public function front_getCoveredUsers()
    {
        $connection = ConnectionManager::get('default');
        $adid = $this->request->query['adid'];
        $page = 1;

        if (!empty($this->request->query['geometry_data'])) {
            $geometry_data = $this->request->query['geometry_data'];
            $area = split(' ', $geometry_data);

            $lat = str_replace('(','',$area[1]);
            $lng = str_replace(')','',$area[2]);

        }

        if (!empty($this->request->query['geometry_type'])) {
            $geometry_typea = $this->request->query['geometry_type'];
        }
        if (!empty($this->request->query['geometry_radius'])) {
            $geometry_radius = $this->request->query['geometry_radius'];
            $geometry_radius = $geometry_radius / 1000;
        }

        $query = $connection->execute("SELECT um.*,(6371 * acos (cos ( radians($lat) ) * cos( radians( vLatitude ) )
                  * cos( radians( vLongitude ) - radians($lng) ) + sin ( radians($lat) ) * sin( radians( vLatitude ) ) ) ) AS distance
FROM tbl_user_master as um
HAVING distance <= $geometry_radius
ORDER BY distance ASC")->fetchAll('assoc');

        $this->response('s', count($query));
    }

}
