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

class PlansController extends AppController{

    public function initialize(){
        $this->loadComponent('RequestHandler');
    }

    public function index(){
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT plan.*,package.vPackageName FROM mst_plans AS plan LEFT JOIN mst_package AS package ON package.iPkPackageId  = plan.iFkPackageId WHERE plan.ePlanStatus !='deleted' ORDER BY iPkPlanId DESC")->fetchAll('assoc');

        foreach ($query as $key=> $value)
        {
            $id = $value['iPkPlanId'];
            $checkplan = $connection->execute("SELECT * FROM user_plan_payment WHERE iFkUserPlanId = $id AND vStatus = 'active'")->fetchAll('assoc');
            if(!empty($checkplan)){
                $query[$key]['assign'] = 'yes';
            }else {
                $query[$key]['assign'] = 'no';
            }
        }
        $this->response('s',$query);
        
    }

    public function view(){
        
        $connection = ConnectionManager::get('default');
        $id = $this->request->data['id'];

        $query = $connection->execute("SELECT * FROM  mst_plans where iPkPlanId= '".$id."'")->fetch('assoc');

        if(!empty($query))
        {            
            $this->response('s',$query);
        }else{
            $connection->rollback();
            $this->response('f', '', 'Invalid product selection.');
        }

    }

    public function add(){
        
        $Plan_names = '';
        $ePlanFee = '';
        $connection = ConnectionManager::get('default');
        $AllowLessons = $this->request->data['AllowLessons'];
        $AllowTemplates = $this->request->data['AllowTemplates'];
        $AllowDC = $this->request->data['AllowDC'];
        $no_application = $this->request->data['no_application'];
        //$monthly_price = 0;
        //$yearly_price = 0;
        $Plan_prices = '';
        $Plan_Duration = '';
        $Duration_Number = '';
        $Unique_Plan_ID = '';
        $packageId = $this->request->data['packageId'];

        if (!empty($this->request->data['Plan_names']))
            $Plan_names = $this->request->data['Plan_names'];

        if (!empty($this->request->data['Plan_Duration']))
            $Plan_Duration = $this->request->data['Plan_Duration'];
            
        if (!empty($this->request->data['Duration_Number']))
            $Duration_Number = $this->request->data['Duration_Number'];

        if (!empty($this->request->data['Unique_Plan_ID']))
            $Unique_Plan_ID = $this->request->data['Unique_Plan_ID'];

        if (!empty($this->request->data['payment_type'])){
            if($this->request->data['payment_type'] == 'recurring'){
                if($this->request->data['Plan_prices'] == 'undefined'){
                    $this->response('f', '', 'Please Select Plan Price');
                }else{
                    //$monthly_price = $this->request->data['monthly_price'];
                    //$yearly_price = $this->request->data['yearly_price'];
                    $Plan_prices = $this->request->data['Plan_prices'];
                }
            }else{
                $Plan_Duration = '';
            }
            $ePlanFee = $this->request->data['payment_type'];

        }
            

        if($Plan_names == ''){
            $this->response('f', '', 'Incomplete parameter');
        }

        $Pro_Features = $this->request->data['Pro_Features'];
        
        if ($this->request->is(['post'])){

            $checkrecord = $connection->execute("SELECT * FROM mst_plans where Unique_Plan_ID ='".$Unique_Plan_ID."' AND ePlanStatus != 'deleted' AND ePlanStatus != 'inactive'")->fetchAll('assoc');
            //echo "<pre>"; print_r($checkrecord); exit;
            if(count($checkrecord)>0){
                $this->response('f','','Plan already exist');
            }else{
                Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                $connection->begin();
                    try {
                        $query = $connection->insert('mst_plans', [
                            'Unique_Plan_ID'=> $Unique_Plan_ID,
                            'Plan_names' => $Plan_names,
                            'iFkPackageId' => $packageId,
                            'ePlanFee' => $ePlanFee,
                            'Plan_Duration' => $Plan_Duration,
                            'Duration_Number' => $Duration_Number,
                            'Plan_prices' => $Plan_prices,
//                            'dPlanYearlyPrice'=>$yearly_price,
//                            'dPlanMonthlyPrice'=>$monthly_price,
                            'no_application'=>$no_application,
                            'AllowTemplates'=>$AllowTemplates,
                            'AllowLessons'=>$AllowLessons,
                            'AllowDC'=>$AllowDC,
                            'Pro_Features'=>$Pro_Features,
                            'dtCreatedOn' => Time::now(),
                            'ePlanStatus' => 'active' ]);
                        $connection->commit();
                        $this->response('s','','Plan added successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
            }
            
        }
    }
    
    public function edit(){

        $pid = $this->request->data['pid'];
            if(!empty($pid)){
                $Plan_names = '';
                $ePlanFee = '';
                $connection = ConnectionManager::get('default');
                $AllowLessons = $this->request->data['AllowLessons'];
                $AllowTemplates = $this->request->data['AllowTemplates'];
                $AllowDC = $this->request->data['AllowDC'];
                $no_application = $this->request->data['no_application'];
                $Pro_Features = $this->request->data['Pro_Features'];
                //$monthly_price = '';
                //$yearly_price = '';
                $Plan_Duration = '';
                $Duration_Number = '';
                $Plan_prices = '';
                $Unique_Plan_ID = '';
                $packageId = $this->request->data['packageId'];

                if (!empty($this->request->data['Plan_names']))
                    $Plan_names = $this->request->data['Plan_names'];

                if (!empty($this->request->data['Plan_Duration']))
                    $Plan_Duration = $this->request->data['Plan_Duration'];
                    
                 if (!empty($this->request->data['Duration_Number']))
                    $Duration_Number = $this->request->data['Duration_Number'];


                if (!empty($this->request->data['Unique_Plan_ID']))
                    $Unique_Plan_ID = $this->request->data['Unique_Plan_ID'];

                if (!empty($this->request->data['payment_type'])){
                    if($this->request->data['payment_type'] == 'recurring'){
                        //echo "<pre>"; print_r($this->request->data); exit;
                        if($this->request->data['Plan_prices'] == 'undefined'){
                            $this->response('f', '', 'Please Select Plan Price');
                        }else{
                            //$monthly_price = $this->request->data['monthly_price'];
                            //$yearly_price = $this->request->data['yearly_price'];
                            $Plan_prices = $this->request->data['Plan_prices'];
                        }
                    }else{
                        $Plan_Duration = '';
                    }
                    $ePlanFee = $this->request->data['payment_type'];
                }                

                if($Plan_names == ''){
                    $this->response('f', '', 'Incomplete parameter');
                }

            if ($this->request->is(['post'])) {
                    //echo "<pre>"; print_r($this->request->data); exit;
                /** check plan is used anywhere or what */
                $checkplan = $connection->execute("SELECT * FROM user_plan_payment where iFkUserPlanId = $pid AND vStatus = 'active'")->fetchAll('assoc');
                if (!empty($checkplan)) {
                    $this->response('f', '', 'This Plan is Already in Use, So You Can not Delete this');
                } else {

                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');


                    $connection->begin();
                    try {
                        $query = $connection->update('mst_plans', [
                            'Unique_Plan_ID' => $Unique_Plan_ID,
                            'Plan_names' => $Plan_names,
                            'iFkPackageId' => $packageId,
                            'Plan_Duration' => $Plan_Duration,
                            'Duration_Number' => $Duration_Number,
                            'Plan_prices' => $Plan_prices,
                            'ePlanFee' => $ePlanFee,
//                                'dPlanYearlyPrice'=>$yearly_price,
//                                'dPlanMonthlyPrice'=>$monthly_price,
                            'no_application' => $no_application,
                            'AllowTemplates' => $AllowTemplates,
                            'AllowLessons' => $AllowLessons,
                            'AllowDC' => $AllowDC,
                            'Pro_Features' => $Pro_Features,
                        ], ['iPkPlanId' => $pid]);
                        $connection->commit();
                        $this->response('s', '', 'Plan Updated successfully');
                    } catch (\PDOException $e) {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                }
            }
        }else{
            $this->response('f', '', 'Incomplete parameter');
        }
        
    }

    public function changeStatus(){
        
        if(isset($this->request->data['pid'])){
            $id = $this->request->data['pid'];
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
                $query = $connection->update('mst_plans', ['ePlanStatus' => $status],['iPkPlanId' => $id]);
                $connection->commit();
                $this->response('s', '', 'Plan has been '.$msg.' successfully.');
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
                $query = $connection->update('mst_plans', [
                    'is_Visible' => $status,
                ],['iPkPlanId' => $id]);
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
                $msg = 'inactivated';
            }else{
                $status = 'active';
                $msg = 'activated';
            }

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE `mst_plans` SET `ePlanStatus` = '".$status."' WHERE iPkPlanId IN (".implode(',',$ids).")")->execute();
                    $connection->commit();
                    $this->response('s','', 'Plan has been '.$msg.'.');
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
            $connection = ConnectionManager::get('default');
            $connection->begin();

            if ($this->request->is(['post'])) {
                /** check plan is used anywhere or what */
                $checkplan = $connection->execute("SELECT * FROM user_plan_payment where iFkUserPlanId = $id AND vStatus = 'active'")->fetchAll('assoc');
                if(!empty($checkplan)){
                    $this->response('f', '', 'This Plan is Already in Use, So You Can not Delete this');
                }else {
                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');

                    try {
                        $status = 'deleted';
                        $connection->update('mst_plans', ['ePlanStatus' => $status], ['iPkPlanId' => $id]);
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
        
        if(isset($this->request->data['deleteIds'])){
            $ids = $this->request->data['deleteIds'];

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $status = 'deleted';
                    $connection->query("UPDATE `mst_plans` SET `ePlanStatus` = '".$status."' WHERE iPkPlanId IN (".implode(',',$ids).")")->execute();
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
}
