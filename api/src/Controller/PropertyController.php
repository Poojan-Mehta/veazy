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

class PropertyController extends AppController
{

    public function initialize()
    {
        $this->loadComponent('RequestHandler');
    }

    public function index()
    {
        //error_reporting(0);

        $connection = ConnectionManager::get('default');
        if ($this->request->data['type'] == 'verified') {
            $where = "where op.vReqStatus='verified'";
        } else if ($this->request->data['type'] == 'rejected') {
            $where = "where op.vReqStatus='rejected'";
        } else if ($this->request->data['type'] == 'pending') {
            $where = "where op.vReqStatus='pending'";
        } else {
            $where = "";
        }
        $query = $connection->execute("SELECT op.*,pt.vPropertyTypeName FROM  property as op left join property_type as pt on pt.iPkPropertyTypeId=op.iFkPropertyTypeId $where ORDER BY op.iPkPropertyId DESC ")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function view()
    {
        $id = '';

        if (!empty($this->request->query['id']))
            $id = $this->request->query['id'];

        if ($id == '') {
            $this->response('s', '', 'Incomplete Parameter');
        }
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT op.*,pt.vPropertyTypeName FROM  property as op 
                                      left join property_type as pt on pt.iPkPropertyTypeId = op.iFkPropertyTypeId
                                      where op.iPkPropertyId = '$id'")->fetch('assoc');
        $this->response('s', $query);
    }

    public function view1()
    {
        $id = '';

        if (!empty($this->request->query['id']))
            $id = $this->request->query['id'];

        if ($id == '') {
            $this->response('s', '', 'Incomplete Parameter');
        }
        $connection = ConnectionManager::get('default');

        /*$query = $connection->execute("SELECT op.*,pt.vPropertyTypeName FROM  property as op
                                      left join property_type as pt on pt.iPkPropertyTypeId=op.iFkPropertyTypeId
                                      left join property_media as pm on pm.iFkPropertyId=op.iPkPropertyId
                                      where iPkPropertyId=:propertyid",['propertyid' => $id])->fetch('assoc');*/
        $query = $connection->execute("select * from property_media where iFkPropertyId = '$id'")->fetchAll('assoc');

        $this->response('s', $query);
    }


    public function changeStatus()
    {
        if (isset($this->request->data['statusId'])) {
            $id = $this->request->data['statusId'];
            $userId = $this->request->data['aid'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            } else {
                $status = 'active';
            }
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $query = $connection->update('property', [
                    'ePropertyStatusV' => $status,
                ], ['iPkPropertyId' => $id]);
                $connection->commit();
                $this->response('s', '', 'Status change successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        } else {
            $this->response('f', '', 'Incomplete parameter');
        }
    }

    public function changeReqStatus()
    {
        if (isset($this->request->data['statusId'])) {
            $id = $this->request->data['statusId'];
            $userId = $this->request->data['aid'];
            if ($this->request->data['reqstatus'] == 'rejected') {
                $status = 'rejected';
            } else {
                $status = 'verified';
            }
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $query = $connection->update('property', [
                    'vReqStatus' => $status,
                ], ['iPkPropertyId' => $id]);
                $connection->commit();
                $this->response('s', '', 'Status change successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        } else {
            $this->response('f', '', 'Incomplete parameter');
        }
    }

    public function changeStatusAll()
    {
        if (isset($this->request->data['selectedIds'])) {
            $ids = $this->request->data['selectedIds'];
            $userId = $this->request->data['aid'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            } else {
                $status = 'active';
            }

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE `property` SET `ePropertyStatusV` = '" . $status . "' WHERE iPkPropertyId IN (" . implode(',', $ids) . ")")->execute();
                    $connection->commit();
                    $this->response('s');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function verifyAll()
    {
        if (isset($this->request->data['selectedIds'])) {
            $ids = $this->request->data['selectedIds'];
            $userId = $this->request->data['aid'];
            if ($this->request->data['status'] == 'verified') {
                $status = 'rejected';
            } else {
                $status = 'verified';
            }

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE `property` SET `vReqStatus` = '" . $status . "' WHERE iPkPropertyId IN (" . implode(',', $ids) . ")")->execute();
                    $connection->commit();
                    $this->response('s');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function delete()
    {
        if (isset($this->request->data['deleteId'])) {
            $id = $this->request->data['deleteId'];
            $userId = $this->request->data['aid'];
            if ($this->request->is(['post'])) {
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("DELETE FROM `property` WHERE iPkPropertyId=" . $id)->execute();
                    $connection->commit();
                    $this->response('s', '', 'Property deleted successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function deleteAll()
    {
        if (isset($this->request->data['deleteIds'])) {
            $ids = $this->request->data['deleteIds'];
            //$userId = $this->request->data['aid'];

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("DELETE FROM `property` WHERE iPkPropertyId IN (" . implode(',', $ids) . ")")->execute();
                    $connection->commit();
                    $this->response('s');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Invalid method');
            }
        }
    }

    public function front_getPropertybyid()
    {
        $connection = ConnectionManager::get('default');
        if ($this->request->is(['post'])) {
            $property_id=$this->request->data['Propertyid'];

            $query = $connection->execute("SELECT
                                                p.*,group_concat(`iFkPropertyAmenitieId` separator ',') as Amenities
                                           FROM
                                                property as p
                                                join property_amenities_relations as par on par.iFkPropertyid=p.iPkPropertyId
                                           WHERE
                                                iPkPropertyId = " . $property_id)->fetch('assoc');

            $images = $connection->execute("SELECT iPkPropertyMediaId,vPropertyImage FROM property_media WHERE iFkPropertyId = ".$property_id)->fetchAll('assoc');
            /*foreach($images as $k=>$v){
               // $images[$k]=WWW_ROOT.'img'.DS.'property'.DS.$v['vPropertyImage'];
                  $images[$k]=$v['vPropertyImage'];
            }*/

            $query['images']=$images;
            return $query;
        }
    }
    public function front_getPropertyPreview(){
        $connection = ConnectionManager::get('default');
        if ($this->request->is(['post'])) {
            $property_id=$this->request->data['Propertyid'];

            $query = $connection->execute("SELECT
                                                p.*,group_concat(`iFkPropertyAmenitieId` separator ',') as Amenities,tum.vUsername,tum.vFirstName,tum.vLastName,tum.vEmail,tum.vMobile
                                           FROM
                                                property as p
                                                join property_amenities_relations as par on par.iFkPropertyid=p.iPkPropertyId
                                                join tbl_user_master as tum on tum.iUserId=p.iFkUserId
                                           WHERE
                                                iPkPropertyId = " . $property_id)->fetch('assoc');

            $images = $connection->execute("SELECT iPkPropertyMediaId,vPropertyImage FROM property_media WHERE iFkPropertyId = ".$property_id)->fetchAll('assoc');

            $query['images']=$images;
            return $query;
        }
    }
    public function front_contact_to_property_owner()
    {
        if($this->request->is(['post'])){
            $property_owner_id=$this->request->data['propertyownerid'];
            $name=$this->request->data['name'];
            $phone=$this->request->data['phone'];
            $email=$this->request->data['email'];
            $message=$this->request->data['message'];
            $message.= '<br>Name : '.$name.'<br>Phone : '.$phone.'<br> Email : '.$email;
            $this->sendOTP($property_owner_id, 'Message from '.$name, $message, '', 'both');
            $this->response('s','', 'Message has sent to owner');
        }
    }
    public function check_property_data($data)
    {
        if($data['iFkPropertyTypeId']=='4'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' residential land';
        }else if($data['iFkPropertyTypeId']=='5'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' residential plote';
        }else if($data['iFkPropertyTypeId']=='6'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' Commercial plote';
        }else if($data['iFkPropertyTypeId']=='8'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' office';
        }else if($data['iFkPropertyTypeId']=='9'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' layout(group of ploats)';
        }else if($data['iFkPropertyTypeId']=='10'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' agriculture farm';
        }else if($data['iFkPropertyTypeId']=='11'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' industrial land';
        }else if($data['iFkPropertyTypeId']=='12'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' commercial land';
        }else if($data['iFkPropertyTypeId']=='13'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' open land';
        }else if($data['iFkPropertyTypeId']=='14'){
            $data['vPropertySociety'] = $data['vPropertyFeatureAreaPlot'].$data['vPropertyFeatureAreaPlotUnit'].' other land';
        }

        return $data;
    }
    public function front_add_sell_property()
    {
        if ($this->request->data) {
            // echo '<pre>';print_r($this->request->data);exit;
            $pdata = $this->request->data;
            $pd = array();
            foreach ($pdata as $key => $value) {
                $pd[$key] = (string)$value;
            }
            unset($pd['images']);
            unset($pd['Amenities']);

            $target_dir = WWW_ROOT . 'img/property/';
            $current = strtotime("now");

            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $pd = self::check_property_data($pd);
                // Add property
                $connection->insert('property', $pd);

                $last_id = $connection->execute("SELECT LAST_INSERT_ID()")->fetchAll('assoc');
                $property_id = $last_id[0]['LAST_INSERT_ID()'];

                //Add Amenities
                if ($pdata['Amenities']) {
                    $amn = explode(',', $pdata['Amenities']);
                    foreach ($amn as $v) {
                        $connection->insert('property_amenities_relations', [
                            'iFkPropertyid' => $property_id,
                            'iFkPropertyAmenitieId' => $v
                        ]);
                    }
                }

                // Add images of property
                foreach ($pdata['images'] as $key => $value) {
                    $target_file = $target_dir . basename($value['name']);
                    $current = $current . $key;
                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $image_name = $current . '.' . $imageFileType;
                    $target_file = $target_dir . $image_name;
                    move_uploaded_file($value["tmp_name"], $target_file);
                    $connection->insert('property_media', [
                        'iFkPropertyId' => $property_id,
                        'vPropertyImage' => $image_name,
                        'vPropertyImageType' => $imageFileType
                    ]);
                }

                $connection->commit();
                $this->response('s', '', 'Property added successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }

        }
    }

    public function front_update_property()
    {
        if ($this->request->data) {
            //echo '<pre>';print_r($this->request->data);exit;
            $pdata = $this->request->data;
            $pd = array();
            foreach ($pdata as $key => $value) {
                $pd[$key] = (string)$value;
            }
            $property_id=$pd['iPkPropertyId'];
            unset($pd['iPkPropertyId']);
            unset($pd['images']);
            unset($pd['Amenities']);

            $target_dir = WWW_ROOT . 'img/property/';
            $current = strtotime("now");

            $connection = ConnectionManager::get('default');
            $connection->begin();
            try {
                $pd = self::check_property_data($pd);
                // Add property
                $connection->update('property', $pd,['iPkPropertyId'=>$property_id]);


                //Add Amenities
                if ($pdata['Amenities']) {
                    $amn = explode(',', $pdata['Amenities']);
                    //delete all emenities
                    $connection->delete('property_amenities_relations', ['iFkPropertyid' => $property_id]);

                    //insert emenities
                    foreach ($amn as $v) {
                        $connection->insert('property_amenities_relations', [
                            'iFkPropertyid' => $property_id,
                            'iFkPropertyAmenitieId' => $v
                        ]);
                    }
                }

                // Add images of property
                foreach ($pdata['images'] as $key => $value) {
                    $target_file = $target_dir . basename($value['name']);
                    $current = $current . $key;
                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $image_name = $current . '.' . $imageFileType;
                    $target_file = $target_dir . $image_name;
                    move_uploaded_file($value["tmp_name"], $target_file);
                    $connection->insert('property_media', [
                        'iFkPropertyId' => $property_id,
                        'vPropertyImage' => $image_name,
                        'vPropertyImageType' => $imageFileType
                    ]);
                }

                $connection->commit();
                $this->response('s', '', 'Property updated successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }

        }
    }
    public function front_delete_property_image(){
        $connection = ConnectionManager::get('default');
        if ($this->request->is(['post'])) {
            if (!empty($this->request->data['PropertyMediaId']))
                $property_id = $this->request->data['PropertyMediaId'];

            $img = $connection->execute("select * from property_media WHERE iPkPropertyMediaId=".$property_id)->fetch('assoc');
            $image_dir = WWW_ROOT . 'img/property/';
            if (file_exists($image_dir . $img['vPropertyImage'])) {
                unlink($image_dir . $img['vPropertyImage']);
            }
            $connection->delete('property_media', ['iPkPropertyMediaId' => $property_id,'']);
            $this->response('s');
        }
    }

    public function front_getSellPropertyType()
    {
        $connection = ConnectionManager::get('default');
        if ($this->request->is(['post'])) {
            if (!empty($this->request->data['id']))
                $id = $this->request->data['id'];

            $checkid = $connection->execute("select * from property_type ")->fetchAll('assoc');
            foreach ($checkid as $ids) {

                $pr = explode(',', $ids['vPropertyFor']);
                if (in_array($id, $pr)) {
                    $a[] = $ids;
                }
            }
            $this->response('s', $a);
        }
    }

    public function front_getSellPropertyAmenities()
    {
        $connection = ConnectionManager::get('default');
        if ($this->request->is(['post'])) {
            $query = $connection->execute("select * from property_amenities ")->fetchAll('assoc');
            $this->response('s', $query);
        }
    }

    public function front_getMyproperty()
    {
        $connection = ConnectionManager::get('default');
        $uid=$this->request->data['Userid'];
        $query = $connection->execute("SELECT * FROM property AS p LEFT JOIN  property_media AS pm ON p.iPkPropertyId = pm.iFkPropertyId  WHERE p.ePropertyStatusV='active' AND p.iFkUserId=".$uid." GROUP BY pm.iFkPropertyId ORDER BY p.iPkPropertyId DESC")->fetchAll('assoc');
        return $query;
    }

    public function front_sendvarification_request()
    {
        $propertyid = $this->request->data['Propertyid'];
        $connection = ConnectionManager::get('default');
        $query = $connection->update("property", ['vReqStatus' => 'pending'], ['iPkPropertyId' => $propertyid]);
        return $query;
    }
    public function front_add_member_to_property()
    {
        $data = $this->request->data;
        $connection = ConnectionManager::get('default');
        $connection->begin();
        try {

            $otp = $this->genrateOTP(4);
            $password = $data['name'].$otp;

            $connection->insert('tbl_user_master',
                [
                    'iParentUserId'=>$data['userid'],
                    'vUsername' => $data['name'],
                    'vPassword' => md5($password),
                    'vEmail' => $data['email'],
                    'vMobile' => $data['phone']
                ]
            );

            $last_id = $connection->execute("SELECT LAST_INSERT_ID()")->fetchAll('assoc');
            $lastID = $last_id[0]['LAST_INSERT_ID()'];

            // Add member to property
            $connection->insert('property_member',
                [
                    'iFkPropertyid'=>$data['Propertyid'],
                    'iFkUserid'=>$lastID,
                    'vRelationship'=>$data['relation'],
                    'iAddedBy'=>$data['userid']
                ]
            );

            $connection->commit();
            $this->sendOTP($lastID, '4side OTP(One time password)', 'Your OTP(One time password) is ', $password, 'both');

            $this->response('s','', 'Member added successfully');

        } catch (\PDOException $e) {
            $error = 'Server Error.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }
    public function font_get_property_members(){

        $connection = ConnectionManager::get('default');
        $pid=$this->request->data['Propertyid'];
        $query = $connection->execute("SELECT pm.vRelationship,tum.vUsername,tum.vMobile FROM property_member pm left join tbl_user_master tum on pm.iFkUserid=tum.iUserId where pm.iFkPropertyid=".$pid)->fetchAll('assoc');
        return $query;
    }
    /*Buy property start*/
    public function font_get_property_locality(){

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select vPropertyLocality as locality,count(*) as available from property group by vPropertyLocality;")->fetchAll('assoc');
        return $query;
    }

    public function front_searchPropertyfilter(){

        //echo '<pre>';print_r($this->request->data);
        $condition='';
        if(isset($this->request->data['location'])){
            $location = explode(',',$this->request->data['location']);
            $location = "'".implode("','",$location)."'";
            $condition .= ' vPropertyLocality in('.$location.')';
        }
        $connection = ConnectionManager::get('default');

        if($condition!='') {
            $query = $connection->execute("SELECT count(*) AS count FROM property WHERE " . $condition)->fetchAll('assoc');
            $count = $query[0]['count'];
        }else{
            $count = 0;
        }
        return array('available_property'=>$count);
    }
    /*Buy property end*/

}
