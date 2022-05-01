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

class PostController extends AppController{

    public function front_AdPost($uid)
    {
        $connection = ConnectionManager::get('default');

        if (!empty($this->request->data['vPostTitle']))
            $vPostTitle = $this->request->data['vPostTitle'];

        if (!empty($this->request->data['vPostDescription']))
            $vPostDescription = $this->request->data['vPostDescription'];

        if (!empty($this->request->data['vAdPrice']))
            $vAdPrice = $this->request->data['vAdPrice'];

        if (!empty($this->request->data['vUsersAdWebsiteLink']))
            $vUsersAdWebsiteLink = $this->request->data['vUsersAdWebsiteLink'];

        if (!empty($this->request->data['iFkUserPackMapId']))
            $iFkUserPackMapId = $this->request->data['iFkUserPackMapId'];

        if (!empty($this->request->data['geometry_data']))
            $geometry_data = $this->request->data['geometry_data'];

            $area = split(' ', $geometry_data);

            $lat = str_replace('(','',$area[1]);
            $lng = str_replace(')','',$area[2]);


            $geometry_data1 = "POINT('.$lat.','.$lng.')";



        if (!empty($this->request->data['geometry_type']))
            $geometry_type = $this->request->data['geometry_type'];

        if (!empty($this->request->data['geometry_radius']))
            $geometry_radius = $this->request->data['geometry_radius'];

        //print_r($geometry_data);exit;


        //echo "insert into tbl_users_ad_posts values($iFkUserPackMapId,'$vUsersAdWebsiteLink',$vAdPrice,'active','$geometry_type',POINT({$lat},{$lng}),$geometry_radius)";
        //exit;

        if($uid)
        {
            $posttype = 'user';
            $adid = '1';
        }

        if (isset($this->request->data['vPostMediaPath']['name'])) {

            $target_dir = WWW_ROOT . 'img/post/';
            $target_file = $target_dir . basename($this->request->data['vPostMediaPath']['name']);
            $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
            $current = strtotime("now");

            $image_name = $current . '.' . $imageFileType;
            $target_file = $target_dir . $image_name;

            if (move_uploaded_file($this->request->data["vPostMediaPath"]["tmp_name"], $target_file)) {
                $image_info = getimagesize($target_file);
                $image_width = $image_info[0];
                $image_height = $image_info[1];

                if ($image_width < 191 || $image_height < 150) {
                    $this->response('e');
                } else {

                    require_once(ROOT . DS . "src" . DS . "Controller" . DS . "resize-class.php");

                    $resizeObj = new resize($target_file);

                    $resizeObj->resizeImage(191, 150, 'crop');
                    $resizeObj->saveImage($target_file, 100);
                    $uploadOk = 1;
                }
            } else {
                $image_name = 'default_user.png';
                $uploadOk = 0;
            }
        } else {
            $image_name = 'default_user.png';
            $uploadOk = 1;
        }

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            try {
                $query = $connection->insert('tbl_users_posts',[
                    'iFkPropertyId' => null,
                    'iFkGroupId' => null,
                    'iFkUserId' => $uid,
                    'iFkCatId' => null,
                    'ePostType' => $posttype,
                    'vPostTitle' => $vPostTitle,
                    'vPostDescription' => $vPostDescription,
                    'dtPostDate' => Time::now(),
                    'eIsAd' => $adid,
                    'vUsersAdWebsiteLink' =>$vUsersAdWebsiteLink ]);

                $connection->commit();

                $last_id = $connection->execute("SELECT LAST_INSERT_ID()")->fetchAll('assoc');
                $lastID = $last_id[0]['LAST_INSERT_ID()'];

                $query1 = $connection->insert('tbl_users_ad_posts',[
                    'iFkPostId' => $lastID,
                    'iFkPackId' => $iFkUserPackMapId,
                    'vUsersAdWebsiteLink' => $vUsersAdWebsiteLink,
                    'vAdPrice' => $vAdPrice,
                    'eUsersAdStatus' => 'active',
                    'eMarkType' => $geometry_type,
                    'vMarkGeometrylat' => $lat,
                    'vMarkGeometrylng' => $lng,
                    'vMarkRadius' => $geometry_radius ]);

                //$query1 = $connection->execute("INSERT INTO tbl_users_ad_posts(iFkPostId,iFkPackId,vUsersAdWebsiteLink,vAdPrice,eUsersAdStatus,eMarkType,vMarkGeometry,vMarkRadius) VALUES($lastID,$iFkUserPackMapId,'$vUsersAdWebsiteLink',$vAdPrice,'active','$geometry_type','GeomFromText(POINT(' . $lat . "," . $lng . ')',$geometry_radius)");

                if($imageFileType == 'jpg' || $imageFileType == 'jpeg' || $imageFileType == 'gif' ||  $imageFileType == 'bmp') {
                    $imageFileType = 'image';
                } else {
                    $imageFileType = 'video';
                }

                $query2 = $connection->insert('users_posts_media',[
                    'iFkPostId' => $lastID,
                    'vPostMediaPath' => $image_name,
                    'ePostMediaFileType' => $imageFileType ]);

                $this->response('s','','Ad added successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        }
    }
}
