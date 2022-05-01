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
use Cake\Filesystem\Folder;
use Cake\Filesystem\File;

class UsersController extends AppController
{
    public function initialize()
    {
        $this->loadComponent('RequestHandler');
        $this->checkValidToken();
    }

    public function index()
    {
        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT user.*, plan.iPkPlanId, package.iPkPackageId, plan.Unique_Plan_ID, package.vPackageName,DATE_FORMAT(dtExpireDate, '%d-%m-%Y') as formatted_expiredate, pp.dtExpireDate FROM  mst_user AS user
        INNER JOIN user_plan_payment AS pp ON user.iPkUserId = pp.iFkUserId
        LEFT JOIN mst_plans AS plan ON plan.iPkPlanId = pp.iFkUserPlanId
        LEFT JOIN mst_package AS package ON package.iPkPackageId = plan.iFkPackageId
        WHERE eUserStatus != 'deleted' ORDER BY user.iPkUserId DESC")->fetchAll('assoc');
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
                $query = $connection->update('mst_user', [
                    'eUserStatus' => $status,
                    'dtUserUpdatedOn' => Time::now()
                ], ['iPkUserId' => $id]);
                $connection->commit();
                $this->response('s', '', 'Status change successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
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

            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            } else {
                $status = 'active';
            }

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE mst_user SET `eUserStatus` = '" . $status . "',`dtUserUpdatedOn` = now() WHERE iPkUserId IN (" . implode(',', $ids) . ")")->execute();
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
    
    public function changeCoachingCalls()
    {
        if (isset($this->request->data['aid'])) {
            $user_id = $this->request->data['aid'];
            $value = $this->request->data['value'];
            $type = $this->request->data['type'];
            
            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    if($type == 'classis_call'){
                        $connection->query("UPDATE mst_user SET `classis_call` = '" . $value . "' WHERE iPkUserId = $user_id")->execute();
                    }
                    if($type == 'plan'){
                        $connection->query("UPDATE user_plan_payment SET `iFkUserPlanId` = '" . $value . "' WHERE iFkUserId = $user_id")->execute();
                    }
                    if($type == 'expiredate'){
                        $connection->query("UPDATE user_plan_payment SET `dtExpireDate` = '" . $value . "' WHERE iFkUserId = $user_id")->execute();
                    }
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
                    $query = $connection->update('mst_user', [
                        'eUserStatus' => 'deleted',
                        'dtUserUpdatedOn' => Time::now()
                    ], ['iPkUserId' => $id]);
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

    public function deleteAll()
    {
        if (isset($this->request->data['deleteIds'])) {
            $ids = $this->request->data['deleteIds'];
            $userId = $this->request->data['aid'];

            if ($this->request->is(['post'])) {
                $connection = ConnectionManager::get('default');
                $connection->begin();
                try {
                    $connection->query("UPDATE mst_user SET eUserStatus = 'deleted',dtUserUpdatedOn = now() WHERE iPkUserId IN (" . implode(',', $ids) . ")")->execute();
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

    public function view()
    {
        $userId = $this->request->query['uid'];
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT user.iPkUserId,user.vEmail,user.vFirstName,user.vLastName,user.vMobile,plan.iFkUserPlanId,user.classis_call, plan.iFkPackageId 
        FROM mst_user AS user
        INNER JOIN user_plan_payment AS plan ON user.iPkUserId = plan.iFkUserId
        WHERE user.iPkUserId ='" . $userId . "'")->fetch('assoc');
        $this->response('s', $query);
    }

    public function add()
    {
        $confirm_token = substr(sha1(time()), 0, 20);
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $currentTime = Time::now();
        $vFirstName = $this->request->data['vFirstName'];
        $vLastName = $this->request->data['vLastName'];
        $vEmail = $this->request->data['vEmail'];
        $vMobile = isset($this->request->data['vMobile']) ? $this->request->data['vMobile'] : '';
        $planId = $this->request->data['planId'];
        $packageId = $this->request->data['packageId'];
        $classis_call = isset($this->request->data['classis_call']) ? $this->request->data['classis_call'] : 0;
        $this->request->allowMethod('post');
        $connection = ConnectionManager::get('default');
        if (empty($vFirstName)) {
            $this->response('f', '', 'First Name is required');
        } else if (empty($vLastName)) {
            $this->response('f', '', 'Last Name is required');
        } else if (empty($vEmail)) {
            $this->response('f', '', 'Email is required');
        } else {
            $checkEmailExist = $this->checkEmailExist($vEmail);
            // $checkMobileExist = $this->checkMobileExist($vMobile);
            // if (!$checkEmailExist) {
                if (!$checkMobileExist) {
                    $password_text = getToken(8);
                    $password = md5($password_text);
                    $KEY = getToken(10);
                    $otp = substr(sha1(time()), 0, 6);
                    $statement = $connection->insert('mst_user', [
                        'vEmail' => $vEmail,
                        'vFirstName' => $vFirstName,
                        'vLastName' => $vLastName,
                        'vPassword' => $password,
                        'vMobile' => $vMobile,
                        'eUserStatus' => 'active',
                        'dtUserCreatedOn' => Time::now(),
                        'eIsVerified' => 'yes',
                        'confirm_token' => $confirm_token,
                        'reference_key' => $KEY,
                        'otp_code' => $otp,
                        'is_confirmed' => 'yes',
                        'classis_call' => $classis_call
                    ]);
                    $user_ID = $statement->lastInsertId('mst_user');
                    $connection->insert('mst_user_general_settings', ['user_id' => $user_ID, 'language' => 'en']);
                    $check_plan = $connection->execute("SELECT * FROM mst_plans where iPkPlanId = $planId")->fetch('assoc');
                    /** poojan code start*/
                    if(!empty($check_plan) && isset($check_plan['Plan_Duration']) && !empty($check_plan['Plan_Duration'])){
                        if($check_plan['Plan_Duration'] == "yearly"){
                            $expireDate=date('Y-m-d H:i:s', strtotime('+1 year', strtotime($currentTime)) );
                        } else{
                            $expireDate=date('Y-m-d H:i:s', strtotime('+1 month', strtotime($currentTime)) );
                        }
                    }
                    /** poojan code end*/
                    if ($check_plan['ePlanFee'] == 'free') {
                        $connection->insert('user_plan_payment', [
                            'iFkUserId' => $user_ID,
                            'iFkUserPlanId' => $planId,
                            'iFkPackageId' => $packageId,
                            'vPlanType' => 'free',
                            'dPaymentAmount' => 0,
                            'vStatus' => 'active',
                            'is_trial' => 'yes',
                            'dtCreatedOn' => $currentTime,
                        ]);
                    } else {
                        $connection->insert('user_plan_payment', [
                            'iFkUserId' => $user_ID,
                            'iFkUserPlanId' => $planId,
                            'iFkPackageId' => $packageId,
                            'vPlanType' => $check_plan['Plan_Duration'],
                            'dPaymentAmount' => $check_plan['Plan_prices'],
                            'vStatus' => 'active',
                            'is_trial' => 'yes',
                            'dtCreatedOn' => $currentTime,
                            'dtPaymentOn' => $currentTime, //added by poojan
                            'dtExpireDate'=>$expireDate //added by poojan
                        ]);
                    }

                    /** Email Template */
                    $loginLink = "<a href='https://" . $_SERVER['HTTP_HOST'] . "/resetpassword?key=" . $KEY . "'>";;
                    $dir = new Folder(WWW_ROOT . 'templates');
                    $files = $dir->find('newuser.html', true);
                    foreach ($files as $file) {
                        $file = new File($dir->pwd() . DS . $file);
                        $contents = $file->read();
                        $file->close();
                    }

                    $patterns = array();
                    $outputs = preg_replace($patterns, '', $contents);

                    $message = str_replace(
                        array('{TITLE}', '{FIRSTNAME}', '{BODY}', '{EMAIL}', '{PASSWORD}'),
                        array('Successful Registration', $vFirstName, $loginLink, $vEmail, $password_text),
                        $outputs
                    );

                    $email = new Email();
                    if (EMAILTYPE == 'gmail') {
                        Email::dropTransport('Gmail');
                        Email::configTransport('Gmail', [
                            'host' => SMTPHOST,
                            'port' => SMTPPORT,
                            'username' => SMTPUSERNAME,
                            'password' => SMTPPASSWORD,
                            'className' => 'Smtp'
                        ]);
                        $email->transport('Gmail');
                    } else {
                        Email::dropTransport('default');
                        Email::configTransport('default', [
                            'host' => SMTPHOST,
                            'port' => SMTPPORT,
                            'username' => SMTPUSERNAME,
                            'password' => SMTPPASSWORD,
                            'className' => 'Mail',
                            'client' => null,
                            'tls' => null,
                        ]);
                        $email->transport('default');
                    }
                    $email->emailFormat('html')
                        ->from([ADMIN_EMAIL => PROJECTNAME])
                        ->to([$vEmail])
                        ->subject('Successful Registration')
                        ->send($message);

                    $this->response('s', $vFirstName, 'User Added successfully');
                // } else {
                //     $this->response('f', '', 'Mobile number already in use');
                // }
            } else {
                $this->response('f', '', 'Email already in use');
            }
        }
    }

    public function checkEmailExist($email)
    {
        $connection = ConnectionManager::get('default');
        $checkUser = $connection->execute("SELECT * FROM `mst_user` WHERE  `vemail` = '" . $email . "' AND `eUserStatus` != 'deleted'")->fetchAll('assoc');
        if (count($checkUser)) {
            return $checkUser;
        } else {
            return false;
        }
    }

    public function checkMobileExist($mobile)
    {
        $connection = ConnectionManager::get('default');
        $checkUser = $connection->execute("SELECT * FROM `mst_user` WHERE  `vMobile` = '" . $mobile . "' AND `eUserStatus` != 'deleted' ")->fetchAll('assoc');
        if (count($checkUser)) {
            return $checkUser;
        } else {
            return false;
        }
    }

    public function edit()
    {
        $id = '';
        $userid = '';
        $vFirstName = '';
        $vLastName = '';
        $vPhone = '';
        $vEmail = '';
        $planId = '';
        $packageId = '';
        $classis_call = 0;
        Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
        $currentTime = Time::now();
        
        if (!empty($this->request->data['userId']))
            $userid = $this->request->data['userId'];

        if (!empty($this->request->data['vFirstName']))
            $vFirstName = $this->request->data['vFirstName'];

        if (!empty($this->request->data['vLastName']))
            $vLastName = $this->request->data['vLastName'];

        if (!empty($this->request->data['vEmail']))
            $vEmail = $this->request->data['vEmail'];

        if (!empty($this->request->data['vMobile']))
            $vPhone = $this->request->data['vMobile'];

        if (!empty($this->request->data['planId']))
            $planId = $this->request->data['planId'];

        if (!empty($this->request->data['packageId']))
            $packageId = $this->request->data['packageId'];
            
        if (!empty($this->request->data['classis_call']))
            $classis_call = $this->request->data['classis_call'];

        if ($userid == '' || $vFirstName == '' || $vLastName == '' || $vEmail == '' || $planId == '') {
            $this->response('f', '', 'Incomplete parameter');
        }

        if ($this->request->is(['post'])) {
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();
            $checkemailExist = $connection->execute("SELECT * FROM mst_user WHERE vEmail='" . $vEmail . "' AND eUserStatus != 'deleted' AND iPkUserId!=" . $userid)->fetchAll('assoc');
            if (count($checkemailExist) == 0) {
                try {
                    $query = $connection->update(
                        'mst_user',
                        [
                            'vFirstName' => $vFirstName,
                            'vLastName' => $vLastName,
                            'vEmail' => $vEmail,
                            'vMobile' => $vPhone,
                            'classis_call' => $classis_call,
                            'dtUserUpdatedOn' => Time::now()
                        ],
                        ['iPkUserId' => $userid]
                    );
                    $selectplan = $connection->execute("SELECT * FROM mst_plans where iPkPlanId = $planId")->fetch('assoc');
                    /** poojan code start*/
                    if(!empty($selectplan) && isset($selectplan['Plan_Duration']) && !empty($selectplan['Plan_Duration'])){
                        if($selectplan['Plan_Duration'] == "yearly"){
                            $expireDate=date('Y-m-d H:i:s', strtotime('+1 year', strtotime($currentTime)) );
                        } else{
                            $expireDate=date('Y-m-d H:i:s', strtotime('+1 month', strtotime($currentTime)) );
                        }
                    }
                    /** poojan code end*/
                    $connection->update('user_plan_payment', [
                        'iFkUserPlanId' => $planId,
                        'iFkPackageId' => $packageId,
                        'vPlanType' => $selectplan['Plan_Duration'],
                        'vStatus' => 'active',
                        'dtPaymentOn' => $currentTime, //added by poojan
                        'dtExpireDate' => $expireDate //added by poojan
                    ], ['iFkUserId' => $userid]);
                    $connection->commit();
                    $this->response('s', $vFirstName, 'User updated successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            } else {
                $this->response('f', '', 'Email already exist');
            }
        }
    }
}

function crypto_rand_secure($min, $max)
{
    $range = $max - $min;
    if ($range < 1) {
        return $min;
    }
    // not so random...
    $log = ceil(log($range, 2));
    $bytes = (int) ($log / 8) + 1; // length in bytes
    $bits = (int) $log + 1; // length in bits
    $filter = (int) (1 << $bits) - 1; // set all lower bits to 1
    do {
        $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));
        $rnd = $rnd & $filter; // discard irrelevant bits
    } while ($rnd > $range);
    return $min + $rnd;
}

function getToken($length)
{
    $token = "";
    $codeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $codeAlphabet .= "abcdefghijklmnopqrstuvwxyz";
    $codeAlphabet .= "0123456789";
    $max = strlen($codeAlphabet); // edited

    for ($i = 0; $i < $length; $i++) {
        $token .= $codeAlphabet[crypto_rand_secure(0, $max - 1)];
    }
    return $token;
}
