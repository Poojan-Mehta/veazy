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

class PlanpackageController extends AppController
{
    public function initialize()
    {
        $this->loadComponent('RequestHandler');
        $this->checkValidToken();
    }

    /** index Method return folder listing by type */
    public function index()
    {
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM mst_package ORDER BY iPkPackageId DESC")->fetchAll('assoc');
        foreach ($query as $key => $value) {
            $iPkPackageId = $value['iPkPackageId'];
            $assign = 'no';
            $plans = $connection->execute("SELECT Unique_Plan_ID FROM mst_plans WHERE iFkPackageId = '" . $iPkPackageId . "' AND ePlanStatus != 'deleted'")->fetchAll('assoc');
            $final_result = '';
            if (count($plans) > 0) {
                $assign = 'yes';
                $total_plans = array_column($plans, 'Unique_Plan_ID');
                $final_result = implode(', ', $total_plans);
            }
            $query[$key]['assign'] = $assign;
            $query[$key]['plans'] = $final_result;
        }
        $this->response('s', $query);
    }

    public function delete()
    {
        if (isset($this->request->data['deleteId'])) {
            $id = $this->request->data['deleteId'];
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            try {
                $query = $connection->execute("DELETE FROM mst_package WHERE iPkPackageId= $id");
                $this->response('s', '', 'Package has been deleted');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        }
    }

    public function deleteAll()
    {
        if (isset($this->request->data['deleteIds'])) {
            $ids = $this->request->data['deleteIds'];
            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                try {
                    $query = $connection->execute("DELETE FROM `mst_package` WHERE iPkPackageId IN (" . implode(',', $ids) . ")");
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

    public function view($id)
    {
        $connection = ConnectionManager::get('default');
        if ($id == '') {
            $this->response('s', '', 'Incomplete Parameter');
        }

        $query = $connection->execute("SELECT * FROM mst_package WHERE iPkPackageId='" . $id . "'")->fetch('assoc');
        $plans = $connection->execute("SELECT iPkPlanId FROM mst_plans WHERE iFkPackageId=:pkgid", ['pkgid' => $id])->fetchAll('assoc');
        $plan_IDs = array_column($plans, 'iPkPlanId');
        $query['plans'] = $plan_IDs;
        if ($query) {
            $this->response('s', $query);
        } else {
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function add()
    {
        error_reporting(0);
        $vPackageName = '';

        if (!empty($this->request->data['vPackageName'])) {
            $vPackageName = $this->request->data['vPackageName'];
        }

        $RECORDS = json_decode($this->request->data['records']);
        $plan_IDS = array();
        if (empty($RECORDS->plans)) {
            $this->response('f', '', 'Please select plans');
        } else {
            $plan_IDS = $RECORDS->plans;
        }

        if ($this->request->is(['post'])) {
            if (!empty($vPackageName)) {
                $connection = ConnectionManager::get('default');
                $checkPackageName = $connection->execute("SELECT vPackageName FROM mst_package WHERE vPackageName = '" . $vPackageName . "'")->fetchAll('assoc');
                if (count($checkPackageName) == 0) {
                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                    try {
                        $query = $connection->insert('mst_package', ['vPackageName' => $vPackageName, 'dtCreatedOn' => Time::now()]);
                        $packageID =  $query->lastInsertId('mst_package');
                        foreach ($plan_IDS as $id) {
                            $connection->update('mst_plans', ['iFkPackageId' => $packageID], ['iPkPlanId' => $id]);
                        }
                        $this->response('s', '', 'Package has been created');
                    } catch (\PDOException $e) {
                        $error = 'Unable to create new package';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                } else {
                    $error = "Package name is already exist";
                    $this->response('f', '', $error);
                }
            } else {
                $error = "Package name is required";
                $this->response('f', '', $error);
            }
        }
    }

    public function edit()
    {
        error_reporting(0);
        $vPackageName = '';
        $pid = '';
        if (!empty($this->request->data['vPackageName']))
            $vPackageName = $this->request->data['vPackageName'];

        if (!empty($this->request->data['pid']))
            $pid = $this->request->data['pid'];

        $RECORDS = json_decode($this->request->data['records']);
        $plan_IDS = array();
        if (empty($RECORDS->plans)) {
            $this->response('f', '', 'Please select plans');
        } else {
            $plan_IDS = $RECORDS->plans;
        }
        if ($this->request->is(['post'])) {
            if (!empty($vPackageName)) {
                $connection = ConnectionManager::get('default');

                $checkfolderexist = $connection->execute("SELECT * FROM mst_package WHERE vPackageName = '" . $vPackageName . "'  AND iPkPackageId != $pid")->fetchAll('assoc');

                if (count($checkfolderexist)) {
                    $error = "Package name is already exist";
                    $this->response('f', '', $error);
                } else {
                    $connection->update('mst_package', ['vPackageName' => $vPackageName], ['iPkPackageId' => $pid]);
                    $connection->update('mst_plans', ['iFkPackageId' => NULL], ['iFkPackageId' => $pid]);
                    foreach ($plan_IDS as $id) {
                        $connection->update('mst_plans', ['iFkPackageId' => $pid], ['iPkPlanId' => $id]);
                    }
                    $this->response('s', '', 'Package name has been updated');
                }
            } else {
                $error = "Package name is required";
                $this->response('f', '', $error);
            }
        }
    }

    public function getPackage()
    {
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM mst_package ORDER BY iPkPackageId DESC")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function getPlan($id)
    {
        $connection = ConnectionManager::get('default');
        $getPlan = $connection->execute("SELECT iPkPlanId,Plan_names,ePlanFee,ePlanStatus,Unique_Plan_ID FROM mst_plans WHERE ePlanStatus='active'")->fetchAll('assoc');
        $this->response('s', $getPlan);
    }
}
