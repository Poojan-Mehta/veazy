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

class MarketplaceController extends AppController
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
        $query = $connection->execute("select * from mst_marketplace where eType= '".$type."' ORDER BY iPKMPId DESC")->fetchAll('assoc');
        foreach ($query as $key => $value) {
            $mpID = $value['iPKMPId'];
            $assign = 'no';
            $mpcheck = $connection->execute("select * from mst_visa_product WHERE iFKMPId = '". $mpID ."'")->fetchAll('assoc');

            if (count($mpcheck)) {
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
                $query = $connection->update('mst_marketplace', [
                    'is_Visible' => $status,
                    ],['iPKMPId' => $id]);
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
            try {
                $query = $connection->execute("DELETE FROM mst_marketplace WHERE iPKMPId= $id");
                $this->response('s', '', 'MarketPlace has been deleted');
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
                    $query = $connection->execute("DELETE FROM `mst_marketplace` WHERE iPKMPId IN (".implode(',',$ids).")");
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

        $where = '';
        if(!empty($type)){
            $where = 'eType = "'.$type.'" AND';
        }

        $query = $connection->execute("select * from mst_marketplace where $where iPKMPId='".$id."'")->fetch('assoc');

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
        $vMarketName = '';
        $eType = '';

        if (!empty($this->request->data['vMPName'])){
            $vMarketName = $this->request->data['vMPName'];
        }

        if (!empty($this->request->data['eType'])){
            $eType = $this->request->data['eType'];
        }

        if ($this->request->is(['post'])) {
            if (!empty($vMarketName) || !empty($eType)) {
                $connection = ConnectionManager::get('default');
                $checkMarketPlaceexist = $connection->execute("SELECT vMPName FROM mst_marketplace WHERE eType = '".$eType."' AND  vMPName = '".$vMarketName."'")->fetchAll('assoc');
                if(count($checkMarketPlaceexist) == 0){
                    try{
                        $connection->insert('mst_marketplace', ['vMPName' => $vMarketName, 'eType' => $eType]);
                        $this->response('s', '', 'Market Place has been created');
                    } catch (\PDOException $e) {
                        $error = 'Unable to create new Market Place';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                }else{
                    $error="Market Place already exist";
                    $this->response('f', '', $error);
                }
            }else{
                $error="Market Place name is required";
                $this->response('f', '', $error);
            }
        }
    }

    public function edit()
    {
        error_reporting(0);
        $vMarketName = '';
        $eType = '';

        if (!empty($this->request->data['vMPName'])){
            $vMarketName = $this->request->data['vMPName'];
        }

        if (!empty($this->request->data['eType'])){
            $eType = $this->request->data['eType'];
        }

        if (!empty($this->request->data['mpid']))
            $mpid = $this->request->data['mpid'];

        if ($this->request->is(['post'])) {
            if (!empty($vMarketName) || !empty($eType)) {
                $connection = ConnectionManager::get('default');

                $checkMarketPlaceexist = $connection->execute("SELECT * FROM mst_marketplace WHERE vMPName = '".$vMarketName."' AND eType = '".$eType."' AND iPKMPId != $mpid")->fetchAll('assoc');
                if(count($checkMarketPlaceexist)){
                    $error="Market Place name is already exist";
                    $this->response('f', '', $error);
                }else{
                    $connection->update('mst_marketplace', ['vMPName' => $vMarketName],['iPKMPId' => $mpid,'eType' => $eType]);
                    $this->response('s', '', 'Market Place name has been updated');
                }
            }else{
                $error="Market Place name is required";
                $this->response('f', '', $error);
            }
        }
    }

    public function getMarketPlace(){
        $type ='';
        $connection = ConnectionManager::get('default');
        if(!empty($this->request->data['eType'])){
            $type= $this->request->data['eType'];
        }

        $query = $connection->execute("SELECT iPKMPId,vMPName FROM mst_marketplace where eType='".$type."'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    
}

?>