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

class GeneralController extends AppController
{
    public function initialize()
    {
        $this->loadComponent('RequestHandler');
        $this->checkValidToken();
    }

    public function index()
    {

        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select * from general_settings where iPkSettingId ='1'")->fetch('assoc');
        $getPlan = $connection->execute("SELECT iPkPlanId,Plan_names,ePlanFee,ePlanStatus,Unique_Plan_ID FROM mst_plans WHERE ePlanStatus='active'")->fetchAll('assoc');
        $plan_id = $query['vDefaultPlan'];

        $defaultPlan = $connection->execute("SELECT iPkPlanId,Plan_names,ePlanFee,ePlanStatus,Unique_Plan_ID FROM mst_plans WHERE iPkPlanId = $plan_id AND ePlanStatus='active'")->fetch('assoc');

        $query['plan'] = $getPlan;
        $query['PlanFees'] = $defaultPlan['ePlanFee'];

        $this->response('s', $query);
    }

    public function getPlan()
    {
        $connection = ConnectionManager::get('default');
        $pid = $this->request->data['pid'];
        if ($pid != 'undefined' && $pid != '') {
            $getPlan = $connection->execute("SELECT iPkPlanId,Plan_names,ePlanFee,ePlanStatus,Unique_Plan_ID FROM mst_plans WHERE (iFkPackageId IS NULL OR iFkPackageId = $pid) AND  ePlanStatus='active'")->fetchAll('assoc');
        } else {
            $getPlan = $connection->execute("SELECT iPkPlanId,Plan_names,ePlanFee,ePlanStatus,Unique_Plan_ID FROM mst_plans WHERE iFkPackageId IS NULL AND  ePlanStatus='active'")->fetchAll('assoc');
        }

        $query['plan'] = $getPlan;
        $this->response('s', $query);
    }

    public function edit()
    {

        error_reporting(0);

        $vSettingEmailSupport = $this->request->data['vSettingEmailSupport'];
        $vSettingEmailAdmin = $this->request->data['vSettingEmailAdmin'];
        $vSettingEmailCC = $this->request->data['vSettingEmailCC'];
        $vSettingEmailBCC = $this->request->data['vSettingEmailBCC'];
        $vSettingEmailReplyTo = $this->request->data['vSettingEmailReplyTo'];
        $vSettingSupportContact = $this->request->data['vSettingSupportContact'];
        $emailtype = $this->request->data['emailtype'];
        $smtphost = $this->request->data['smtphost'];
        $smtpport = $this->request->data['smtpport'];
        $smtpusername = $this->request->data['smtpusername'];
        $smtppassword = $this->request->data['smtppassword'];

        $paypalmode = $this->request->data['paypalmode'];

        $sandUserName = $this->request->data['sandUserName'];
        $sandPassword = $this->request->data['sandPassword'];
        $sandSignature = $this->request->data['sandSignature'];

        $LiveUserName = $this->request->data['LiveUserName'];
        $LivePassword = $this->request->data['LivePassword'];
        $LiveSignature = $this->request->data['LiveSignature'];
        $ITrialPeriod = $this->request->data['ITrialPeriod'];


        $connection = ConnectionManager::get('default');
        if ($this->request->is(['post'])) {

            $connection->query("UPDATE general_settings SET
           vSettingEmailSupport = '" . $vSettingEmailSupport . "',
           vSettingEmailAdmin = '" . $vSettingEmailAdmin . "',
           vSettingEmailCC = '" . $vSettingEmailCC . "',
           vSettingEmailBCC = '" . $vSettingEmailBCC . "',
           vSettingEmailReplyTo = '" . $vSettingEmailReplyTo . "',
           vSettingSupportContact = '" . $vSettingSupportContact . "',
           emailtype = '" . $emailtype . "',
           smtphost = '" . $smtphost . "',
           smtpport = '" . $smtpport . "',
           smtpusername = '" . $smtpusername . "',
           smtppassword = '" . $smtppassword . "',
           vPaymentMode= '" . $paypalmode . "',
           ITrialPeriod='" . $ITrialPeriod . "',
           vPaypalApiUserNameSand = '" . $sandUserName . "',
           vPaypalApiPasswordSand = '" . $sandPassword . "',
           vPaypalApiSignatureSand= '" . $sandSignature . "',
           vPaypalApiUserNameLive = '" . $LiveUserName . "',
           vPaypalApiPasswordLive = '" . $LivePassword . "',
           vPaypalApiSignatureLive= '" . $LiveSignature . "',
           dtSettingUpdatedDate=now()
            WHERE iPkSettingId ='1'")->execute();

            //$query = $connection->execute("call sp_general_setting('update','$vSettingEmailSupport','$vSettingEmailAdmin','$vSettingEmailCC','$vSettingEmailBCC','$vSettingEmailReplyTo','$vSettingSupportContact','$emailtype','$smtphost','$smtpport','$smtpusername','$smtppassword')");

            $this->response('s');
        }
    }

    public function changeplan()
    {

        $planId = $this->request->data['id'];
        if ($planId != '' || $planId != undefined) {
            $connection = ConnectionManager::get('default');
            $connection->query("UPDATE general_settings SET           
           vDefaultPlan= '" . $planId . "'
            WHERE iPkSettingId ='1'")->execute();

            $this->response('s');
        }
    }

    public function trialdays()
    {
        $tdays = $this->request->data['tday'];
        if ($tdays != '' || $tdays != undefined) {
            $connection = ConnectionManager::get('default');
            $connection->query("UPDATE general_settings SET           
            ITrialPeriod= '" . $tdays . "'
            WHERE iPkSettingId ='1'")->execute();

            $this->response('s');
        }
    }
}
