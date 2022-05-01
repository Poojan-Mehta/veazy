<?php

namespace App\Controller;

use Exception;
use RestApi\Controller\ApiController;
use RestApi\Utility\JwtToken;
use App\Controller\AppController;
use Cake\Controller\Component\AuthComponent;
use Cake\Event\Event;
use Cake\ORM\TableRegistry;
use Cake\Controller\ComponentRegistry;
use Cake\Controller\Component;
use Cake\Validation\Validator;
use Cake\Network\Exception\InternalErrorException;
use Cake\Utility\Text;
use Cake\Utility\Security;
use Cake\Filesystem\Folder;
use Cake\Filesystem\File;
use Cake\Mailer\Email;
use Cake\Auth\DefaultPasswordHasher;
use Cake\I18n\I18n;
use Cake\I18n\Time;
use Cake\Routing\Router;
use Cake\Datasource\ConnectionManager;
use Cake\Core\Configure;
use ZipArchive;
use Intervention\Image\ImageManagerStatic as Image;


class WebserviceController extends ApiController
{
    /*********************************************
     **** LOGIN/REGISTER & PROFILE UPDATE ********
     *********************************************/

    /* login method for login into frontend
     *
     * @param email ,password
     * @method post
     */

    //$permitted_chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    public $uids = '';
    public $tokens = '';

    public function generate_string($input, $strength = 16)
    {
        $input_length = strlen($input);
        $random_string = '';
        for ($i = 0; $i < $strength; $i++) {
            $random_character = $input[mt_rand(0, $input_length - 1)];
            $random_string .= $random_character;
        }
        echo $random_string;
        exit;
        return $random_string;
    }


    public function login()
    {
        $this->request->allowMethod('post');
        $connection = ConnectionManager::get('default');
        //echo $this->request->data['token']; exit;
        $token = '';
        if ($this->request->data['token'] != '' || $this->request->data != null) {
            $token = $this->request->data['token'];
        }
        if (empty($this->request->data['email'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['message'] = 'Email is required';
        } else if (empty($this->request->data['password'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['message'] = 'Password is required';
        } else {
            $email = $this->request->data['email'];
            $password_text = $this->request->data['password'];
            $password = md5($password_text);
            $checkUser = $connection->execute("SELECT mst_user.* FROM mst_user
                                               WHERE eUserStatus = 'active'
                                               AND vEmail = '" . $email . "'
                                               AND vPassword = '" . $password . "'")->fetchAll('assoc');

            if (count($checkUser) > 0) {

                $check_confirmation = $connection->execute("SELECT mst_user.* FROM mst_user
                                               WHERE eUserStatus = 'active'
                                               AND vEmail = '" . $email . "'
                                               AND vPassword = '" . $password . "'
                                               AND (confirm_token ='" . $token . "' OR is_confirmed = 'yes')
                                               ")->fetch('assoc');

                $UID =     $check_confirmation['iPkUserId'];



                if (!empty($check_confirmation)) {

                    $check_plan = $connection->execute("SELECT * FROM user_plan_payment
                                               WHERE iFkUserId = $UID ORDER BY iPkPlanPaymentId DESC")->fetch('assoc');

                    if ($check_plan['vStatus'] == 'inactive') {
                        $is_plan = 'no';
                    } else {
                        $is_plan = 'yes';
                    }

                    $update_is_confirmed = $connection->execute("UPDATE mst_user SET is_confirmed = 'yes',
                        confirm_token = '' WHERE vEmail = '" . $email . "' AND vPassword = '" . $password . "'");
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $payload = ['email' => $email, 'vpassword' => $password_text];
                    $token = JwtToken::generateToken($payload);
                    $encrypt_ID = md5($checkUser[0]['iPkUserId']);

                    $this->request->session()->write([
                        'user_id' => $checkUser[0]['iPkUserId'],
                        'uid' => $encrypt_ID,
                        'token' => $token
                    ]);

                    $uids = $encrypt_ID;
                    $tokens = $token;


                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['user_id'] = $encrypt_ID;
                    $this->apiResponse['api_token'] = $token;
                    $this->apiResponse['fname'] = $checkUser[0]['vFirstName'];
                    $this->apiResponse['lname'] = $checkUser[0]['vLastName'];
                    $this->apiResponse['email'] = $email;
                    $this->apiResponse['is_plan'] = $is_plan;
                    $this->apiResponse['iPkUserId'] = $checkUser[0]['iPkUserId'];
                } else {

                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Please Confirm your e-mail first.';
                }
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Invalid Email or Password';
            }
        }
    }

    public function logout()
    {
        $this->request->session()->destroy();
        $this->httpStatusCode = 200;
    }

    /*  signup method for registration from frontend
     *
     * @param firstname ,lastname,email,password
     * @method post
     */
    public function signup()
    {
        $confirm_token = substr(sha1(time()), 0, 20);
        $this->request->allowMethod('post');
        $connection = ConnectionManager::get('default');
        if (empty($this->request->data['firstname'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'First Name is required';
        } else if (empty($this->request->data['lastname'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Last Name is required';
        } else if (empty($this->request->data['email'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Email is required';
        } else if (empty($this->request->data['mobile'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Mobile is required';
        } else if (empty($this->request->data['password'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Password is required';
        } else {
            $email = $this->request->data['email'];
            $mobile = $this->request->data['mobile'];
            $checkEmailExist = $this->checkEmailExist($email);
            $checkMobileExist = $this->checkMobileExist($mobile);
            if (!$checkEmailExist) {
                if (!$checkMobileExist) {
                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');

                    $password_text = $this->request->data['password'];
                    $password = md5($password_text);
                    $statement = $connection->insert('mst_user', [
                        'vEmail' => $this->request->data['email'],
                        'vFirstName' => $this->request->data['firstname'],
                        'vLastName' => $this->request->data['lastname'],
                        'vPassword' => $password,
                        'vMobile' => $mobile,
                        'eUserStatus' => 'active',
                        'dtUserCreatedOn' => Time::now(),
                        'eIsVerified' => 'yes',
                        'confirm_token' => $confirm_token
                    ]);
                    $user_ID = $statement->lastInsertId('mst_user');
                    $connection->insert('mst_user_general_settings', ['user_id' => $user_ID, 'language' => 'en']);
                    $payload = ['email' => $email, 'vpassword' => $password_text];
                    $token = JwtToken::generateToken($payload);
                    $encrypt_ID = md5($user_ID);
                    $this->request->session()->write([
                        'user_id' => $user_ID,
                        'uid' => $encrypt_ID,
                        'token' => $token
                    ]);

                    $now = Time::now();


                    /** check general_setting plans*/
                    $checkdefaultplan = $connection->execute("SELECT vDefaultPlan,ITrialPeriod FROM `general_settings`")->fetch('assoc');
                    $planid = $checkdefaultplan['vDefaultPlan'];
                    $check_plan = $connection->execute("SELECT * FROM mst_plans where iPkPlanId = $planid")->fetch('assoc');

                    $expire_day = $checkdefaultplan['ITrialPeriod'];
                    $trial_end_date = date('Y-m-d H:i:s', strtotime($now . ' +' . $expire_day . ' day'));
                    if ($check_plan['ePlanFee'] == 'free') {
                        $connection->insert('user_plan_payment', [
                            'iFkUserId' => $user_ID,
                            'iFkUserPlanId' => $planid,
                            'vPlanType' => 'free',
                            'dPaymentAmount' => 0,
                            'vStatus' => 'active',
                            'is_trial' => 'yes',
                            'dtCreatedOn' => $now
                        ]);
                    } else {
                        $connection->insert('user_plan_payment', [
                            'iFkUserId' => $user_ID,
                            'iFkUserPlanId' => $planid,
                            'vPlanType' => $check_plan['Plan_Duration'],
                            'dPaymentAmount' => $check_plan['Plan_prices'],
                            'vStatus' => 'active',
                            'is_trial' => 'yes',
                            'dtCreatedOn' => $now,
                            'Trial_End_Date' => $trial_end_date,
                            'dtExpireDate' => $trial_end_date
                        ]);
                    }

                    /** send email start*/

                    $email = new Email();

                    $link = "<a href='https://" . $_SERVER['HTTP_HOST'] . "/login?token=" . $confirm_token . "'>";

                    $dir = new Folder(WWW_ROOT . 'templates');
                    $files = $dir->find('welcome.html', true);
                    foreach ($files as $file) {
                        $file = new File($dir->pwd() . DS . $file);
                        $contents = $file->read();
                        $file->close();
                    }

                    $patterns = array();
                    $outputs = preg_replace($patterns, '', $contents);

                    $message = str_replace(
                        array('{TITLE}', '{FIRSTNAME}', '{BODY}', '{EMAIL}', '{PASSWORD}'),
                        array('Successful Registration', $this->request->data['firstname'], $link, $this->request->data['email'], $this->request->data['password']),
                        $outputs
                    );

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
                        ->to([$this->request->data['email']])
                        //->to(['ts101230@hotmail.com'])
                        //->cc(['ts101230@hotmail.com'])
                        //->cc(['addon.akbar@gmail.com'])
                        ->subject('Successful Registration')
                        ->send($message);

                    /** send email end */

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['user_id'] = $encrypt_ID;
                    $this->apiResponse['api_token'] = $token;
                    $this->apiResponse['fname'] = $this->request->data['firstname'];
                    $this->apiResponse['lname'] = $this->request->data['lastname'];
                    $this->apiResponse['email'] = $this->request->data['email'];
                    $this->apiResponse['message'] = 'Please check your mail and verify it.';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Mobile number already in use';
                }
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Email already in use';
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

    public function checklogin()
    {
        $UID = $this->request->session()->read('uid');
        $TOKEN = $this->request->session()->read('token');
        $user_id = $this->request->session()->read('user_id');

        if ($UID == '' && $TOKEN == '') {
            $UID = $this->request->data('uid');
            $TOKEN = $this->request->data('token');
            $user_id = $this->request->data('iPkUserId');

            $this->request->session()->write([
                'user_id' => $user_id,
                'uid' => $UID,
                'token' => $TOKEN
            ]);
        }


        if ($UID == $this->request->data['uid'] && $TOKEN == $this->request->data['token']) {

            $user_data = TableRegistry::get('u', ['className' => 'mst_user'])->find()
                ->select(['u.vFirstName', 'u.vLastName', 'u.vEmail', 'u.vProfileImage', 'gs.language','u.classis_call'])
                ->leftJoin(['gs' => 'mst_user_general_settings'], ['gs.user_id =  u.iPkUserId'])
                ->where(['u.iPkUserId' => $user_id])->andWhere(['u.eUserStatus' => 'active'])->toArray();

            $this->httpStatusCode = 200;
            $this->apiResponse['fname'] = $user_data[0]->vFirstName;
            $this->apiResponse['lname'] = $user_data[0]->vLastName;
            $this->apiResponse['email'] = $user_data[0]->vEmail;
            $this->apiResponse['vProfileImage'] = $user_data[0]->vProfileImage;
            $this->apiResponse['classis_call'] = $user_data[0]->classis_call;
            $this->apiResponse['lang'] = $user_data[0]['gs']['language'];
        } else {
            $this->httpStatusCode = 402;
            $this->apiResponse['message'] = 'Your session has been expired. Please login again';
        }
    }

    public function checkToken($requestedUID, $requestedToken)
    {
        $UID = $this->request->session()->read('uid');

        $TOKEN = $this->request->session()->read('token');

        if ($UID != $requestedUID || $TOKEN != $requestedToken) {

            $data['code'] = 402;
            $data['message'] = 'Your session has been expired. Please login again';
            return $data;
        } else {


            $data['code'] = 200;
            return $data;
        }
    }

    /** new user check plan */
    public function logindefaultplan()
    {

        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);

        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');

            $connection = ConnectionManager::get('default');

            /** If Plan is Free Then Tr*/
            $general_settings = $connection->execute("SELECT * FROM general_settings")->fetch('assoc');
            $planId = $general_settings['vDefaultPlan'];
            $checkplan = $connection->execute("SELECT * FROM mst_plans WHERE iPkPlanId = $planId")->fetch('assoc');
            if ($checkplan['ePlanFee'] == 'free') {
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['flag'] = 'yes';
            } else {
                $checkuserplan = $connection->execute("SELECT * FROM user_plan_payment where iFkUserId = $UID")->fetch('assoc');

                if (!empty($checkuserplan)) {
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['flag'] = 'yes';
                } else {
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['flag'] = 'no';
                }
            }
        }
        //echo "<pre>"; print_r($checkuserplan); exit;

        //print_r($checkuserplan);

    }

    public function forgotpassword()
    {
        $otp = substr(sha1(time()), 0, 6);

        $connection = ConnectionManager::get('default');
        if (empty($this->request->data['email'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['message'] = 'Email is required';
        } else {
            $userEmail = $this->request->data['email'];
            $pathLink = $this->request->data['link'];
            $checkEmailExist = $this->checkEmailExist($userEmail);
            if ($checkEmailExist) {
                $KEY = $this->getToken(10);
                $user_ID = $checkEmailExist[0]['iPkUserId'];
                $firstName = $checkEmailExist[0]['vFirstName'];
                $connection->update('mst_user', ['reference_key' => $KEY, 'otp_code' => $otp], ['iPkUserId' => $user_ID]);
                $loginLink = '<center><a href="' . $pathLink . 'resetpassword?key=' . $KEY . '"><button style="background-image: linear-gradient(to right, #3961d0, #6e47e0);border: none;color: #fff;width: 190px;height: 50px;font-size: 15px;letter-spacing: 1px;font-weight: 600;sans-serif;border-radius: 5px;margin-bottom: 31px;">RESET PASSWORD</button></a></center>';
                $dir = new Folder(WWW_ROOT . 'templates');
                $files = $dir->find('forgot.html', true);
                foreach ($files as $file) {
                    $file = new File($dir->pwd() . DS . $file);
                    $contents = $file->read();
                    $file->close();
                }

                $patterns = array();
                $outputs = preg_replace($patterns, '', $contents);

                $message = str_replace(
                    array('{TITLE}', '{FIRSTNAME}', '{BODY}', '{LINK}'),
                    array('Password Reset Request', $firstName, '', 'OTP: ' . $otp),
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
                    ->to([$userEmail])
                    //->cc(['addon.akbar@gmail.com'])
                    ->subject('Password Reset Request')
                    ->send($message);

                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['email'] = $userEmail;
                //$this->apiResponse['message'] = 'Password reset link successfully sent. Please check your email';
                $this->apiResponse['message'] = 'OTP is Sent to your e-mail Please check';
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Email is not registered with us';
            }
        }
    }

    public function checkotp()
    {
        $connection = ConnectionManager::get('default');
        $email = $this->request->data['email'];
        $otp = $this->request->data['otp'];

        if (!empty($email) && !empty($otp)) {
            $check_user = $connection->execute("SELECT * FROM mst_user where vEmail = '" . $email . "'
             AND otp_code = '" . $otp . "'")->fetch('assoc');

            if (!empty($check_user)) {

                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['otp'] = $otp;
                $this->apiResponse['message'] = 'OTP successfully Match.';
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Invalid OTP.';
            }
        } else {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Something is missing. Please try again.';
        }
    }

    function getToken($length)
    {
        $token = "";
        $codeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        $codeAlphabet .= "abcdefghijklmnopqrstuvwxyz";
        $codeAlphabet .= "0123456789";
        $max = strlen($codeAlphabet); // edited

        for ($i = 0; $i < $length; $i++) {
            $token .= $codeAlphabet[$this->crypto_rand_secure(0, $max - 1)];
        }
        return $token;
    }

    function crypto_rand_secure($min, $max)
    {
        $range = $max - $min;
        if ($range < 1) return $min; // not so random.
        $log = ceil(log($range, 2));
        $bytes = (int)($log / 8) + 1; // length in bytes
        $bits = (int)$log + 1; // length in bits
        $filter = (int)(1 << $bits) - 1; // set all lower bits to 1
        do {
            $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));
            $rnd = $rnd & $filter; // discard irrelevant bits
        } while ($rnd > $range);
        return $min + $rnd;
    }

    /*public function resetpassword()
    {
        $this->request->allowMethod('post');
        $key = $this->request->data['key'];
        if (empty($this->request->data['password'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'New Password is required';
        } else {
            $password_text = $this->request->data['password'];
            $password = md5($password_text);
            $connection = ConnectionManager::get('default');
            $checkUser = $connection->execute("SELECT * FROM `mst_user` WHERE  `reference_key` = '" . $key . "'")->fetchAll('assoc');
            if (count($checkUser)) {
                $user_ID = $checkUser[0]['iPkUserId'];
                $connection->update('mst_user', ['vPassword' => $password, 'reference_key' => null], ['iPkUserId' => $user_ID]);
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['message'] = 'Your password has been reset successfully';
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Link has been expired';
            }
        }
    }*/

    public function resetpassword()
    {
        $this->request->allowMethod('post');
        $otp = $this->request->data['otp'];
        $is_key = $this->request->data['is_key'];
        if (empty($this->request->data['password'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'New Password is required';
        } else {
            $password_text = $this->request->data['password'];
            $password = md5($password_text);
            $connection = ConnectionManager::get('default');
            if ($is_key == true) {
                $checkUser = $connection->execute("SELECT * FROM `mst_user` WHERE  `reference_key` = '" . $otp . "'")->fetchAll('assoc');
            } else {
                $checkUser = $connection->execute("SELECT * FROM `mst_user` WHERE  `otp_code` = '" . $otp . "'")->fetchAll('assoc');
            }

            if (count($checkUser)) {
                $user_ID = $checkUser[0]['iPkUserId'];
                $connection->update('mst_user', ['vPassword' => $password, 'otp_code' => null], ['iPkUserId' => $user_ID]);
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                if ($is_key == true) {
                    $this->apiResponse['message'] = 'You have successfully set your Password';
                } else {
                    $this->apiResponse['message'] = 'Your password has been reset successfully';
                }
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Link has been expired';
            }
        }
    }

    public function getProfile()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);

        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {

            $UID = $this->request->session()->read('user_id');
            $connection = ConnectionManager::get('default');
            $checkUser = $connection->execute("SELECT * FROM `mst_user` WHERE  `iPkUserId` = '" . $UID . "'")->fetch('assoc');
            unset($checkUser['vPassword']);
            unset($checkUser['reference_key']);
            unset($checkUser['oauth_uid']);
            unset($checkUser['oauth_provider']);
            unset($checkUser['eUserStatus']);
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $checkUser;
        }
    }

    public function updateProfile()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $this->request->allowMethod('post');
            $connection = ConnectionManager::get('default');
            $UID = $this->request->session()->read('user_id');

            if (empty($this->request->data['firstname'])) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'First Name is required';
            } else if (empty($this->request->data['lastname'])) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Last Name is required';
            }/*else if (empty($this->request->data['address'])) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Address is required';
            }*/ else if (empty($this->request->data['email'])) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Email is required';
            } else {
                $email = $this->request->data['email'];
                $address = $this->request->data['address'];
                $checkEmailExist = $connection->execute("SELECT * FROM `mst_user` WHERE  `vemail` = '" . $email . "' AND `iPkUserId` != '" . $UID . "'")->fetchAll('assoc');
                if (count($checkEmailExist) == 0) {
                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                    $connection->update('mst_user', ['vFirstName' => $this->request->data['firstname'], 'vLastName' => $this->request->data['lastname'], 'eGender' => $this->request->data['gender'], 'vEmail' => $email, 'vAddress' => $address, 'dtUserUpdatedOn' => Time::now()], ['iPkUserId' => $UID]);

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Your profile has been updated successfully';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Email already in use';
                }
            }
        }
    }

    public function changeAvatar()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $this->request->allowMethod('post');
            $connection = ConnectionManager::get('default');
            $UID = $this->request->session()->read('user_id');
            $currentprofile = $this->request->session()->read('vProfileImage');

            $target_dir = WWW_ROOT . 'avatar/';
            if (isset($this->request->data['profilepic']['name'])) {
                $target_file = $target_dir . basename($this->request->data['profilepic']['name']);
                $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                $current = strtotime("now");

                $image_name = $current . '.' . $imageFileType;
                $target_file = $target_dir . $image_name;
                if (move_uploaded_file($this->request->data["profilepic"]["tmp_name"], $target_file)) {
                    if ($currentprofile != 'default_user.png') {
                        if (file_exists($target_dir . $currentprofile)) {
                            unlink($target_dir . $currentprofile);
                        }
                    }
                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                    $connection->update('mst_user', ['vProfileImage' => $image_name, 'dtUserUpdatedOn' => Time::now()], ['iPkUserId' => $UID]);
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Your profile picture has been updated';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Unable to update your profile picture';
                }
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Please select profile picture';
            }
        }
    }

    public function changePassword()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $this->request->allowMethod('post');
            $UID = $this->request->session()->read('user_id');

            $currentpassword = $this->request->data['currentpassword'];
            $currentpassword = md5($currentpassword);
            if (empty($this->request->data['password'])) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'New Password is required';
            } else {
                $password_text = $this->request->data['password'];
                $password = md5($password_text);
                $connection = ConnectionManager::get('default');
                $checkUser = $connection->execute("SELECT * FROM `mst_user` WHERE  `vPassword` = '" . $currentpassword . "' AND `iPkUserId` = '" . $UID . "'")->fetchAll('assoc');
                if (count($checkUser)) {
                    $connection->update('mst_user', ['vPassword' => $password], ['iPkUserId' => $UID]);
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Your password has been reset successfully. Please login again';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Invalid Current Password';
                }
            }
        }
    }

    public function changeLanguage()
    {
        $connection = ConnectionManager::get('default');
        $UID = $this->request->session()->read('user_id');
        $checkUser = $connection->execute("SELECT * FROM `mst_user_general_settings` WHERE  `user_id` = '" . $UID . "'")->fetchAll('assoc');
        if (count($checkUser)) {
            $connection->update('mst_user_general_settings', ['language' => $this->request->data['lang']], ['user_id' => $UID]);
        } else {
            $connection->insert('mst_user_general_settings', ['user_id' => $UID, 'language' => $this->request->data['lang']]);
        }
        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
    }

    /*********************************************
     ************* MARKET PLACE ******************
     *********************************************/

    /* GET APPLICATION LISTING BASED ON CATEGORIES */
    public function getProductByCategories()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $IMAGE_PATH = image_url() . 'product/';
            $connection = ConnectionManager::get('default');

            $categories = $connection->execute("SELECT * FROM mst_visa_category WHERE eVisaCatStatus = 'active' ORDER BY iPkVisaCatId ASC")->fetchAll('assoc');

            $market_place = $connection->execute("SELECT * FROM mst_marketplace WHERE eType = 'product' AND is_Visible = 'active' ORDER BY iPKMPId ASC")->fetchAll('assoc');
            $temp = array();
            foreach ($market_place as $mp) {
                $tmp = array();
                $temp_records = array();
                foreach ($categories as $cat) {
                    $records = $connection->execute("SELECT mvp.*,CONCAT('" . $IMAGE_PATH . "', mvp.vVisaProductImage) AS vVisaProductImage FROM  mst_visa_product AS mvp WHERE mvp.iFkVisaCatId = '" . $cat['iPkVisaCatId'] . "' AND mvp.iFKMPId = '" . $mp['iPKMPId'] . "' AND mvp.eVisaProductStatus = 'active' AND mvp.is_Visible = 'active' ORDER BY mvp.iPkVisaProductId ASC")->fetchAll('assoc');
                    if (!empty($records)) {
                        $tmp[$cat['vVisaCat']] = $records;
                        $temp_records[] = $records;
                    }
                }
                if (!empty($temp_records)) {
                    $temp[$mp['vMPName']] = $tmp;
                }
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $temp;
        }
    }

    /* checkoutfreeproduct method for purchasing free product
     *
     * @param productID ,uid,token,type
     * @method post
     */

    /** Current Plan */
    public function currentplan()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {

            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {

            $connection = ConnectionManager::get('default');

            $UID = $this->request->session()->read('user_id');
            $now = date('Y-m-d H:i:s');
            $get_user = $connection->execute("SELECT * FROM mst_user WHERE eUserStatus='active' AND iPkUserId = '" . $UID . "'")->fetch('assoc');

            $currentplan = $connection->execute("SELECT * FROM user_plan_payment WHERE vStatus='active' AND iFkUserId = '" . $UID . "'")->fetch('assoc');
            
            /** comment by poojan start*/
            /*if (empty($currentplan)) {
                $currentplan['is_plan_exists'] = 'no';
            } else  {
                $currentplan['is_plan_exists'] = 'yes';
            }*/
            /** comment by poojan end*/
            
            /** added by poojan start*/
            if (empty($currentplan)) {
                $currentplan['is_plan_exists'] = 'no';
                $currentplan['already_has_plan'] = 'no';
            } else if(!empty($currentplan['dtExpireDate']) && $now > $currentplan['dtExpireDate']) {
                $currentplan['is_plan_exists'] = 'no';
                $currentplan['already_has_plan'] = 'yes';
            } else {
                $currentplan['is_plan_exists'] = 'yes';
                $currentplan['already_has_plan'] = 'yes';
            }
            /** added by poojan end*/
            

            $mst_plans = $connection->execute("SELECT mst_plans.*,mst_package.vPackageName FROM mst_plans
            LEFT JOIN mst_package ON mst_package.iPkPackageId  = mst_plans.iFkPackageId 
            WHERE ePlanStatus = 'active' AND iPkPlanId = '" . $currentplan['iFkUserPlanId'] . "' ORDER BY dPlanMonthlyPrice ASC")->fetch('assoc');

            $currentplan['Plan_names'] = $mst_plans['Plan_names'];
            $currentplan['vPackageName'] = $mst_plans['vPackageName'];
            $currentplan['Pro_Features'] = $mst_plans['Pro_Features'];
            $currentplan['AllowLessons'] = $mst_plans['AllowLessons'];
            $currentplan['AllowTemplates'] = $mst_plans['AllowTemplates'];
            $currentplan['AllowDC'] = $mst_plans['AllowDC'];
            $currentplan['vEmail'] = $get_user['vEmail'];
            $currentplan['vAddress'] = $get_user['vAddress'];
            $paymentDate = $currentplan['dtPaymentOn'];
            $ExpireDate = $currentplan['dtExpireDate'];
            $dtCreatedOn = $currentplan['dtCreatedOn'];
            $Trial_End_Date = $currentplan['Trial_End_Date'];

            $currentplan['is_trial'] = false;
            if ($Trial_End_Date != '' || $Trial_End_Date != null) {
                $currentplan['Trial_End_Date'] = date("jS F Y", strtotime($Trial_End_Date));
                $currentplan['is_trial'] = true;
            }
            //echo $ExpireDate; exit;
            if ($ExpireDate != '') {
                $currentplan['Expiredate'] = date("jS F Y", strtotime($ExpireDate));
            } else {
                $currentplan['Expiredate'] = '-';
            }
            $currentplan['paymentdate'] = date("jS F Y", strtotime($paymentDate));
            $currentplan['dtCreatedOn'] = date("jS F Y", strtotime($dtCreatedOn));
            if ($current_plan['dtCreatedOn'] == '1st January 1970') {
                $current_plan['dtCreatedOn'] = '-';
            }
            //echo $currentplan['paymentdate']; exit;

            //echo "<pre>"; print_r($currentplan); exit;
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $currentplan;
        }
    }

    /** cancle plan */
    public function cancleplan()
    {

        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');

            $UID = $this->request->session()->read('user_id');

            $currentplan = $connection->execute("SELECT * FROM user_plan_payment WHERE vStatus='active' AND iFkUserId = '" . $UID . "'")->fetch('assoc');
            if (!empty($currentplan)) {

                if ($currentplan['vPlanType'] != 'free') {
                    $get_user_subscription_detail = $connection->execute("select subscription_id from user_plan_payment where iFkUserId='$UID' AND vStatus='active'")->fetchAll('assoc');
                    //echo "<pre>"; print_r($get_user_subscription_detail); exit;
                    $get_user_subscription_id = $get_user_subscription_detail[0]['subscription_id'];

                    require_once(ROOT . DS . 'stripe' . DS . 'init.php');

                    \Stripe\Stripe::setApiKey(stripe_secret_key);
                    \Stripe\Stripe::setVerifySslCerts(false);
                    $subscription = \Stripe\Subscription::retrieve($get_user_subscription_id);
                    $subscription->cancel();

                    if ($subscription->status == 'canceled') {
                        $connection->update('user_plan_payment', ['vStatus' => 'inactive'], ['iFkUserId' => $UID]);
                        $this->httpStatusCode = 200;
                        $this->apiResponse['valid'] = true;
                        $this->apiResponse['message'] = 'Your Plan has been Cancelled';
                    } else {
                        $error = 'Server Error. Something went wrong.';
                        $connection->rollback();
                        $this->response('f', '', $error);
                    }
                } else {
                    $connection->update('user_plan_payment', ['vStatus' => 'inactive'], ['iFkUserId' => $UID]);
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Your Plan has been Cancelled';
                }
            } else {
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Currently You do not have Any Plan';
            }
        }
    }

    public function checkoutfreeproduct()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $now = date('Y-m-d H:i:s');
            $connection = ConnectionManager::get('default');
            $product_ID = $this->request->data['productID'];
            $UID = $this->request->session()->read('user_id');
            $record = $connection->execute("SELECT mvp.* FROM  mst_visa_product as mvp WHERE mvp.iPkVisaProductId = '" . $product_ID . "' AND mvp.eVisaProductStatus = 'active'")->fetch('assoc');

            if (!empty($record)) {
                if ($record['eVisaproductFee'] == 'free') {

                    /* Check Their current plan */
                    $currentplan = $connection->execute("SELECT * FROM user_plan_payment WHERE vStatus = 'active' AND iFkUserId = '" . $UID . "'")->fetch('assoc');

                    $getplaninfo = $connection->execute("SELECT * FROM mst_plans WHERE ePlanStatus = 'active' AND iPkPlanId = '" . $currentplan['iFkUserPlanId'] . "'")->fetch('assoc');
                    //echo "<pre>"; print_r($getplaninfo); exit;
                    $no_application = $getplaninfo['no_application'];

                    /* fetch inserted product*/
                    $checkuserproduct = $connection->execute("SELECT * FROM user_products WHERE eUserProductStatus = 'active' AND iFkUserId = '" . $UID . "'")->fetchAll('assoc');
                    $check = count($checkuserproduct);

                    if ($no_application > $check) {
                        $query = $connection->insert('user_products', [
                            'iFkUserId' => $UID,
                            'iFkVisaProductId' => $product_ID,
                            'vUserProductTitle' => $record['vVisaProductTitle'],
                            'vUserProductDesc' => $record['vVisaProductDesc'],
                            'vUserProductImage' => $record['vVisaProductImage'],
                            'eUserProAccessType' => 'free',
                            'eUserProductStatus' => 'active',
                            'vLodgmentStatus' => 'Preparing',
                            'eUserProductStartDate' => $now,
                            'dtUserProductPurchasedOn' => $now
                        ]);

                        $USER_PRODUCT_ID = $query->lastInsertId('user_products');

                        $this->httpStatusCode = 200;
                        $this->apiResponse['valid'] = true;
                        $this->apiResponse['message'] = 'Thank you for adding this application.';
                    } else {
                        $this->httpStatusCode = 402;
                        $this->apiResponse['valid'] = false;
                        $this->apiResponse['message'] = 'You have already reached the maximum number of allowed simultaneous applications on your current plan. Please upgrade your plan in order to add more applications.';
                    }
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Invalid product selection';
                }
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
            }
        }
    }

    /*********************************************
     ************* MASTER DASHBOARD **************
     *********************************************/

    /* GET APPLICATION LISTING BASED ON PERTICULAR USER ID */
    public function getUserProduct()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);

        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $connection = ConnectionManager::get('default');
            $IMAGE_PATH = image_url() . 'product/';
            $current_date = date('Y-m-d H:i:s');

            $products = $connection->execute("SELECT up.*,mvp.*,mvc.vVisaCat,plink.* FROM user_products AS up
                        LEFT JOIN user_products_linking AS plink ON up.iPkUserProductId = plink.iFkUserProductId OR up.iPkUserProductId = plink.iFkUserProductIdLinked
                        LEFT JOIN mst_visa_product AS mvp ON mvp.iPkVisaProductId = up.iFkVisaProductId
                        LEFT JOIN mst_visa_category AS mvc ON mvc.iPkVisaCatId = mvp.iFkVisaCatId
                        WHERE up.iFkUserId = '" . $UID . "' AND up.eUserProductStatus = 'active' ORDER BY dtDeadLineDate ASC")->fetchAll('assoc');

            $records = array();

            foreach ($products as $key => $product) {
                $product['linked_product'] = '';
                if (!empty($product['iPkLinkId'])) {
                    if ($product['iFkUserProductId'] != $product['iPkUserProductId']) {
                        $product['linked_product'] = urlencode(urlencode(Security::encrypt($product['iFkUserProductId'], ENCRYPTION_KEY)));
                    } else {
                        $product['linked_product'] = urlencode(urlencode(Security::encrypt($product['iFkUserProductIdLinked'], ENCRYPTION_KEY)));
                    }
                }
                if ($this->request->query['limit'] == '2') {
                    if ($key < 2) {
                        $records[] = $product;
                        $iPkUserProductId = Security::encrypt($product['iPkUserProductId'], ENCRYPTION_KEY);
                        $records[$key]['iPkUserProductId'] = urlencode(urlencode($iPkUserProductId));
                        $records[$key]['eUserProStartDate'] = date('jS F Y', strtotime($product['eUserProductStartDate']));

                        if ($product['dtDeadLineDate'] == '') {
                            $records[$key]['dtDeadLineDate'] = '-';
                        } else {
                            $records[$key]['duedate'] = date('l, jS F Y', strtotime($product['dtDeadLineDate']));
                            $records[$key]['dtDeadLineDate'] = $product['dtDeadLineDate'];
                        }

                        $records[$key]['is_date_max'] = false;
                        if ($product['dtDeadLineDate'] > $current_date) {
                            $records[$key]['is_date_max'] = true;
                        }
                        if ($product['eUserProductStatus'] == 'active') {
                            $records[$key]['eUserProStatus'] = 'Active';
                        } else {
                            $records[$key]['eUserProStatus'] = 'Archived';
                        }
                        $records[$key]['pid'] = $product['iPkUserProductId'];
                        $records[$key]['vUserProductImage'] = $IMAGE_PATH . $product['vUserProductImage'];
                        $records[$key]['keyProgress'] = $this->getKeyprogress($product);
                    }
                } else {
                    $records[] = $product;
                    $iPkUserProductId = Security::encrypt($product['iPkUserProductId'], ENCRYPTION_KEY);
                    $records[$key]['iPkUserProductId'] = urlencode(urlencode($iPkUserProductId));
                    $records[$key]['eUserProStartDate'] = date('d, M Y', strtotime($product['eUserProductStartDate']));

                    if ($product['dtDeadLineDate'] == '') {
                        $records[$key]['dtDeadLineDate'] = '-';
                    } else {
                        $records[$key]['duedate'] = date('l, jS F Y', strtotime($product['dtDeadLineDate']));
                        $records[$key]['dtDeadLineDate'] = $product['dtDeadLineDate'];
                    }

                    $records[$key]['is_date_max'] = false;
                    if ($product['dtDeadLineDate'] > $current_date) {
                        $records[$key]['is_date_max'] = true;
                    }
                    if ($product['eUserProductStatus'] == 'active') {
                        $records[$key]['eUserProStatus'] = 'Active';
                    } else {
                        $records[$key]['eUserProStatus'] = 'Archived';
                    }
                    $records[$key]['pid'] = $product['iPkUserProductId'];
                    $records[$key]['vUserProductImage'] = $IMAGE_PATH . $product['vUserProductImage'];
                    $records[$key]['keyProgress'] = $this->getKeyprogress($product);
                }
            }
            foreach ($records as $key2 => $value2) {
                # code...
                if ($value2['dtDeadLineDate'] == "-") {
                    unset($records[$key2]);
                    $records[] = $value2;
                }
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $records;
            $this->apiResponse['total_products'] = count($products);
        }
    }

    /* GET APPLICATION LISTING BASED ON PERTICULAR USER ID */
    public function getUserProductdashboard()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);

        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $connection = ConnectionManager::get('default');
            $IMAGE_PATH = image_url() . 'product/';
            $current_date = date('Y-m-d H:i:s');

            $products = $connection->execute("SELECT up.*,mvp.*,mvc.vVisaCat,plink.* FROM user_products AS up
                        LEFT JOIN user_products_linking AS plink ON up.iPkUserProductId = plink.iFkUserProductId OR up.iPkUserProductId = plink.iFkUserProductIdLinked
                        LEFT JOIN mst_visa_product AS mvp ON mvp.iPkVisaProductId = up.iFkVisaProductId
                        LEFT JOIN mst_visa_category AS mvc ON mvc.iPkVisaCatId = mvp.iFkVisaCatId
                        WHERE up.iFkUserId = '" . $UID . "' AND up.eUserProductStatus = 'active' ORDER BY up.dtUserProductPurchasedOn DESC limit 2")->fetchAll('assoc');

            //echo "<pre>"; print_r($products); exit();

            $records = array();

            foreach ($products as $key => $product) {
                $product['linked_product'] = '';
                if (!empty($product['iPkLinkId'])) {
                    if ($product['iFkUserProductId'] != $product['iPkUserProductId']) {
                        $product['linked_product'] = urlencode(urlencode(Security::encrypt($product['iFkUserProductId'], ENCRYPTION_KEY)));
                    } else {
                        $product['linked_product'] = urlencode(urlencode(Security::encrypt($product['iFkUserProductIdLinked'], ENCRYPTION_KEY)));
                    }
                }
                if ($this->request->query['limit'] == '2') {
                    if ($key < 2) {
                        $records[] = $product;
                        $iPkUserProductId = Security::encrypt($product['iPkUserProductId'], ENCRYPTION_KEY);
                        $records[$key]['iPkUserProductId'] = urlencode(urlencode($iPkUserProductId));
                        $records[$key]['eUserProStartDate'] = date('jS F Y', strtotime($product['eUserProductStartDate']));

                        if ($product['dtDeadLineDate'] == '') {
                            $records[$key]['dtDeadLineDate'] = '-';
                        } else {
                            $records[$key]['duedate'] = date('l, jS F Y', strtotime($product['dtDeadLineDate']));
                            $records[$key]['dtDeadLineDate'] = $product['dtDeadLineDate'];
                        }

                        $records[$key]['is_date_max'] = false;
                        if ($product['dtDeadLineDate'] > $current_date) {
                            $records[$key]['is_date_max'] = true;
                        }
                        if ($product['eUserProductStatus'] == 'active') {
                            $records[$key]['eUserProStatus'] = 'Active';
                        } else {
                            $records[$key]['eUserProStatus'] = 'Archived';
                        }
                        $records[$key]['pid'] = $product['iPkUserProductId'];
                        $records[$key]['vUserProductImage'] = $IMAGE_PATH . $product['vUserProductImage'];
                        $records[$key]['keyProgress'] = $this->getKeyprogress($product);
                    }
                } else {
                    $records[] = $product;
                    $iPkUserProductId = Security::encrypt($product['iPkUserProductId'], ENCRYPTION_KEY);
                    $records[$key]['iPkUserProductId'] = urlencode(urlencode($iPkUserProductId));
                    $records[$key]['eUserProStartDate'] = date('d, M Y', strtotime($product['eUserProductStartDate']));

                    if ($product['dtDeadLineDate'] == '') {
                        $records[$key]['dtDeadLineDate'] = '-';
                    } else {
                        $records[$key]['duedate'] = date('l, jS F Y', strtotime($product['dtDeadLineDate']));
                        $records[$key]['dtDeadLineDate'] = $product['dtDeadLineDate'];
                    }

                    $records[$key]['is_date_max'] = false;
                    if ($product['dtDeadLineDate'] > $current_date) {
                        $records[$key]['is_date_max'] = true;
                    }
                    if ($product['eUserProductStatus'] == 'active') {
                        $records[$key]['eUserProStatus'] = 'Active';
                    } else {
                        $records[$key]['eUserProStatus'] = 'Archived';
                    }
                    $records[$key]['pid'] = $product['iPkUserProductId'];
                    $records[$key]['vUserProductImage'] = $IMAGE_PATH . $product['vUserProductImage'];
                    $records[$key]['keyProgress'] = $this->getKeyprogress($product);
                }
            }
            /*foreach ($records as $key2 => $value2) {
                # code...
                if ($value2['dtDeadLineDate'] == "-")
                { 
                    unset($records[$key2]);
                    $records[] = $value2;
                }

            }*/

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $records;
            $this->apiResponse['total_products'] = count($products);
        }
    }

    public function updateDeadlineDate()
    {

        $pid = $this->request->data['pid'];
        $dtDeadLineDate = $this->request->data['dtDeadLineDate'];

        $uid = $this->request->data['uid'];
        $token = $this->request->data['token'];
        $type = $this->request->data['type'];
        $connection = ConnectionManager::get('default');

        if (!empty($pid && $dtDeadLineDate)) {

            $update_user_product = $connection->update('user_products', ['dtDeadLineDate' => $dtDeadLineDate], ['iPkUserProductId' => $pid]);
        } else {

            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
        }
    }

    public function getKeyprogress($product)
    {
        $UID = $this->request->session()->read('user_id');
        $user_product_id = $product['iPkUserProductId'];

        $summary_folder_ids = explode(',', $product['iFkSummaryId']);
        $todo_folder_ids = explode(',', $product['iFkToDoId']);
        $total_lessons = 0;
        $total_summary = 0;
        $total_todo = 0;
        $total_doc = 0;
        $total_lessons_completed = 0;
        $total_summary_completed = 0;
        $total_todo_completed = 0;
        $total_doc_completed = 0;


        if (!empty($product['iFkLessonId'])) {
            $lesson_folder_ids = explode(',', $product['iFkLessonId']);
            $lessons_data = TableRegistry::get('ml', ['className' => 'mst_lessons'])->find()
                ->select([
                    'total_lessons' => 'COUNT(ml.iPkLessonId)',
                    'total_lessons_completed' => 'SUM(CASE WHEN ul.iPkUserLessonId != "" THEN 1 ELSE 0 END)'
                ])
                ->leftJoin(['ul' => 'user_lesson'], ['ul.iFkLessonId =  ml.iPkLessonId', 'ul.iFkUserProductId' => $user_product_id, 'ul.eIsCompleted' => '1'])
                ->where(['ml.iFkFolderId IN' => $lesson_folder_ids])->andWhere(['ml.eLessonStatus' => 'active'])->toArray();

            $total_lessons = $lessons_data[0]->total_lessons;
            $total_lessons_completed = $lessons_data[0]->total_lessons_completed;
        }

        if (!empty($product['iFkSummaryId'])) {
            $summary_data = TableRegistry::get('msoc', ['className' => 'mst_summary_of_criteria'])->find()
                ->select([
                    'total_summary' => 'COUNT(msoc.iPkSummaryId)',
                    'total_summary_completed' => 'SUM(CASE WHEN usoc.iPkUserSummaryId != "" THEN 1 ELSE 0 END)'
                ])
                ->leftJoin(['usoc' => 'user_summary_criteria'], ['usoc.iFkSummaryId =  msoc.iPkSummaryId', 'usoc.iFkUserProductId' => $user_product_id, 'usoc.eIsCompleted' => '1'])
                ->where(['msoc.iFkFolderId IN' => $summary_folder_ids])->andWhere(['msoc.eSummaryStatus' => 'active'])->toArray();

            $total_summary = $summary_data[0]->total_summary;
            $total_summary_completed = $summary_data[0]->total_summary_completed;
        }

        if (!empty($product['iFkToDoId'])) {
            $system_todo_data = TableRegistry::get('mtd', ['className' => 'mst_todo'])->find()
                ->select(['total_todo' => 'COUNT(mtd.iPkToDoId)', 'total_todo_completed' => 'SUM(CASE WHEN utd.iPkUserToDoId != "" THEN 1 ELSE 0 END)'])
                ->leftJoin(['utd' => 'user_todo'], ['utd.iFkToDoId = mtd.iPkToDoId', 'utd.iFkUserProductId' => $user_product_id, 'utd.eUserToDoType' => 'system', 'utd.eIsCompleted' => '1'])
                ->where(['mtd.iFkFolderId IN' => $todo_folder_ids])->andWhere(['mtd.eToDoStatus' => 'active'])->toArray();

            $total_todo = $system_todo_data[0]->total_todo;
            $total_todo_completed = $system_todo_data[0]->total_todo_completed;
        }

        if ($product['eAllowDocumentChecklist'] == 'yes') {
            $documents = TableRegistry::get('md', ['className' => 'mst_documents'])->find()
                ->select(['total_doc' => 'COUNT(md.iPkDocId)', 'total_doc_completed' => 'SUM(CASE WHEN ud.iPkUserDocId != "" THEN 1 ELSE 0 END)'])
                ->leftJoin(['tag' => 'mst_tags'], ['tag.iDocFolderId =  md.iFkFolderId'])
                ->leftJoin(['ur' => 'user_relationship'], ['ur.iFkTagId =  tag.iPKTagId'])
                ->leftJoin(['ud' => 'user_required_documents'], ['ud.iFkDocId = md.iPkDocId', 'ud.iFkUserRelationId = ur.iPkUserRelationId', 'ud.iFkUserProductId = ur.iFkUserProductId', 'ud.eUserDocType' => 'system', '(ud.eUserDocStatus="collected" OR ud.eUserDocStatus="notapplicable")'])
                ->where(['ur.iFkUserProductId' => $user_product_id])->andWhere(['md.eDocStatus' => 'active'])->distinct()->toArray();

            if ($documents[0]['total_doc'] != 0) {
                $total_doc = $documents[0]->total_doc;
                $total_doc_completed = $documents[0]->total_doc_completed;
            }
        }

        if ($total_lessons == 0 && $total_summary == 0 && $total_todo == 0 && $total_doc == 0) {
            $completed_percentage = 0;
        } else {
            $Overall_total = $total_lessons + $total_summary + $total_todo + $total_doc;
            $Overall_completed = $total_lessons_completed + $total_summary_completed + $total_todo_completed + $total_doc_completed;
            $completed_percentage = round(($Overall_completed / $Overall_total) * 100, 1);
        }

        return $completed_percentage;
    }

    public function searchProduct()
    {

        /*$checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {*/
        $UID = $this->request->session()->read('user_id');
        $connection = ConnectionManager::get('default');
        $IMAGE_PATH = image_url() . 'product/';
        $records = array();

        if (!empty($this->request->query['query'])) {
            $products = $connection->execute("SELECT up.*,mvp.* FROM user_products AS up
                        LEFT JOIN mst_visa_product AS mvp ON mvp.iPkVisaProductId = up.iFkVisaProductId
                        WHERE up.iFkUserId = '" . $UID . "' AND up.vUserProductTitle LIKE '%" . $this->request->query['query'] . "%' ORDER BY up.vUserProductTitle ASC")->fetchAll('assoc');


            foreach ($products as $key => $product) {
                $iPkUserProductId = Security::encrypt($product['iPkUserProductId'], ENCRYPTION_KEY);
                $tmp = array('id' => $product['iPkUserProductId'], 'name' => $product['vUserProductTitle'], 'link' => "product?vpid=" . urlencode(urlencode($iPkUserProductId)), 'image' => $IMAGE_PATH . $product['vUserProductImage']);
                $records['Applications'][] = $tmp;
            }
        }
        echo json_encode(array('suggests' => $records));
        exit;
        //}
    }

    /* UPDATE APPLICATION PROFILE PICTURE */
    public function updateAppicationProfile()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $this->request->allowMethod('post');
            $connection = ConnectionManager::get('default');
            $UID = $this->request->session()->read('user_id');
            $user_product_ID = $this->request->data['pid'];

            $target_dir = WWW_ROOT . 'product/';
            if (isset($this->request->data['profilepic']['name'])) {
                $target_file = $target_dir . basename($this->request->data['profilepic']['name']);
                $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                $current = strtotime("now");

                $image_name = 'product_' . $current . '_org.' . $imageFileType;
                $image_name1 = 'product_' . $current . '_300x300.' . $imageFileType;
                $target_file = $target_dir . $image_name;
                Image::configure(array('driver' => 'gd'));
                if (move_uploaded_file($this->request->data["profilepic"]["tmp_name"], $target_file)) {
                    $record = $connection->execute("SELECT mvp.vVisaProductImage, up.vUserProductImage
                                        FROM user_products AS up
                                        LEFT JOIN mst_visa_product AS mvp ON mvp.iPkVisaProductId = up.iFkVisaProductId
                                        WHERE up.iFkUserId = '" . $UID . "' AND up.iPkUserProductId = '" . $user_product_ID . "'")->fetch('assoc');
                    if ($record['vVisaProductImage'] != $record['vUserProductImage']) {
                        if (file_exists($target_dir . $record['vUserProductImage'])) {
                            unlink($target_dir . $record['vUserProductImage']);
                            unlink($target_dir . str_replace("org", "300x300", $record['vUserProductImage']));
                        }
                    }
                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                    Image::make($target_file)->resize(200, 200)->save($target_dir . $image_name1);
                    $connection->update('user_products', ['vUserProductImage' => $image_name], ['iPkUserProductId' => $user_product_ID]);
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Product image has been updated';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Unable to update product image';
                }
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Please select image';
            }
        }
    }

    /* APPLICATION LISTING WHICH ARE NOT LINKED YET */
    public function getlinkapplication()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $connection = ConnectionManager::get('default');
            $IMAGE_PATH = image_url() . 'product/';
            $product_id = $this->request->data['pid'];

            $products = $connection->execute("SELECT up.*,plink.* FROM user_products AS up
LEFT JOIN user_products_linking AS plink ON up.iPkUserProductId = plink.iFkUserProductId OR up.iPkUserProductId = plink.iFkUserProductIdLinked
WHERE plink.iPkLinkId IS NULL AND up.iFkUserId = '" . $UID . "' AND up.eUserProductStatus = 'active' AND up.iPkUserProductId != '" . $product_id . "' ORDER BY dtUserProductPurchasedOn DESC")->fetchAll('assoc');

            $records = array();
            foreach ($products as $key => $product) {
                $product['vUserProductImage'] = $IMAGE_PATH . $product['vUserProductImage'];
                $records[] = $product;
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $records;
            $this->apiResponse['total_products'] = count($records);
        }
    }

    /* MARKED APPLICATION AS A LINKED WITH EACHOTHER*/
    public function confirmlink()
    {
        $connection = ConnectionManager::get('default');
        $product_id = $this->request->data['pid'];
        $link_product_id = $this->request->data['lpid'];
        $connection->insert('user_products_linking', [
            'iFkUserProductId' => $product_id,
            'iFkUserProductIdLinked' => $link_product_id
        ]);
        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
    }

    /* MARKED APPLICATION AS A UNLINKED */
    public function confirmunlink()
    {
        $connection = ConnectionManager::get('default');
        $product_id = $this->request->query['pid'];
        $user_product_ID = Security::decrypt(urldecode($product_id), ENCRYPTION_KEY);
        $connection->execute("DELETE FROM user_products_linking WHERE iFkUserProductId ='" . $user_product_ID . "' OR iFkUserProductIdLinked='" . $user_product_ID . "'");
        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
    }

    /*********************************************
     ************* QUICK LINKS *************
     *********************************************/

    /* QUICKLINK PAGE API START */
    public function addQuicklinkFolder()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $now = date('Y-m-d H:i:s');
            $UID = $this->request->session()->read('user_id');
            $foldername = $this->request->query['vfoldername'];
            if (!empty($foldername) && $foldername != 'undefined') {
                $connection = ConnectionManager::get('default');
                $connection->insert('mst_quicklinks_folder', [
                    'iFkUserId' => $UID,
                    'vFolderName' => $foldername,
                    'dtCreatedOn' => $now
                ]);
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Folder Name is required';
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    /* Get Quick Link Folder Code By: Poojan Mehta*/
    public function getQuicklinksFolder()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $folders = TableRegistry::get('linkfolder', ['className' => 'mst_quicklinks_folder'])->find('all')
                ->where(['linkfolder.iFkUserId' => $UID])->order(['iPkFolderId' => 'DESC'])->toArray();
            if (!empty($folders)) {
                foreach ($folders as $key => $folder) {
                    $quicklinks = TableRegistry::get('quicklink', ['className' => 'mst_quicklinks'])->find('all')->where(['iFkUserId' => $UID])->andWhere(['IFkFolderId' => $folder->iPkFolderId])->order(['iPkQuickLinkId' => 'DESC'])->toArray();
                    $folders[$key]->links = $quicklinks;
                }

                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['folders'] = $folders;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
            }
        }
    }

    /* Quick Link Folder Delete Code By: Poojan Mehta*/
    public function deleteQuickLinkFolder()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $folder_id = $this->request->query['fid'];

            if ((!empty($folder_id) && $folder_id != 'undefined') && (!empty($UID) && $UID != 'undefined')) {
                $connection = ConnectionManager::get('default');
                $connection->execute("DELETE FROM mst_quicklinks_folder WHERE iPkFolderId =$folder_id AND iFkUserId=$UID");
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Something went wrong';
            }
        }
    }

    /* Save & Update Quick Link By: Poojan Mehta*/
    public function saveQuickLink()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $folder_id = $this->request->data['fid'];
            $NickName = $this->request->data['vNickName'];
            $QuickLink = $this->request->data['vQuicklink'];
            $iPkQuickLinkId = $this->request->data['iPkQuickLinkId'];
            $now = date('Y-m-d H:i:s');

            if (!empty($folder_id) && !empty($NickName) && !empty($QuickLink)) {
                $connection = ConnectionManager::get('default');
                if (!empty($iPkQuickLinkId)) {
                    $connection->update('mst_quicklinks', [
                        'iFkUserId' => $UID,
                        'IFkFolderId' => $folder_id,
                        'vNickName' => $NickName,
                        'vQuicklink' => $QuickLink
                    ], ['iPkQuickLinkId' => $iPkQuickLinkId]);
                } else {
                    $connection->insert('mst_quicklinks', [
                        'iFkUserId' => $UID,
                        'IFkFolderId' => $folder_id,
                        'vNickName' => $NickName,
                        'vQuicklink' => $QuickLink,
                        'dtCreatedOn' => $now
                    ]);
                }
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Nickname & Link Address is required';
            }
        }
    }

    /* Quick Link Delete Code By: Poojan Mehta*/
    public function deleteQuickLink()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $LinkId = $this->request->query['lid'];

            if ((!empty($LinkId) && $LinkId != 'undefined') && (!empty($UID) && $UID != 'undefined')) {
                $connection = ConnectionManager::get('default');
                $connection->execute("DELETE FROM mst_quicklinks WHERE iPkQuickLinkId= $LinkId AND iFkUserId =$UID");
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Something went wrong';
            }
        }
    }

    /* Get Link information by ID Code By: Poojan Mehta*/
    public function viewQuickLink()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $LinkId = $this->request->query['lid'];
            $folder_id = $this->request->query['fid'];
            if (!empty($UID) && !empty($LinkId) && !empty($folder_id)) {
                $getLinks = TableRegistry::get('quicklink', ['className' => 'mst_quicklinks'])->find()->where(['iFkUserId' => $UID])->andWhere(['iPkQuickLinkId' => $LinkId])->andWhere(['IFkFolderId' => $folder_id])->first();
                if (!empty($getLinks)) {
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['links'] = $getLinks;
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Something went wrong';
                }
            }
        }
    }

    /*********************************************
     ****************** ALL TASKS ****************
     *********************************************/

    public function saveTask()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $now = date('Y-m-d H:i:s');
            $UID = $this->request->session()->read('user_id');
            $task_title = $this->request->data['task_title'];
            $user_product_id = '';
            $tid = '';
            if (isset($this->request->data['tid'])) {
                $tid = $this->request->data['tid'];
                if (!empty($tid)) {
                    $task_title = $this->request->data['updated_task_title'];
                }
            }

            if (isset($this->request->data['taskType'])) {
                $taskType = $this->request->data['taskType'];
            }
            if (isset($this->request->data['pid'])) {
                $user_product_id = $this->request->data['pid'];
            }

            if (!empty($task_title)) {
                $connection = ConnectionManager::get('default');
                if (!empty($tid)) {
                    $connection->update('mst_tasks', ['vTask' => $task_title], ['iPkTaskId' => $tid]);
                } else {
                    $connection->insert('mst_tasks', [
                        'iFkUserId' => $UID,
                        'iFkUserProductId' => $user_product_id,
                        'vTask' => $task_title,
                        'taskType' => $taskType,
                        'dtCreatedDate' => $now
                    ]);
                }
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Task Title is required';
            }
        }
    }

    public function getTask()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {

            //echo "<pre>"; print_r($this->request->query); exit;
            //$currentDate = date('l, dS F Y');
            //echo $currentDate; exit;
            $where = array();
            $filterBy = $this->request->query['task_filterBy'];
            if ($filterBy != 'all') {
                $completed = '1';
                if ($filterBy == 'incomplete') {
                    $completed = '0';
                }
                $where['eIsCompleted'] = $completed;
            }
            if (isset($this->request->query['pid'])) {
                $where['iFkUserProductId'] = $this->request->query['pid'];
            }
            if (isset($this->request->query['taskType'])) {

                $taskType = $this->request->query['taskType'];
            }
            $UID = $this->request->session()->read('user_id');

            if ($this->request->query['taskType'] == 'product') {
                $tasks = TableRegistry::get('mst_tasks', ['className' => 'mst_tasks'])->find('all')
                    ->select(['iPkUserProductId' => 'up.iPkUserProductId', 'vUserProductTitle' => 'up.vUserProductTitle', 'iPkTaskId', 'vTask', 'iFkUserProductId', 'dtDueDate', 'eIsCompleted'])
                    ->leftJoin(['up' => 'user_products'], ['up.iPkUserProductId =  mst_tasks.iFkUserProductId'])
                    ->where([$where])->andWhere(['mst_tasks.iFkUserId' => $UID])->order(['dtDueDate' => 'ASC', 'iPkTaskId' => 'DESC'])->toArray();
            } else {

                /**if($taskType == 'master' && $filterBy == 'all' && $filterBy == 'incomplete' && $filterBy == 'complete'){
			$tasks = TableRegistry::get('mst_tasks', ['className' => 'mst_tasks'])->find('all')
                    ->select(['iPkUserProductId' => 'up.iPkUserProductId', 'vUserProductTitle' => 'up.vUserProductTitle', 'iPkTaskId', 'vTask', 'iFkUserProductId', 'dtDueDate', 'eIsCompleted'])
                    ->leftJoin(['up' => 'user_products'], ['up.iPkUserProductId =  mst_tasks.iFkUserProductId'])
                    ->where([$where])->andWhere(['mst_tasks.iFkUserId' => $UID])->order(['dtDueDate' => 'ASC', 'iPkTaskId' => 'DESC'])->toArray();
		}else{*/
                $tasks = TableRegistry::get('mst_tasks', ['className' => 'mst_tasks'])->find('all')
                    ->select(['iPkUserProductId' => 'up.iPkUserProductId', 'vUserProductTitle' => 'up.vUserProductTitle', 'iPkTaskId', 'vTask', 'iFkUserProductId', 'dtDueDate', 'eIsCompleted'])
                    ->leftJoin(['up' => 'user_products'], ['up.iPkUserProductId =  mst_tasks.iFkUserProductId'])
                    ->where([$where])->andWhere(['mst_tasks.iFkUserId' => $UID])->order(['dtDueDate' => 'ASC', 'iPkTaskId' => 'DESC'])->toArray();
                /**} //, 'mst_tasks.taskType' => $taskType */
            }

            $currentDate = date('Y-m-d');
            foreach ($tasks as $k => $v) {
                $duedate = '';
                $is_expired = false;
                if (!empty($v['dtDueDate'])) {
                    $dueDate = $v['dtDueDate'];
                    if (strtotime($currentDate) > strtotime($dueDate)) {
                        $is_expired = true;
                    }
                    $date = date_create($dueDate);
                    $duedate = date_format($date, "l, dS F Y");
                    //echo $duedate; exit;
                    /*$duedate .= '<b>' . date_format($date, "jS") . '</b> of ';
                    $duedate .= '<b>' . date_format($date, "F Y") . '</b>';*/
                }
                $tasks[$k]->iPkUserProductId = urlencode(urlencode(Security::encrypt($v->iPkUserProductId, ENCRYPTION_KEY)));
                $tasks[$k]->duedate = $duedate;
                $tasks[$k]->is_expired = $is_expired;

                $tags = TableRegistry::get('ttm', ['className' => 'task_tags_mapping'])->find()
                    ->select(['map_id' => 'ttm.iPkTagMappingId', 'iPkTaskTagId' => 'mtt.iPkTaskTagId', 'vTagName' => 'mtt.vTagName', 'vtagColor' => 'mtt.vtagColor'])
                    ->leftJoin(['mtt' => 'mst_task_tags'], ['mtt.iPkTaskTagId =  ttm.iFkTaskTagId'])
                    ->where(['ttm.iFkTaskId' => $v['iPkTaskId']])->toArray();

                $tasks[$k]->tags = $tags;
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $tasks;
        }
    }

    public function markTaskCompleted()
    {
        $now = date('Y-m-d H:i:s');
        $tid = $this->request->data['tid'];
        $status = $this->request->data['status'];

        if ($status == 1) {
            $estatus = '0';
        } else {
            $estatus = '1';
        }
        $connection = ConnectionManager::get('default');
        $connection->update('mst_tasks', [
            'eIsCompleted' => $estatus,
            'dtCompletedDate' => $now
        ], ['iPkTaskId' => $tid]);

        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
    }

    public function saveTaskTag()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $now = date('Y-m-d H:i:s');
            $UID = $this->request->session()->read('user_id');
            $tag_name = $this->request->data['tag_name'];
            $color = $this->request->data['color'];
            $tid = $this->request->data['tid'];
            if (!empty($tag_name)) {
                $connection = ConnectionManager::get('default');
                $statement = $connection->insert('mst_task_tags', [
                    'iFkUserId' => $UID,
                    'vTagName' => $tag_name,
                    'vtagColor' => $color,
                    'dtCreatedDate' => $now
                ]);
                $tagid = $statement->lastInsertId('mst_task_tags');
                $connection->insert('task_tags_mapping', ['iFkTaskId' => $tid, 'iFkTaskTagId' => $tagid]);
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Tag Name is required';
            }
        }
    }

    public function getTaskTags()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $tag_ids = array('0');
            $UID = $this->request->session()->read('user_id');
            $tid = $this->request->query['tid'];
            $connection = ConnectionManager::get('default');
            $record = $connection->execute("SELECT iFkTaskTagId FROM task_tags_mapping WHERE iFkTaskId = '" . $tid . "'")->fetchAll('assoc');
            foreach ($record as $k => $v) {
                $tag_ids[] = $v['iFkTaskTagId'];
            }
            $task_tags = TableRegistry::get('mst_task_tags', ['className' => 'mst_task_tags'])->find('all')
                ->where(['iPkTaskTagId NOT IN ' => $tag_ids])
                ->andWhere(['iFkUserId' => $UID])->order(['dtCreatedDate' => 'DESC', 'iPkTaskTagId' => 'DESC'])->toArray();

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $task_tags;
        }
    }

    public function assignTag()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $tid = $this->request->data['tid'];
            $tagid = $this->request->data['tagid'];

            if (!empty($tagid)) {
                $connection = ConnectionManager::get('default');
                $connection->insert('task_tags_mapping', ['iFkTaskId' => $tid, 'iFkTaskTagId' => $tagid]);
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Please select tag';
            }
        }
    }

    public function unassignTag()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $mapid = $this->request->data['mapid'];

            if ((!empty($mapid) && $mapid != 'undefined') && (!empty($UID) && $UID != 'undefined')) {
                $connection = ConnectionManager::get('default');
                $connection->execute("DELETE FROM task_tags_mapping WHERE iPkTagMappingId =$mapid");
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Something went wrong';
            }
        }
    }

    public function markTagDeleted()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $tagid = $this->request->data['tagid'];

            if ((!empty($tagid) && $tagid != 'undefined') && (!empty($UID) && $UID != 'undefined')) {
                $connection = ConnectionManager::get('default');
                $connection->execute("DELETE FROM mst_task_tags WHERE iPkTaskTagId =$tagid AND iFkUserId=$UID");
                $connection->execute("DELETE FROM task_tags_mapping WHERE iFkTaskTagId =$tagid");
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Something went wrong';
            }
        }
    }

    public function getAppToAssignTask()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $connection = ConnectionManager::get('default');
            $IMAGE_PATH = image_url() . 'product/';

            $products = $connection->execute("SELECT up.* FROM user_products AS up
WHERE up.iFkUserId = '" . $UID . "' AND up.eUserProductStatus = 'active' ORDER BY dtUserProductPurchasedOn DESC")->fetchAll('assoc');

            $records = array();
            foreach ($products as $key => $product) {
                $product['vUserProductImage'] = $IMAGE_PATH . $product['vUserProductImage'];
                $records[] = $product;
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $records;
            $this->apiResponse['total_products'] = count($records);
        }
    }

    public function assignTaskToApp()
    {
        $tid = $this->request->data['tid'];
        $pid = $this->request->data['pid'];
        $connection = ConnectionManager::get('default');
        $connection->update('mst_tasks', ['iFkUserProductId' => $pid], ['iPkTaskId' => $tid]);
        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
    }

    public function unassignTaskToApp()
    {
        $connection = ConnectionManager::get('default');
        $task_id = $this->request->query['tid'];
        $connection->update('mst_tasks', ['iFkUserProductId' => 0], ['iPkTaskId' => $task_id]);
        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
    }

    public function updateDueDate()
    {
        $connection = ConnectionManager::get('default');

        $tid = $this->request->data['tid'];
        $duedate = $this->request->data['duedate'];

        $getTask = $connection->execute("SELECT dtDueDate FROM mst_tasks WHERE iPkTaskId ='" . $tid . "'")->fetch('assoc');
        //echo "<pre>"; print_r($getTask); exit;
        if ($getTask['dtDueDate'] == '') {
            $date = date('Y-m-d H:i:s', strtotime($duedate)); //. ' +1 day'
        } else {
            $date = date('Y-m-d H:i:s', strtotime($duedate . ' +1 day')); //
        }

        //echo $date; exit;
        $connection->update('mst_tasks', ['dtDueDate' => $date], ['iPkTaskId' => $tid]);
        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
    }

    /*********************************************
     ************* PRODUCT DASHBOARD *************
     *********************************************/

    public function getapplicationbyID()
    {
        /*$checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {*/
        $connection = ConnectionManager::get('default');
        $UID = $this->request->session()->read('user_id');
        $fetchid = $this->request->query['productID'];
        $user_product_ID = Security::decrypt(urldecode($fetchid), ENCRYPTION_KEY);
        $record = $this->checkProductExist($UID, $user_product_ID);

        if (!$record) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
        } else {
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $record['vVisaProductVideo'] = image_url() . 'product/' . $record['vVisaProductVideo'];
            $record['linked_product'] = '';
            if ($record['eUserProductStatus'] == 'inactive') {
                $record['eAllowLession'] = 'no';
                $record['eAllowSummary'] = 'no';
                $record['eAllowDocumentChecklist'] = 'no';
                $record['eAllowToDo'] = 'no';
                $record['eAllowCoverLetter'] = 'no';
                $record['eAllowFaq'] = 'no';
            }
            if (!empty($record['iPkLinkId'])) {
                if ($record['iFkUserProductId'] != $record['iPkUserProductId']) {
                    $record['linked_product'] = urlencode(urlencode(Security::encrypt($record['iFkUserProductId'], ENCRYPTION_KEY)));
                    $pid = $record['iFkUserProductId'];
                } else {
                    $record['linked_product'] = urlencode(urlencode(Security::encrypt($record['iFkUserProductIdLinked'], ENCRYPTION_KEY)));
                    $pid = $record['iFkUserProductIdLinked'];
                }
                $product_name = $connection->execute("SELECT vUserProductTitle FROM user_products WHERE iPkUserProductId = '" . $pid . "'")->fetch('assoc');
                $record['linked_product_name'] = $product_name['vUserProductTitle'];
            }
            $this->apiResponse['data'] = $record;
        }
        //}
    }

    /*
     * checkProductExist method check whether product available or not
     * @param $UID
     * @param $user_product_ID
     * @return bool
     */
    public function checkProductExist($UID, $user_product_ID)
    {
        $connection = ConnectionManager::get('default');
        $IMAGE_PATH = image_url() . 'product/';
        $record = $connection->execute("SELECT mvp.*,mvc.vVisaCat,up.iPkUserProductId,up.vUserProductTitle as product_name,up.vUserProductDesc as product_desc,up.iPkUserProductId,up.vTrnNumber,
                                        up.vFileNumber,up.vLodgmentDate,up.vLodgmentStatus,up.eIMMIUsername,up.eIMMIPassword,CONCAT('" . $IMAGE_PATH . "', up.vUserProductImage) AS vUserProductImage,up.eUserProductStatus,plink.* FROM user_products AS up
                                        LEFT JOIN user_products_linking AS plink ON up.iPkUserProductId = plink.iFkUserProductId OR up.iPkUserProductId = plink.iFkUserProductIdLinked
                                        LEFT JOIN mst_visa_product AS mvp ON mvp.iPkVisaProductId = up.iFkVisaProductId
                                        LEFT JOIN mst_visa_category AS mvc ON mvc.iPkVisaCatId = mvp.iFkVisaCatId
                                        WHERE up.iFkUserId = '" . $UID . "' AND up.eUserProductStatus = 'active' AND up.iPkUserProductId = '" . $user_product_ID . "'")->fetchAll('assoc');
        if (count($record)) {
            return $record[0];
        } else {
            return false;
        }
    }

    public function getkeySubjectElement()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $user_product_id = $this->request->data['pid'];

            $summary_folder_ids = explode(',', $this->request->data['sfid']);
            $todo_folder_ids = explode(',', $this->request->data['tfid']);
            $total_lessons = 0;
            $total_summary = 0;
            $total_todo = 0;
            $total_doc = 0;
            $total_lessons_completed = 0;
            $total_summary_completed = 0;
            $total_todo_completed = 0;
            $total_doc_completed = 0;
            $lesson_percentage = 0;
            $summary_percentage = 0;
            $todo_percentage = 0;
            $doc_percentage = 0;

            if (!empty($this->request->data['lfid'])) {
                $lesson_folder_ids = explode(',', $this->request->data['lfid']);
                $lessons_data = TableRegistry::get('ml', ['className' => 'mst_lessons'])->find()
                    ->select([
                        'total_lessons' => 'COUNT(ml.iPkLessonId)',
                        'total_lessons_completed' => 'SUM(CASE WHEN ul.iPkUserLessonId != "" THEN 1 ELSE 0 END)'
                    ])
                    ->leftJoin(['ul' => 'user_lesson'], ['ul.iFkLessonId =  ml.iPkLessonId', 'ul.iFkUserProductId' => $user_product_id, 'ul.eIsCompleted' => '1'])
                    ->where(['ml.iFkFolderId IN' => $lesson_folder_ids])->andWhere(['ml.eLessonStatus' => 'active'])->toArray();

                $total_lessons = $lessons_data[0]->total_lessons;
                $total_lessons_completed = $lessons_data[0]->total_lessons_completed;
                $lesson_percentage = round(($total_lessons_completed / $total_lessons) * 100);
            }

            if (!empty($this->request->data['sfid'])) {
                $summary_data = TableRegistry::get('msoc', ['className' => 'mst_summary_of_criteria'])->find()
                    ->select([
                        'total_summary' => 'COUNT(msoc.iPkSummaryId)',
                        'total_summary_completed' => 'SUM(CASE WHEN usoc.iPkUserSummaryId != "" THEN 1 ELSE 0 END)'
                    ])
                    ->leftJoin(['usoc' => 'user_summary_criteria'], ['usoc.iFkSummaryId =  msoc.iPkSummaryId', 'usoc.iFkUserProductId' => $user_product_id, 'usoc.eIsCompleted' => '1'])
                    ->where(['msoc.iFkFolderId IN' => $summary_folder_ids])->andWhere(['msoc.eSummaryStatus' => 'active'])->toArray();

                $total_summary = $summary_data[0]->total_summary;
                $total_summary_completed = $summary_data[0]->total_summary_completed;
                $summary_percentage = round(($total_summary_completed / $total_summary) * 100);
            }

            if (!empty($this->request->data['tfid'])) {
                $system_todo_data = TableRegistry::get('mtd', ['className' => 'mst_todo'])->find()
                    ->select(['total_todo' => 'COUNT(mtd.iPkToDoId)', 'total_todo_completed' => 'SUM(CASE WHEN utd.iPkUserToDoId != "" THEN 1 ELSE 0 END)'])
                    ->leftJoin(['utd' => 'user_todo'], ['utd.iFkToDoId = mtd.iPkToDoId', 'utd.iFkUserProductId' => $user_product_id, 'utd.eUserToDoType' => 'system', 'utd.eIsCompleted' => '1'])
                    ->where(['mtd.iFkFolderId IN' => $todo_folder_ids])->andWhere(['mtd.eToDoStatus' => 'active'])->toArray();

                $total_todo = $system_todo_data[0]->total_todo;
                $total_todo_completed = $system_todo_data[0]->total_todo_completed;
                $todo_percentage = round(($total_todo_completed / $total_todo) * 100);
            }

            if ($this->request->data['allowdoc'] == 'yes') {
                $documents = TableRegistry::get('md', ['className' => 'mst_documents'])->find()
                    ->select(['total_doc' => 'COUNT(md.iPkDocId)', 'total_doc_completed' => 'SUM(CASE WHEN ud.iPkUserDocId != "" THEN 1 ELSE 0 END)'])
                    ->leftJoin(['tag' => 'mst_tags'], ['tag.iDocFolderId =  md.iFkFolderId'])
                    ->leftJoin(['ur' => 'user_relationship'], ['ur.iFkTagId =  tag.iPKTagId'])
                    ->leftJoin(['ud' => 'user_required_documents'], ['ud.iFkDocId = md.iPkDocId', 'ud.iFkUserRelationId = ur.iPkUserRelationId', 'ud.iFkUserProductId = ur.iFkUserProductId', 'ud.eUserDocType' => 'system', '(ud.eUserDocStatus="collected" OR ud.eUserDocStatus="notapplicable")'])
                    ->where(['ur.iFkUserProductId' => $user_product_id])->andWhere(['md.eDocStatus' => 'active'])->distinct()->toArray();


                if ($documents[0]['total_doc'] != 0) {
                    $total_doc = $documents[0]->total_doc;
                    $total_doc_completed = $documents[0]->total_doc_completed;
                    $doc_percentage = round(($total_doc_completed / $total_doc) * 100);
                }
            }


            if ($total_lessons == 0 && $total_summary == 0 && $total_todo == 0 && $total_doc == 0) {
                $completed_percentage = 0;
            } else {
                $Overall_total = $total_lessons + $total_summary + $total_todo + $total_doc;
                $Overall_completed = $total_lessons_completed + $total_summary_completed + $total_todo_completed + $total_doc_completed;
                $completed_percentage = round(($Overall_completed / $Overall_total) * 100, 1);
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['total_lessons'] = $total_lessons;
            $this->apiResponse['lessons_completed'] = $total_lessons_completed;
            $this->apiResponse['lessons_completed_per'] = $lesson_percentage;
            $this->apiResponse['total_summary'] = $total_summary;
            $this->apiResponse['summary_completed'] = $total_summary_completed;
            $this->apiResponse['summary_completed_per'] = $summary_percentage;
            $this->apiResponse['total_todo'] = $total_todo;
            $this->apiResponse['todo_completed'] = $total_todo_completed;
            $this->apiResponse['todo_completed_per'] = $todo_percentage;
            $this->apiResponse['total_doc'] = $total_doc;
            $this->apiResponse['doc_completed'] = $total_doc_completed;
            $this->apiResponse['doc_completed_per'] = $doc_percentage;
            $this->apiResponse['completed_percentage'] = $completed_percentage;

            $this->apiResponse['valid'] = true;
        }
    }

    public function cancelSubscription()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $UID = $this->request->session()->read('user_id');
            $user_product_id = $this->request->data['pid'];
            $connection->update('user_products', ['eUserProductStatus' => 'inactive'], ['iPkUserProductId' => $user_product_id, 'iFkUserId' => $UID]);
            /** DELETE LINKS */
            $connection->execute("DELETE FROM user_products_linking WHERE iFkUserProductId =$user_product_id OR iFkUserProductIdLinked =$user_product_id");

            /** DELETE LESSIONS */
            $connection->execute("DELETE FROM user_lesson WHERE iFkUserProductId =$user_product_id AND iFkUserId =$UID");
            //$connection->execute("DELETE FROM user_lesson_payment WHERE iFkUserProductId =$user_product_id AND iFkUserId =$UID");

            /** DELETE SUMMARY OF CRITERIA */
            $connection->execute("DELETE FROM user_summary_criteria WHERE iFkUserProductId =$user_product_id AND iFkUserId =$UID");

            /** DELETE DOC */
            $documents = $connection->execute("SELECT * FROM user_required_documents WHERE iFkUserProductId = '" . $user_product_id . "'")->fetchAll('assoc');
            $connection->execute("DELETE FROM user_required_documents WHERE iFkUserProductId =$user_product_id");
            $target_dir = WWW_ROOT . 'documents/';
            foreach ($documents as $doc) {
                if (!empty($doc['vFileName'])) {
                    if (file_exists($target_dir . $doc['vFileName'])) {
                        unlink($target_dir . $doc['vFileName']);
                    }
                }
            }

            /** DELETE TODO */
            $connection->execute("DELETE FROM user_todo WHERE iFkUserProductId =$user_product_id AND iFkUserId =$UID");

            /**DELETE USER RELATIONSHIP */
            $connection->execute("DELETE FROM user_relationship WHERE iFkUserProductId =$user_product_id AND iFkUserId =$UID");

            /** DELETE NOTES */
            $connection->execute("DELETE FROM user_notes WHERE iFkUserProductId =$user_product_id AND iFkUserId =$UID");

            /** DELETE TASKS */
            $connection->execute("DELETE FROM mst_tasks WHERE iFkUserProductId =$user_product_id AND iFkUserId =$UID");

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    public function getapplicantdetails()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $user_product_id = $this->request->data['pid'];
            $connection = ConnectionManager::get('default');
            $IMAGE_PATH = image_url() . 'product/fut/';
            $records = $connection->execute("SELECT ur.*,mt.vTagName,CONCAT('" . $IMAGE_PATH . "', ur.vProfilePicture) AS profilepic FROM user_relationship AS ur
                                        LEFT JOIN mst_tags AS mt ON mt.iPKTagId = ur.iFKTagId
                                        WHERE ur.iFkUserId = '" . $UID . "' AND ur.iFkUserProductId = '" . $user_product_id . "'")->fetchAll('assoc');

            $tmp = array();
            foreach ($records as $record) {
                $tmp[$record['eApplicationType']][] = $record;
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $tmp;
        }
    }

    /* updateProductInfo method used to update productname,discription and lodgement details */
    public function updateProductInfo()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {

            $this->request->allowMethod('post');
            $UID = $this->request->session()->read('user_id');
            $connection = ConnectionManager::get('default');
            $fieldvalue = $this->request->data['fieldvalue'];
            $user_product_ID = $this->request->data['pid'];

            switch ($fieldvalue['label_type']) {
                case 'vTrnNumber':
                    $data = ['vTrnNumber' => $fieldvalue['vTrnNumber']];
                    break;
                case 'vFileNumber':
                    $data = ['vFileNumber' => $fieldvalue['vFileNumber']];
                    break;
                case 'vLodgmentStatus':
                    $data = ['vLodgmentStatus' => $fieldvalue['vLodgmentStatus']];
                    break;
                case 'username':
                    $data = ['eIMMIUsername' => $fieldvalue['eIMMIUsername']];
                    break;
                case 'password':
                    $data = ['eIMMIPassword' => $fieldvalue['eIMMIPassword']];
                    break;
                case 'info':
                    $data = ['vUserProductTitle' => $fieldvalue['product_name'], 'vUserProductDesc' => $fieldvalue['product_desc']];
                    break;
                default:
                    $data = ['vLodgmentDate' => $fieldvalue['lodgement_date']];
                    break;
            }

            $connection->update('user_products', $data, ['iPkUserProductId' => $user_product_ID, 'iFkUserId' => $UID]);
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    /*save Main Applicant */
    public function saveMainApplicant()
    {

        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $pid = $this->request->data['pid'];
            $connection = ConnectionManager::get('default');

            foreach ($this->request->data as $key => $value) {
                if ($this->request->data[$key] == 'undefined') {
                    $this->request->data[$key] = '';
                }
            }
            $fut_main_name = $this->request->data['fut_main_name'];
            $fut_main_family_name = $this->request->data['fut_main_family_name'];
            $fut_main_email = $this->request->data['fut_main_email'];
            $fut_main_phone = $this->request->data['fut_main_phone'];
            $fut_main_address = $this->request->data['fut_main_address'];

            if (empty($fut_main_name)) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Applicant name is required';
            } else {
                $is_error = false;
                $now = date('Y-m-d H:i:s');
                $target_dir = WWW_ROOT . 'product/fut/';
                if (isset($this->request->data['fut_main_ProfilePic']['name'])) {
                    $target_file = $target_dir . basename($this->request->data['fut_main_ProfilePic']['name']);
                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $current = strtotime("now");

                    $image_name = 'fut_main_' . $current . '_org.' . $imageFileType;
                    $image_name1 = 'fut_main_' . $current . '_300x300.' . $imageFileType;
                    $target_file = $target_dir . $image_name;
                    Image::configure(array('driver' => 'gd'));
                    if (move_uploaded_file($this->request->data["fut_main_ProfilePic"]["tmp_name"], $target_file)) {
                        Image::make($target_file)->resize(85, 85)->save($target_dir . $image_name1);
                        if (isset($this->request->data['id'])) {
                            if (file_exists($target_dir . $this->request->data['current_profile'])) {
                                unlink($target_dir . $this->request->data['current_profile']);
                                unlink($target_dir . str_replace("org", "300x300", $this->request->data['current_profile']));
                            }
                        }
                        $is_error = false;
                    } else {
                        $is_error = true;
                    }
                } else {
                    $image_name = '';
                    if (isset($this->request->data['id'])) {
                        $image_name = $this->request->data['current_profile'];
                    }
                    $is_error = false;
                }

                if (!$is_error) {
                    $tags_record = $connection->execute("SELECT mt.* FROM user_products as up
                                                    LEFT JOIN mst_tags as mt ON mt.iFKProductId = up.iFkVisaProductId
                                                    WHERE mt.applicantType = 'fut_main' AND up.iPkUserProductId = '" . $pid . "'")->fetch('assoc');

                    if (isset($this->request->data['id'])) {
                        $connection->update('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $fut_main_name,
                            'vFamilyName' => $fut_main_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $fut_main_email,
                            'vMobile' => $fut_main_phone,
                            'vAddress' => $fut_main_address,
                            'iFkTagId' => $tags_record['iPKTagId'],
                            'eApplicationType' => 'fut_main'
                        ], ['iPkUserRelationId' => $this->request->data['id']]);
                    } else {
                        $connection->insert('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $fut_main_name,
                            'vFamilyName' => $fut_main_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $fut_main_email,
                            'vMobile' => $fut_main_phone,
                            'vAddress' => $fut_main_address,
                            'eApplicationType' => 'fut_main',
                            'iFkTagId' => $tags_record['iPKTagId'],
                            'dtCreatedOn' => $now
                        ]);
                    }

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Main Applicant details has been saved';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Unable to update applicant image';
                }
            }
        }
    }

    /*save Sponser */
    public function saveSponser()
    {

        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $pid = $this->request->data['pid'];
            $connection = ConnectionManager::get('default');

            foreach ($this->request->data as $key => $value) {
                if ($this->request->data[$key] == 'undefined') {
                    $this->request->data[$key] = '';
                }
            }
            $fut_main_sponse_name = $this->request->data['fut_main_sponse_name'];
            $fut_main_sponse_family_name = $this->request->data['fut_main_sponse_family_name'];
            $fut_main_sponse_email = $this->request->data['fut_main_sponse_email'];
            $fut_main_sponse_phone = $this->request->data['fut_main_sponse_phone'];
            $fut_main_sponse_address = $this->request->data['fut_main_sponse_address'];
            $fut_main_sponse_type = $this->request->data['fut_main_sponse_type'];

            if (empty($fut_main_sponse_name)) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Sponser name is required';
            } else if (empty($fut_main_sponse_type)) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Please select relation to Main Applicant';
            } else {
                $is_error = false;
                $now = date('Y-m-d H:i:s');
                $target_dir = WWW_ROOT . 'product/fut/';
                if (isset($this->request->data['fut_main_sponse_ProfilePic']['name'])) {
                    $target_file = $target_dir . basename($this->request->data['fut_main_sponse_ProfilePic']['name']);
                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $current = strtotime("now");

                    $image_name = 'fut_main_sponse_' . $current . '_org.' . $imageFileType;
                    $image_name1 = 'fut_main_sponse_' . $current . '_300x300.' . $imageFileType;
                    $target_file = $target_dir . $image_name;
                    Image::configure(array('driver' => 'gd'));
                    if (move_uploaded_file($this->request->data["fut_main_sponse_ProfilePic"]["tmp_name"], $target_file)) {
                        Image::make($target_file)->resize(85, 85)->save($target_dir . $image_name1);
                        if (isset($this->request->data['id'])) {
                            if (file_exists($target_dir . $this->request->data['current_profile'])) {
                                unlink($target_dir . $this->request->data['current_profile']);
                                unlink($target_dir . str_replace("org", "300x300", $this->request->data['current_profile']));
                            }
                        }
                        $is_error = false;
                    } else {
                        $is_error = true;
                    }
                } else {
                    $image_name = '';
                    if (isset($this->request->data['id'])) {
                        $image_name = $this->request->data['current_profile'];
                    }
                    $is_error = false;
                }

                if (!$is_error) {
                    if (isset($this->request->data['id'])) {
                        $record = TableRegistry::get('ur', ['className' => 'user_relationship'])->find('all')
                            ->where(['ur.iPkUserRelationId' => $this->request->data['id']])->first();
                        if ($record->iFkTagId != $fut_main_sponse_type) {
                            $documents = TableRegistry::get('urd', ['className' => 'user_required_documents'])->find('all')
                                ->where(['urd.iFkUserRelationId' => $this->request->data['id']])->toArray();

                            $target_dir = WWW_ROOT . 'documents/';
                            foreach ($documents as $document) {
                                if (file_exists($target_dir . $document->vFileName)) {
                                    unlink($target_dir . $document->vFileName);
                                }
                            }
                            $connection->delete('user_required_documents', ['iFkUserRelationId' => $this->request->data['id']]);
                        }

                        $connection->update('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $fut_main_sponse_name,
                            'vFamilyName' => $fut_main_sponse_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $fut_main_sponse_email,
                            'vMobile' => $fut_main_sponse_phone,
                            'vAddress' => $fut_main_sponse_address,
                            'iFkTagId' => $fut_main_sponse_type,
                            'eApplicationType' => 'fut_main_sponse'
                        ], ['iPkUserRelationId' => $this->request->data['id']]);
                    } else {
                        $connection->insert('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $fut_main_sponse_name,
                            'vFamilyName' => $fut_main_sponse_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $fut_main_sponse_email,
                            'vMobile' => $fut_main_sponse_phone,
                            'vAddress' => $fut_main_sponse_address,
                            'iFkTagId' => $fut_main_sponse_type,
                            'eApplicationType' => 'fut_main_sponse',
                            'dtCreatedOn' => $now
                        ]);
                    }

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Sponser details has been saved';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Unable to update sponser image';
                }
            }
        }
    }

    /*save Family Member */
    public function savefamily()
    {

        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $pid = $this->request->data['pid'];
            $connection = ConnectionManager::get('default');

            foreach ($this->request->data as $key => $value) {
                if ($this->request->data[$key] == 'undefined') {
                    $this->request->data[$key] = '';
                }
            }
            $fut_main_family_name = $this->request->data['fut_main_family_name'];
            $fut_main_family_family_name = $this->request->data['fut_main_family_family_name'];
            $fut_main_family_email = $this->request->data['fut_main_family_email'];
            $fut_main_family_phone = $this->request->data['fut_main_family_phone'];
            $fut_main_family_address = $this->request->data['fut_main_family_address'];
            $fut_main_family_type = $this->request->data['fut_main_family_type'];

            if (empty($fut_main_family_name)) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Member name is required';
            } else if (empty($fut_main_family_type)) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Please select relation to Main Applicant';
            } else {
                $is_error = false;
                $now = date('Y-m-d H:i:s');
                $target_dir = WWW_ROOT . 'product/fut/';
                if (isset($this->request->data['fut_main_family_ProfilePic']['name'])) {
                    $target_file = $target_dir . basename($this->request->data['fut_main_family_ProfilePic']['name']);
                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $current = strtotime("now");

                    $image_name = 'fut_main_family_' . $current . '_org.' . $imageFileType;
                    $image_name1 = 'fut_main_family_' . $current . '_300x300.' . $imageFileType;
                    $target_file = $target_dir . $image_name;
                    Image::configure(array('driver' => 'gd'));
                    if (move_uploaded_file($this->request->data["fut_main_family_ProfilePic"]["tmp_name"], $target_file)) {
                        Image::make($target_file)->resize(85, 85)->save($target_dir . $image_name1);
                        if (isset($this->request->data['id'])) {
                            if (file_exists($target_dir . $this->request->data['current_profile'])) {
                                unlink($target_dir . $this->request->data['current_profile']);
                                unlink($target_dir . str_replace("org", "300x300", $this->request->data['current_profile']));
                            }
                        }
                        $is_error = false;
                    } else {
                        $is_error = true;
                    }
                } else {
                    $image_name = '';
                    if (isset($this->request->data['id'])) {
                        $image_name = $this->request->data['current_profile'];
                    }
                    $is_error = false;
                }

                if (!$is_error) {
                    if (isset($this->request->data['id'])) {

                        $record = TableRegistry::get('ur', ['className' => 'user_relationship'])->find('all')
                            ->where(['ur.iPkUserRelationId' => $this->request->data['id']])->first();

                        if ($record->iFkTagId != $fut_main_family_type) {
                            $documents = TableRegistry::get('urd', ['className' => 'user_required_documents'])->find('all')
                                ->where(['urd.iFkUserRelationId' => $this->request->data['id']])->toArray();

                            $target_dir = WWW_ROOT . 'documents/';
                            foreach ($documents as $document) {
                                if (file_exists($target_dir . $document->vFileName)) {
                                    unlink($target_dir . $document->vFileName);
                                }
                            }
                            $connection->delete('user_required_documents', ['iFkUserRelationId' => $this->request->data['id']]);
                        }

                        $connection->update('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $fut_main_family_name,
                            'vFamilyName' => $fut_main_family_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $fut_main_family_email,
                            'vMobile' => $fut_main_family_phone,
                            'vAddress' => $fut_main_family_address,
                            'iFkTagId' => $fut_main_family_type,
                            'eApplicationType' => 'fut_main_family'
                        ], ['iPkUserRelationId' => $this->request->data['id']]);
                    } else {
                        $connection->insert('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $fut_main_family_name,
                            'vFamilyName' => $fut_main_family_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $fut_main_family_email,
                            'vMobile' => $fut_main_family_phone,
                            'vAddress' => $fut_main_family_address,
                            'eApplicationType' => 'fut_main_family',
                            'iFkTagId' => $fut_main_family_type,
                            'dtCreatedOn' => $now
                        ]);
                    }

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Member details has been saved';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Unable to update member image';
                }
            }
        }
    }

    /*save Business Applicant */
    public function saveBusinessApplicant()
    {

        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $pid = $this->request->data['pid'];
            $connection = ConnectionManager::get('default');

            foreach ($this->request->data as $key => $value) {
                if ($this->request->data[$key] == 'undefined') {
                    $this->request->data[$key] = '';
                }
            }
            $business_main_name = $this->request->data['business_main_name'];
            $business_main_family_name = $this->request->data['business_main_family_name'];
            $business_main_email = $this->request->data['business_main_email'];
            $business_main_phone = $this->request->data['business_main_phone'];
            $business_main_address = $this->request->data['business_main_address'];

            if (empty($business_main_name)) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Business name is required';
            } else {
                $is_error = false;
                $now = date('Y-m-d H:i:s');
                $target_dir = WWW_ROOT . 'product/fut/';
                if (isset($this->request->data['business_main_ProfilePic']['name'])) {
                    $target_file = $target_dir . basename($this->request->data['business_main_ProfilePic']['name']);
                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $current = strtotime("now");

                    $image_name = 'business_main_' . $current . '_org.' . $imageFileType;
                    $image_name1 = 'business_main_' . $current . '_300x300.' . $imageFileType;
                    $target_file = $target_dir . $image_name;
                    Image::configure(array('driver' => 'gd'));
                    if (move_uploaded_file($this->request->data["business_main_ProfilePic"]["tmp_name"], $target_file)) {
                        Image::make($target_file)->resize(85, 85)->save($target_dir . $image_name1);
                        if (isset($this->request->data['id'])) {
                            if (file_exists($target_dir . $this->request->data['current_profile'])) {
                                unlink($target_dir . $this->request->data['current_profile']);
                                unlink($target_dir . str_replace("org", "300x300", $this->request->data['current_profile']));
                            }
                        }
                        $is_error = false;
                    } else {
                        $is_error = true;
                    }
                } else {
                    $image_name = '';
                    if (isset($this->request->data['id'])) {
                        $image_name = $this->request->data['current_profile'];
                    }
                    $is_error = false;
                }

                if (!$is_error) {
                    $tags_record = $connection->execute("SELECT mt.* FROM user_products as up
                                                    LEFT JOIN mst_tags as mt ON mt.iFKProductId = up.iFkVisaProductId
                                                    WHERE mt.applicantType = 'business_main' AND up.iPkUserProductId = '" . $pid . "'")->fetch('assoc');

                    if (isset($this->request->data['id'])) {
                        $connection->update('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $business_main_name,
                            'vFamilyName' => $business_main_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $business_main_email,
                            'vMobile' => $business_main_phone,
                            'vAddress' => $business_main_address,
                            'iFkTagId' => $tags_record['iPKTagId'],
                            'eApplicationType' => 'business_main'
                        ], ['iPkUserRelationId' => $this->request->data['id']]);
                    } else {
                        $connection->insert('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $business_main_name,
                            'vFamilyName' => $business_main_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $business_main_email,
                            'vMobile' => $business_main_phone,
                            'vAddress' => $business_main_address,
                            'eApplicationType' => 'business_main',
                            'iFkTagId' => $tags_record['iPKTagId'],
                            'dtCreatedOn' => $now
                        ]);
                    }

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Business Applicant details has been saved';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Unable to update applicant image';
                }
            }
        }
    }

    /*save Business Sponse */
    public function saveBusinessSponse()
    {

        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $pid = $this->request->data['pid'];
            $connection = ConnectionManager::get('default');

            foreach ($this->request->data as $key => $value) {
                if ($this->request->data[$key] == 'undefined') {
                    $this->request->data[$key] = '';
                }
            }

            $business_sponse_name = $this->request->data['business_sponse_name'];
            $business_sponse_family_name = $this->request->data['business_sponse_family_name'];
            $business_sponse_email = $this->request->data['business_sponse_email'];
            $business_sponse_phone = $this->request->data['business_sponse_phone'];
            $business_sponse_address = $this->request->data['business_sponse_address'];
            $business_sponse_type = $this->request->data['business_sponse_type'];

            if (empty($business_sponse_name)) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Sponsor name is required';
            } else if (empty($business_sponse_type)) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Please select type of employee';
            } else {
                $is_error = false;
                $now = date('Y-m-d H:i:s');
                $target_dir = WWW_ROOT . 'product/fut/';
                if (isset($this->request->data['business_sponse_ProfilePic']['name'])) {
                    $target_file = $target_dir . basename($this->request->data['business_sponse_ProfilePic']['name']);
                    $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                    $current = strtotime("now");

                    $image_name = 'business_sponse_' . $current . '_org.' . $imageFileType;
                    $image_name1 = 'business_sponse_' . $current . '_300x300.' . $imageFileType;
                    $target_file = $target_dir . $image_name;
                    Image::configure(array('driver' => 'gd'));
                    if (move_uploaded_file($this->request->data["business_sponse_ProfilePic"]["tmp_name"], $target_file)) {
                        Image::make($target_file)->resize(85, 85)->save($target_dir . $image_name1);
                        if (isset($this->request->data['id'])) {
                            if (file_exists($target_dir . $this->request->data['current_profile'])) {
                                unlink($target_dir . $this->request->data['current_profile']);
                                unlink($target_dir . str_replace("org", "300x300", $this->request->data['current_profile']));
                            }
                        }
                        $is_error = false;
                    } else {
                        $is_error = true;
                    }
                } else {
                    $image_name = '';
                    if (isset($this->request->data['id'])) {
                        $image_name = $this->request->data['current_profile'];
                    }
                    $is_error = false;
                }

                if (!$is_error) {
                    if (isset($this->request->data['id'])) {

                        $record = TableRegistry::get('ur', ['className' => 'user_relationship'])->find('all')
                            ->where(['ur.iPkUserRelationId' => $this->request->data['id']])->first();
                        if ($record->iFkTagId != $business_sponse_type) {
                            $documents = TableRegistry::get('urd', ['className' => 'user_required_documents'])->find('all')
                                ->where(['urd.iFkUserRelationId' => $this->request->data['id']])->toArray();

                            $target_dir = WWW_ROOT . 'documents/';
                            foreach ($documents as $document) {
                                if (file_exists($target_dir . $document->vFileName)) {
                                    unlink($target_dir . $document->vFileName);
                                }
                            }
                            $connection->delete('user_required_documents', ['iFkUserRelationId' => $this->request->data['id']]);
                        }

                        $connection->update('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $business_sponse_name,
                            'vFamilyName' => $business_sponse_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $business_sponse_email,
                            'vMobile' => $business_sponse_phone,
                            'vAddress' => $business_sponse_address,
                            'iFkTagId' => $business_sponse_type,
                            'eApplicationType' => 'business_sponse'
                        ], ['iPkUserRelationId' => $this->request->data['id']]);
                    } else {
                        $connection->insert('user_relationship', [
                            'iFkUserId' => $UID,
                            'iFkUserProductId' => $pid,
                            'vName' => $business_sponse_name,
                            'vFamilyName' => $business_sponse_family_name,
                            'vProfilePicture' => $image_name,
                            'vEmail' => $business_sponse_email,
                            'vMobile' => $business_sponse_phone,
                            'vAddress' => $business_sponse_address,
                            'eApplicationType' => 'business_sponse',
                            'iFkTagId' => $business_sponse_type,
                            'dtCreatedOn' => $now
                        ]);
                    }

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Sponsored Worker details has been saved';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Unable to update Sponsor image';
                }
            }
        }
    }

    public function getRelations()
    {

        $user_product_id = $this->request->data['pid'];
        $applicantType = $this->request->data['applicantType'];
        $connection = ConnectionManager::get('default');
        $tags_record = $connection->execute("SELECT mt.* FROM user_products as up
                                                    LEFT JOIN mst_tags as mt ON mt.iFKProductId = up.iFkVisaProductId
                                                    WHERE mt.applicantType = '" . $applicantType . "' AND up.iPkUserProductId = '" . $user_product_id . "'")->fetchAll('assoc');

        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
        $this->apiResponse['data'] = $tags_record;
    }

    /*********************************************
     ***************** LESSONS *******************
     *********************************************/

    public function getUserLessons()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        $connection = ConnectionManager::get('default');
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {

            $UID = $this->request->session()->read('user_id');
            $lesson_folder_ids = explode(',', $this->request->data['fieldvalue']);
            $records = array();
            $lessons_data = TableRegistry::get('ml', ['className' => 'mst_lessons'])->find()
                ->select(['ml.iPkLessonId', 'ml.iFkFolderId', 'ml.vLessonTitle', 'ml.vLessonDescription', 'iPkUserLessonId' => 'ul.iPkUserLessonId', 'ml.vLessonVideoLink'])
                ->leftJoin(['ul' => 'user_lesson'], ['ul.iFkLessonId =  ml.iPkLessonId', 'ul.iFkUserProductId' => $this->request->data['pid'], 'ul.eIsCompleted' => '1'])
                ->where(['ml.iFkFolderId IN' => $lesson_folder_ids])->andWhere(['ml.eLessonStatus' => 'active'])->order(['iPriority' => 'ASC', 'dtPriority' => 'DESC'])->toArray();

            foreach ($lessons_data as $data) {


                $resources = array();
                $resources_data = TableRegistry::get('mlr', ['className' => 'mst_lessons_resource'])->find()
                    ->select(['mlr.iPkLessonRId', 'mlr.vResourceName', 'mlr.vthumbnailFile', 'mlr.vLessonResource', 'mlr.eLessonResourceType'])
                    ->where(['mlr.iFkLessonId' => $data['iPkLessonId']])->andWhere(['mlr.eLessonRStatus' => 'active'])->toArray();

                $resources['iPkLessonId'] = $data['iPkLessonId'];
                $resources['vLessonTitle'] = $data['vLessonTitle'];
                $resources['vLessonDescription'] = $data['vLessonDescription'];
                $resources['iFkFolderId'] = $data['iFkFolderId'];
                $resources['vLessonVideoLink'] = $data['vLessonVideoLink'];


                if (!empty($data['iPkUserLessonId'])) {
                    $is_watched = true;
                } else {
                    $is_watched = false;
                }

                $resources['is_watched'] = $is_watched;
                foreach ($resources_data as $resource) {
                    if ($resource['eLessonResourceType'] == 'VIDEO') {
                        $resources['videoId'] = $resource['iPkLessonRId'];
                        $resources['video_thumb'] = image_url() . 'videos/thumbnail/' . $resource['vthumbnailFile'];
                    } else {
                        $resources['resources'][] = array('fileId' => $resource['iPkLessonRId'], 'vResourceName' => $resource['vResourceName'], 'vLessonResource' => $resource['vLessonResource'], 'eLessonResourceType' => $resource['eLessonResourceType']);
                    }
                }
                $records[] = $resources;
            }

            /** Check Plan Payment*/
            $checkcurrentplan = $connection->execute("SELECT * FROM user_plan_payment WHERE iFkUserId = $UID AND vStatus='active'")->fetch('assoc');

            $pid = $checkcurrentplan['iFkUserPlanId'];

            $checkplan = $connection->execute("SELECT * FROM mst_plans WHERE iPkPlanId = $pid AND ePlanStatus='active'")->fetch('assoc');

            if ($checkplan['AllowLessons'] == 'yes') {
                $is_purchase = true;
            } else {
                $purchase_details = TableRegistry::get('ulp', ['className' => 'user_lesson_payment'])->find('all')
                    ->where(['ulp.iFkUserProductId' => $this->request->data['pid']])->andWhere(['ulp.iFkUserId' => $UID])->toArray();

                if (!empty($purchase_details)) {
                    $is_purchase = true;
                } else if ($this->request->data['payment'] == 'yes') {

                    if (empty($purchase_details)) {
                        $is_purchase = false;
                    }
                } else {
                    $is_purchase = false;
                }
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['charge'] = $is_purchase;
            $this->apiResponse['data'] = $records;
        }
    }

    public function getVideoFile()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        $UID = $this->request->session()->read('user_id');
        $connection = ConnectionManager::get('default');
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $user_product_id = $this->request->data['pid'];
            $lessonId = $this->request->data['lessonId'];
            $is_payment_done = true;

            if ($this->request->data['payment'] == 'yes') {

                /** Check Plan Payment*/
                $checkcurrentplan = $connection->execute("SELECT * FROM user_plan_payment WHERE iFkUserId = $UID AND vStatus='active'")->fetch('assoc');

                $pid = $checkcurrentplan['iFkUserPlanId'];
                $checkplan = $connection->execute("SELECT * FROM mst_plans WHERE iPkPlanId = $pid AND ePlanStatus='active'")->fetch('assoc');

                if ($checkplan['AllowLessons'] == 'yes') {
                    $is_payment_done = true;
                } else {
                    $lesson_purchase_details = TableRegistry::get('ulp', ['className' => 'user_lesson_payment'])->find()
                        ->select(['ulp.iPkLessonPaymentId'])
                        ->where(['ulp.iFkUserProductId' => $user_product_id])->andWhere(['ulp.ePaymentStatus' => 'success'])->toArray();

                    if (empty($lesson_purchase_details)) {
                        $is_payment_done = false;
                    }
                }
            }

            if ($is_payment_done) {
                $videoId = $this->request->data['fieldvalue'];
                $resources_data = TableRegistry::get('mlr', ['className' => 'mst_lessons_resource'])->find()
                    ->select(['mlr.iPkLessonRId', 'mlr.vLessonResource', 'mlr.eLessonResourceType'])
                    ->where(['mlr.iPkLessonRId' => $videoId])->first()->toArray();

                $video_url = $connection->execute("SELECT * FROM mst_lessons WHERE iPkLessonId= " . $lessonId . "")->fetch('assoc');

                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                /*$this->apiResponse['data'] = image_url() . 'videos/' . $resources_data['vLessonResource'];*/
                $this->apiResponse['data'] = $video_url['vLessonVideoLink'];
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['is_payment_done'] = $is_payment_done;
            }
        }
    }

    public function downloadResources()
    {
        $user_product_id = $this->request->query['pid'];
        $is_payment_done = true;
        if ($this->request->query['ptype'] == 'yes') {
            $fileName = basename($this->request->query['filename']);
            $filePath = WWW_ROOT . 'resources/' . $this->request->query['filename'];
            //$filePath = 'https://app.veazy.com.au/api/webroot/resources/' . $this->request->query['filename'];
            //$filePath = 'https://app.veazy.com.au/api/webroot/resources/Lesson_overview_1582194757.png';
            if (!empty($fileName) && file_exists($filePath)) {
                // Define headers 
                /*header("Cache-Control: public");
                header('Content-Type: application/octet-stream');
                header("Content-Type:" . mime_content_type($this->request->query['filename']));
                header("Content-Description: File Transfer");
                header("Content-Disposition: attachment; filename=$fileName");
                header("Content-Transfer-Encoding: binary");
                
                readfile($filePath);
                exit;*/

                ob_clean(); //very important
                // http headers for zip downloads
                header("Pragma: public");
                header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
                header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
                header("Cache-Control: public");
                header('Content-Type: application/x-download');
                header("Content-Disposition: attachment; filename=\"$fileName\"");
                header("Content-Length: " . filesize($filePath));

                @readfile($filePath);
                //unlink($filePath);  //very important
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'The file does not exist on server.';
            }
        } else {
            if ($this->request->query['payment'] == 'yes') {
                $lesson_purchase_details = TableRegistry::get('ulp', ['className' => 'user_lesson_payment'])->find()
                    ->select(['ulp.iPkLessonPaymentId'])
                    ->where(['ulp.iFkUserProductId' => $user_product_id])->andWhere(['ulp.ePaymentStatus' => 'success'])->toArray();

                if (empty($lesson_purchase_details)) {
                    $is_payment_done = false;
                }
            }

            if ($is_payment_done) {
                $fileName = basename($this->request->query['filename']);
                $filePath = WWW_ROOT . 'resources/' . $this->request->query['filename'];

                if (!empty($fileName) && file_exists($filePath)) {
                    ob_clean(); //very important
                    // http headers for zip downloads
                    header("Pragma: public");
                    header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
                    header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
                    header("Cache-Control: public");
                    header('Content-Type: application/x-download');
                    header("Content-Disposition: attachment; filename=\"$fileName\"");
                    header("Content-Length: " . filesize($filePath));

                    @readfile($filePath);
                    //unlink($filePath);  //very important
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'The file does not exist on server.';
                }
            } else {
                $this->httpStatusCode = 400;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['is_payment_done'] = $is_payment_done;
            }
        }
    }

    public function lessonPayment()
    {
        $url = str_replace("/api", "", home_base_url());
        $user_product_id = $this->request->data['pid'];
        $iPkUserProductId = Security::encrypt($user_product_id, ENCRYPTION_KEY);
        $location_path = $url . 'product/lessons?vpid=' . urlencode(urlencode($iPkUserProductId));
        $connection = ConnectionManager::get('default');
        $UID = $this->request->session()->read('user_id');
        $now = date('Y-m-d H:i:s');

        \Stripe\Stripe::setApiKey(stripe_secret_key);
        \Stripe\Stripe::setVerifySslCerts(false);

        try {
            $stripetoken = $this->request->data['stripeToken'];

            $charge = \Stripe\Charge::create(array(
                "description" => "Lessons Fee",
                "source" => $stripetoken,
                'amount' => $this->request->data['amount'],
                'currency' => 'aud'
            ));

            $brand = $charge->source;
            $brand = $brand->__toArray();
            $brand = $brand['brand'];

            $transaction_id = $charge->id;
            $connection->insert('user_lesson_payment', [
                'iFkUserId' => $UID,
                'vTransId' => $transaction_id,
                'brand' => $brand,
                'iFkUserProductId' => $user_product_id,
                'dPaymentAmount' => ($this->request->data['amount'] / 100),
                'vPaymentCurrency' => 'AUD',
                'ePaymentStatus' => 'success',
                'dtPaymentOn' => $now
            ]);

            echo '<script>localStorage.setItem("suc","success");localStorage.setItem("msg","Your transaction has been done successfully.");window.location.href ="' . $location_path . '"; </script>';
            exit;
        } catch (\Exception $e) {
            $error = $e->getMessage();
            echo '<script>localStorage.setItem("suc","fail");localStorage.setItem("msg","' . $error . '");window.location.href ="' . $location_path . '"; </script>';
            exit;
        }
    }

    public function planPayment()
    {
        $url = str_replace("/api", "", home_base_url());
        $user_plan_id = $this->request->data['pid'];
        $iPkUserPlanId = Security::encrypt($user_plan_id, ENCRYPTION_KEY);
        //$location_path1 = $url . 'product/plans?pid=' . urlencode(urlencode($iPkUserPlanId));
        $location_path = $url . 'dashboard';
        $connection = ConnectionManager::get('default');
        $UID = $this->request->session()->read('user_id');
        $now = date('Y-m-d H:i:s');

        \Stripe\Stripe::setApiKey(stripe_secret_key);

        \Stripe\Stripe::setVerifySslCerts(false);
        //echo "<pre>"; print_r($this->request->data); exit;
        /** find plan details start */
        $getplandetails = $connection->execute("SELECT * FROM mst_plans WHERE iPkPlanId = '" . $user_plan_id . "'")->fetch('assoc');
        //echo "<pre>"; print_r($getplandetails); exit;

        $plan_id = $getplandetails['Unique_Plan_ID'];

        /** find plan details end */

        /** find email of the user */
        $getUser = $connection->execute("SELECT * FROM mst_user WHERE iPkUserId = '" . $UID . "'")->fetch('assoc');
        $is_customer_exists = \Stripe\Customer::all(["email" => $getUser['vEmail']]);
        //echo $is_customer_exists; exit;



        $plan_type = $this->request->data['plantype'];

        if ($plan_type == 'monthly') {
            $expire_date = date("Y-m-d H:i:s", strtotime("+1 months", strtotime($now)));
        } else if ($plan_type == 'free') {
            $expire_date = '';
        } else {
            $expire_date = date("Y-m-d H:i:s", strtotime("+1 years", strtotime($now)));
        }


        try {
            $stripetoken = $this->request->data['stripeToken'];

            $checkplan = $connection->execute("SELECT * FROM user_plan_payment WHERE iFkUserId = $UID AND vStatus='active'")->fetchall('assoc');
            //echo "<pre>"; print_r($checkplan); exit;

            if (count($checkplan) > 0 && $checkplan[0]['customer_id'] != '' && $checkplan[0]['subscription_id'] != '') {

                $get_user_subscription_detail = $connection->execute("select * from user_plan_payment where iFkUserId= $UID AND vStatus='active'")->fetchAll('assoc');
                //echo "<pre>"; print_r($get_user_subscription_detail); exit;
                if ($get_user_subscription_detail[0]['subscription_id'] == null) {
                    $connection->update('user_plan_payment', [
                        'vStatus' => 'inactive'
                    ], ['iFkUserId' => $UID]);
                } else {
                    $get_user_subscription_id = $get_user_subscription_detail[0]['subscription_id'];
                    $get_user_customer_id = $get_user_subscription_detail[0]['customer_id'];

                    $subscription = \Stripe\Subscription::retrieve($get_user_subscription_id);
                    \Stripe\Subscription::update($get_user_subscription_id, [
                        'cancel_at_period_end' => false,
                        'items' => [
                            [
                                'id' => $subscription->items->data[0]->id,
                                'plan' => $plan_id,
                            ],
                        ],
                    ]);

                    // Set proration date to this moment:
                    $proration_date = time();

                    $subscription = \Stripe\Subscription::retrieve($get_user_subscription_id);
                    //echo "<pre>"; print_r($subscription); exit;
                    // See what the next invoice would look like with a plan switch
                    // and proration set:
                    $items = [
                        [
                            'id' => $subscription->items->data[0]->id,
                            'plan' => $plan_id, # Switch to new plan
                        ],
                    ];

                    // $invoice = \Stripe\Invoice::upcoming([
                    //     'customer' => $get_user_customer_id,
                    //     'subscription' => $get_user_subscription_id,
                    //     'subscription_items' => $items,
                    //     'subscription_proration_date' => $proration_date,
                    // ]);

                    // Calculate the proration cost:
                    // $cost = 0;
                    // $current_prorations = [];
                    // foreach ($invoice->lines->data as $line) {
                    //     if ($line->period->start == $proration_date) {
                    //         array_push($current_prorations, $line);
                    //         $cost += $line->amount;
                    //     }
                    // }      

                    \Stripe\Subscription::update($get_user_subscription_id, [
                        'items' => [
                            [
                                'id' => $subscription->items->data[0]->id,
                                'plan' => $plan_id,
                            ],
                        ],
                        'proration_date' => $proration_date,
                        //'billing_cycle_anchor' => 'unchanged',
                        'prorate' => true,
                    ]);

                    /*======================================================*/
                    /*$invoices = \Stripe\Invoice::create([
						    "customer" => $get_user_customer_id
						]);   

						$invoice_id = $invoices['id'];

						$invoice = \Stripe\Invoice::retrieve($invoice_id);
						$invoice->pay();*/
                    /*======================================================*/

                    /*\Stripe\InvoiceItem::create([
                            'customer' => $get_user_customer_id,
                            'amount' => 0,
                            'currency' => 'aud',
                            'description' => 'One-time setup fee',
                        ]);*/

                    $invoices = \Stripe\Invoice::create([
                        'customer' => $get_user_customer_id,
                        'auto_advance' => true, /* auto-finalize this draft after ~1 hour */
                    ]);

                    //$invoice_id = $invoices['id'];

                    //echo $invoices['id']; exit;
                    //echo "<pre>"; print_r($invoices); exit;

                    //$invoice = \Stripe\Invoice::retrieve($invoice_id);
                    //$invoice->finalizeInvoice(); 


                    // $invoice = \Stripe\Invoice::create([
                    //     'customer' => $get_user_customer_id,
                    //     'collection_method' => 'send_invoice',
                    //     'days_until_due' => 30,
                    // ]);         

                    $connection->update('user_plan_payment', [
                        'vStatus' => 'inactive'
                    ], ['iFkUserId' => $UID]);

                    $connection->insert('user_plan_payment', [
                        'iFkUserId' => $UID,
                        'brand' => $brand,
                        'customer_id' => $get_user_customer_id,
                        'subscription_id' => $get_user_subscription_id,
                        'iFkUserPlanId' => $user_plan_id,
                        'vPlanType' => $plan_type,
                        'dPaymentAmount' => ($this->request->data['amount'] / 100),
                        'vPaymentCurrency' => 'AUD',
                        'ePaymentStatus' => 'success',
                        'vStatus' => 'active',
                        'dtPaymentOn' => $now,
                        'dtExpireDate' => $expire_date,
                    ]);
                }
            } else {
                //die('else');
                /** create customer start */
                if ($plan_type != 'free') {

                    /*if(count($is_customer_exists['data'] > 0)){
                        $customerid = $is_customer_exists['data'][0]['id'];
                        echo $customerid; exit;
                    }else{*/

                    //Create a Customer:
                    $customer = \Stripe\Customer::create(array(
                        "email" => $getUser['vEmail'],
                        "source" => $stripetoken,
                    ));

                    $brand = $customer->sources->data[0]->brand;


                    $customerid = $customer->id;
                    /*}*/
                }




                if ($getplandetails['Plan_names'] == 'Pro' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Pro_Monthly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Pro' && $getplandetails['Plan_Duration'] == 'yearly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Pro_Yearly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Professional5' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Professional5",
                            ),
                        )
                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Professional7' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Professional7",
                            ),
                        )
                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Professional10' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Professional10",
                            ),
                        )
                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Basic' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Basic_Monthly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Basic' && $getplandetails['Plan_Duration'] == 'yearly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Basic_Yearly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Premium' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Premium_Monthly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Premium' && $getplandetails['Plan_Duration'] == 'yearly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Premium_Yearly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'QA_test' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "QA_Test_Monthly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'QA_test' && $getplandetails['Plan_Duration'] == 'yearly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "QA_Test_Yearly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == '$5 Monthly' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Testing_5",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Individual' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Individual_Monthly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Individual' && $getplandetails['Plan_Duration'] == 'yearly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Individual_Yearly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Business' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Business_Monthly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Business' && $getplandetails['Plan_Duration'] == 'yearly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Business_Yearly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Professional' && $getplandetails['Plan_Duration'] == 'monthly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Professional_Monthly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Professional' && $getplandetails['Plan_Duration'] == 'yearly') {
                    $subscription = \Stripe\Subscription::create(array(
                        "customer" => $customer->id,
                        "items" => array(
                            array(
                                "plan" => "Professional_Yearly",
                            ),
                        ),

                    ));
                    $subscriptionid = $subscription->id;
                } else {
                    $charge = \Stripe\Charge::create(array(
                        "description" => "Plan Fee",
                        "source" => $stripetoken,
                        'amount' => $this->request->data['amount'],
                        'currency' => 'aud',
                        'receipt_email' => $getUser['vEmail'],
                    ));

                    $brand = $charge->source;
                    $brand = $brand->__toArray();
                    $brand = $brand['brand'];
                }

                /** create customer end*/

                $get_user_subscription_detail = $connection->execute("select * from user_plan_payment where iFkUserId= $UID AND vStatus='active'")->fetchAll('assoc');
                //echo "<pre>"; print_r($get_user_subscription_detail); exit;
                if ($get_user_subscription_detail[0]['subscription_id'] == null) {
                    $connection->update('user_plan_payment', [
                        'vStatus' => 'inactive'
                    ], ['iFkUserId' => $UID]);
                }

                $connection->insert('user_plan_payment', [
                    'iFkUserId' => $UID,
                    'brand' => $brand,
                    'customer_id' => $customerid,
                    'subscription_id' => $subscriptionid,
                    'iFkUserPlanId' => $user_plan_id,
                    'vPlanType' => $plan_type,
                    'dPaymentAmount' => ($this->request->data['amount'] / 100),
                    'vPaymentCurrency' => 'AUD',
                    'ePaymentStatus' => 'success',
                    'vStatus' => 'active',
                    'dtPaymentOn' => $now,
                    'dtExpireDate' => $expire_date,
                ]);
            }



            /*$brand = $charge->source;
            $brand = $brand->__toArray();
            $brand = $brand['brand'];*/

            //$transaction_id = $charge->id;



            echo '<script>localStorage.setItem("suc","success");localStorage.setItem("msg","Your transaction has been done successfully.");window.location.href ="' . $location_path . '"; </script>';
            exit;
        } catch (\Exception $e) {
            $error = $e->getMessage();
            echo '<script>localStorage.setItem("suc","fail");localStorage.setItem("msg","' . $error . '");window.location.href ="' . $location_path . '"; </script>';
            exit;
        }
    }


    public function trialPayment()
    {
        //echo "<pre>"; print_r($this->request->data); exit;
        //$url = str_replace("webservice/", "", home_base_url());
        $url = str_replace("/api", "", home_base_url());
        $user_plan_id = $this->request->data['pid'];
        $iPkUserPlanId = Security::encrypt($user_plan_id, ENCRYPTION_KEY);
        //$location_path1 = $url . 'product/plans?pid=' . urlencode(urlencode($iPkUserPlanId));
        $location_path = $url . 'dashboard';
        $connection = ConnectionManager::get('default');
        $UID = $this->request->session()->read('user_id');
        $now = date('Y-m-d H:i:s');
        //echo "<pre>"; print_r($this->request->data); exit;
        /** find plan details start */
        $getplandetails = $connection->execute("SELECT * FROM mst_plans WHERE iPkPlanId = '" . $user_plan_id . "'")->fetch('assoc');

        /** fetch trialPeriod from general settings */
        $gettrialperiod = $connection->execute("SELECT * FROM general_settings ")->fetch('assoc');
        $tday = $gettrialperiod['ITrialPeriod'];
        /** find plan details end */

        /** find email of the user */
        $getUser = $connection->execute("SELECT * FROM mst_user WHERE iPkUserId = '" . $UID . "'")->fetch('assoc');

        $plan_type = $this->request->data['plantype'];

        if ($tday == 0) {
            $trialzero = $this->planPayment();
            return $trialzero;
        } else {
            if ($plan_type == 'monthly') {
                $expire_date = date("Y-m-d H:i:s", strtotime("+1 months +$tday days", strtotime($now)));
                $Trial_end = date("Y-m-d H:i:s", strtotime("+$tday days", strtotime($now)));
            } else {
                $expire_date = date("Y-m-d H:i:s", strtotime("+1 years +$tday days", strtotime($now)));
                $Trial_end = date("Y-m-d H:i:s", strtotime("+$tday days", strtotime($now)));
            }

            //echo $expire_date .'<--->'.$Trial_end.'<br>';
            $timestamp = strtotime($Trial_end);

            //echo $timestamp; exit;

            \Stripe\Stripe::setApiKey(stripe_secret_key);

            \Stripe\Stripe::setVerifySslCerts(false);
            try {
                $stripetoken = $this->request->data['stripeToken'];

                /** create customer start */
                if ($plan_type != 'free') {
                    //Create a Customer:
                    $customer = \Stripe\Customer::create(array(
                        "email" => $getUser['vEmail'],
                        "source" => $stripetoken,
                    ));
                    //echo "<pre>"; print_r($customer); exit;
                }


                $brand = $customer->sources->data[0]->brand;


                $customerid = $customer->id;

                if ($getplandetails['Plan_names'] == 'Pro' && $getplandetails['Plan_Duration'] == 'monthly') {

                    $subscription = \Stripe\Subscription::create([
                        'customer' => $customer->id,
                        'items' => [['plan' => 'Pro_Monthly']],
                        'trial_end' => $timestamp,
                    ]);
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Pro' && $getplandetails['Plan_Duration'] == 'yearly') {

                    $subscription = \Stripe\Subscription::create([
                        'customer' => $customer->id,
                        'items' => [['plan' => 'Pro_Yearly']],
                        'trial_end' => $timestamp,
                    ]);
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Basic' && $getplandetails['Plan_Duration'] == 'monthly') {


                    $subscription = \Stripe\Subscription::create([
                        'customer' => $customer->id,
                        'items' => [['plan' => 'Basic_Monthly']],
                        'trial_end' => $timestamp,
                    ]);
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Basic' && $getplandetails['Plan_Duration'] == 'yearly') {

                    $subscription = \Stripe\Subscription::create([
                        'customer' => $customer->id,
                        'items' => [['plan' => 'Basic_Yearly']],
                        'trial_end' => $timestamp,
                    ]);
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Premium' && $getplandetails['Plan_Duration'] == 'monthly') {

                    $subscription = \Stripe\Subscription::create([
                        'customer' => $customer->id,
                        'items' => [['plan' => 'Premium_Monthly']],
                        'trial_end' => $timestamp,
                    ]);
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'Premium' && $getplandetails['Plan_Duration'] == 'yearly') {

                    $subscription = \Stripe\Subscription::create([
                        'customer' => $customer->id,
                        'items' => [['plan' => 'Premium_Yearly']],
                        'trial_end' => $timestamp,
                    ]);
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'QA_test' && $getplandetails['Plan_Duration'] == 'monthly') {

                    $subscription = \Stripe\Subscription::create([
                        'customer' => $customer->id,
                        'items' => [['plan' => 'QA_Test_Monthly']],
                        'trial_end' => $timestamp,
                    ]);
                    $subscriptionid = $subscription->id;
                } else if ($getplandetails['Plan_names'] == 'QA_test' && $getplandetails['Plan_Duration'] == 'yearly') {

                    $subscription = \Stripe\Subscription::create([
                        'customer' => $customer->id,
                        'items' => [['plan' => 'QA_Test_Yearly']],
                        'trial_end' => $timestamp,
                    ]);
                    $subscriptionid = $subscription->id;
                } else {
                    $charge = \Stripe\Charge::create(array(
                        "description" => "Plan Fee",
                        "source" => $stripetoken,
                        'amount' => $this->request->data['amount'],
                        'currency' => 'aud'
                    ));

                    $brand = $charge->source;
                    $brand = $brand->__toArray();
                    $brand = $brand['brand'];
                }

                /** create customer end*/

                //echo "<pre>"; print_r($subscription); exit;

                $connection->insert('user_plan_payment', [
                    'iFkUserId' => $UID,
                    'brand' => $brand,
                    'customer_id' => $customerid,
                    'subscription_id' => $subscriptionid,
                    'Trial_End_Date' => $Trial_end,
                    'iFkUserPlanId' => $user_plan_id,
                    'vPlanType' => $plan_type,
                    'dPaymentAmount' => ($this->request->data['amount'] / 100),
                    'vPaymentCurrency' => 'AUD',
                    'ePaymentStatus' => 'success',
                    'vStatus' => 'active',
                    'dtPaymentOn' => $now,
                    'dtExpireDate' => $expire_date,
                ]);

                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['message'] = 'TEST';

                /*echo "<script>
alert( 'hghg');
                        localStorage.setItem('suc','success');
                        localStorage.setItem('msg','Your Trial Period has been Start successfully.');
                        window.location.href = $location_path; 
                      </script>";
                exit;*/
            } catch (\Exception $e) {
                $error = $e->getMessage();
                echo '<script>localStorage.setItem("suc","fail");localStorage.setItem("msg","' . $error . '");window.location.href ="' . $location_path . '"; </script>';
                exit;
            }
        }
    }

    /** check balance is arrived or not from customer */
    public function receivepayment()
    {
        \Stripe\Stripe::setApiKey(stripe_secret_key);

        \Stripe\Stripe::setVerifySslCerts(false);

        $connection = ConnectionManager::get('default');

        /** fetch trialPeriod from general settings */
        $gettrialperiod = $connection->execute("SELECT * FROM general_settings ")->fetch('assoc');


        $get_upcominginvoice = \Stripe\Invoice::upcoming(array("customer" => 'cus_E6XCjbHNW2uDDh'));
        $get_next_invoice_status = $get_upcominginvoice->paid;

        echo "<pre>";
        print_r($get_upcominginvoice);
        exit;
    }

    /** Check Trial Day */
    public function checktrialday()
    {
        $connection = ConnectionManager::get('default');

        /** fetch trialPeriod from general settings */
        $gettrialperiod = $connection->execute("SELECT * FROM general_settings ")->fetch('assoc');
        $tday = $gettrialperiod['ITrialPeriod'];
        if ($tday == 0) {
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['trial'] = 'paid';
        } else {
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['trial'] = 'free';
        }
    }

    public function trialendmail()
    {
        $now = date('Y-m-d');
        $connection = ConnectionManager::get('default');
        \Stripe\Stripe::setApiKey(stripe_secret_key);
        \Stripe\Stripe::setVerifySslCerts(false);
        $plustwodays = date("Y-m-d", strtotime($now . "+1 day"));
        /** find user that plan has been expired*/
        $findusersplan = $connection->execute("SELECT * FROM user_plan_payment where Trial_End_Date LIKE '%$plustwodays%' AND vStatus='active'")->fetchAll('assoc');
        //echo "<pre>"; print_r($findusersplan); exit;
        if (!empty($findusersplan)) {
            foreach ($findusersplan as $key => $value) {

                $UID[] = $value['iFkUserId'];
            }

            $UID = implode(",", $UID);

            $findusers = $connection->execute("SELECT * FROM mst_user where iPkUserId IN ($UID)")->fetchAll('assoc');
            //echo "<pre>"; print_r($findusers); exit;
            if (!empty($findusers)) {
                foreach ($findusers as $key2 => $data) {
                    $vFirstName = $data['vFirstName'];
                    $vEmail = $data['vEmail'];
                    /*$email = new Email();

                    $link = "<a href=" . $_SERVER['HTTP_HOST'] . "/veazy-portal/Plans>Click Here</a>";

                    $message = '<html><body>';
                    $message .= '<p>Hi <b>'.$vFirstName.'</b>,</p>';
                    $message .= '<p>Your plan will be Expiring in 2 days. To renew it,'.$link.'</p>';
                    $message .= '<p>Yours sincerely,<br>Team Veazy</br></p>';
                    $message .= '</body></html>';

                    $dir = new Folder(WWW_ROOT . 'templates');
                    $files = $dir->find('planexpire.html', true);
                    foreach ($files as $file) {
                        $file = new File($dir->pwd() . DS . $file);
                        $contents = $file->read();
                        $file->close();
                    }

                    $patterns = array();
                    $outputs = preg_replace($patterns, '', $contents);

                    $message = str_replace(
                        array('{TITLE}', '{FIRSTNAME}', '{BODY}'),
                        array('Trial Period Expire Reminder', $vFirstName, 'Your Trial Period will be Expiring in 2 days. To renew it,' . $link),
                        $outputs);

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
                        ->subject('Trial Period Expire Reminder')
                        ->send($message);*/
                }
            }
        }
    }

    public function expireplan()
    {
        $now = date('Y-m-d');
        $connection = ConnectionManager::get('default');
        \Stripe\Stripe::setApiKey(stripe_secret_key);
        \Stripe\Stripe::setVerifySslCerts(false);
        /** find user that plan has been expired*/
        $findusersplan = $connection->execute("SELECT * FROM user_plan_payment where dtExpireDate LIKE '%$now%' AND vStatus='active'")->fetchAll('assoc');

        if (!empty($findusersplan)) {
            foreach ($findusersplan as $key => $value) {
                $UID = $value['iFkUserId'];

                $get_user_subscription_detail = $connection->execute("select subscription_id from user_plan_payment where iFkUserId=$UID AND vStatus='active'")->fetchAll('assoc');
                foreach ($get_user_subscription_detail as $key2 => $data) {
                    $get_user_subscription_id = $data['subscription_id'];
                    $subscription = \Stripe\Subscription::retrieve($get_user_subscription_id);
                    $subscription->cancel();
                }

                $connection->update('user_plan_payment', [
                    'vStatus' => 'inactive'
                ], ['iFkUserId' => $UID]);

                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['message'] = 'Your Plan has been Cancelled';
            }
        } else {
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Currently No Any Plan has going to be Expire';
        }
    }

    public function expiretrial()
    {
        $now = date('Y-m-d');
        $connection = ConnectionManager::get('default');
        \Stripe\Stripe::setApiKey(stripe_secret_key);
        \Stripe\Stripe::setVerifySslCerts(false);
        /** find user that plan has been expired*/
        $findusersplan = $connection->execute("SELECT * FROM user_plan_payment where Trial_End_Date LIKE '%$now%' AND vStatus='active'")->fetchAll('assoc');
        //echo "<pre>"; print_r($findusersplan); exit;
        if (!empty($findusersplan)) {
            foreach ($findusersplan as $key => $value) {
                $UID = $value['iFkUserId'];

                /*$get_user_subscription_detail = $connection->execute("select subscription_id from user_plan_payment where iFkUserId=$UID AND vStatus='active'")->fetchAll('assoc');
                foreach ($get_user_subscription_detail as $key2 => $data) {
                    $get_user_subscription_id = $data['subscription_id'];
                    $subscription = \Stripe\Subscription::retrieve($get_user_subscription_id);
                    $subscription->cancel();
                }*/

                $connection->update('user_plan_payment', [
                    'vStatus' => 'inactive'
                ], ['iFkUserId' => $UID]);
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['message'] = 'Your Plan has been Canceld';
        } else {
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Currently No Any Plan has going to be Expire';
        }
    }

    public function expireplanmail()
    {

        $now = date('Y-m-d');
        $connection = ConnectionManager::get('default');
        \Stripe\Stripe::setApiKey(stripe_secret_key);
        \Stripe\Stripe::setVerifySslCerts(false);
        $plustwodays = date("Y-m-d", strtotime($now . "+2 day"));
        /** find user that plan has been expired*/
        $findusersplan = $connection->execute("SELECT * FROM user_plan_payment where dtExpireDate LIKE '%$plustwodays%' AND vStatus='active'")->fetchAll('assoc');
        if (!empty($findusersplan)) {
            foreach ($findusersplan as $key => $value) {

                $UID = $value['iFkUserId'];
            }
            $findusers = $connection->execute("SELECT * FROM mst_user where iPkUserId IN ($UID)")->fetchAll('assoc');
            //echo "<pre>"; print_r($findusers); exit;
            if (!empty($findusers)) {
                foreach ($findusers as $key2 => $data) {
                    $vFirstName = $data['vFirstName'];
                    $vEmail = $data['vEmail'];
                    $email = new Email();

                    $link = "<a href=" . $_SERVER['HTTP_HOST'] . "/veazy-portal/Plans>Click Here</a>";

                    /*$message = '<html><body>';
                    $message .= '<p>Hi <b>'.$vFirstName.'</b>,</p>';
                    $message .= '<p>Your plan will be Expiring in 2 days. To renew it,'.$link.'</p>';
                    $message .= '<p>Yours sincerely,<br>Team Veazy</br></p>';
                    $message .= '</body></html>';*/

                    $dir = new Folder(WWW_ROOT . 'templates');
                    $files = $dir->find('planexpire.html', true);
                    foreach ($files as $file) {
                        $file = new File($dir->pwd() . DS . $file);
                        $contents = $file->read();
                        $file->close();
                    }

                    $patterns = array();
                    $outputs = preg_replace($patterns, '', $contents);

                    $message = str_replace(
                        array('{TITLE}', '{FIRSTNAME}', '{BODY}'),
                        array('Subscription Expire Reminder', $vFirstName, 'Your plan will be Expiring in 2 days. To renew it,' . $link),
                        $outputs
                    );

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
                        ->subject('Subscription Expire Reminder')
                        ->send($message);
                }
            }
        }
    }

    public function checkapplication()
    {
        $UID = $this->request->session()->read('user_id');

        $user_plan_id = $this->request->query['pid'];
        $plantype = $this->request->query['plantype'];


        $now = date('Y-m-d H:i:s');
        //echo "<pre>"; print_r($this->request->query); exit;

        \Stripe\Stripe::setApiKey(stripe_secret_key);

        \Stripe\Stripe::setVerifySslCerts(false);

        /** fetch selected plan application */
        $connection = ConnectionManager::get('default');
        $selectplan = $connection->execute("SELECT * FROM mst_plans where iPkPlanId = $user_plan_id and ePlanStatus='active'")->fetch('assoc');
        //echo '<pre>'; print_r($selectplan); exit;
        $checkuserproduct = $connection->execute("SELECT * FROM user_products WHERE eUserProductStatus = 'active' AND iFkUserId = $UID")->fetchAll('assoc');

        $currentplan = $connection->execute("SELECT * FROM user_plan_payment where iFkUserId = $UID and vStatus='active'")->fetch('assoc');

        if (!empty($checkuserproduct)) {
            $count_application = count($checkuserproduct);

            if (!empty($currentplan)) {

                /** find current plan application from current plan*/
                if ($count_application > $selectplan['no_application']) {
                    $total_application_to_delete = $count_application - $selectplan['no_application'];
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = "You need to delete " . $total_application_to_delete . " Application to Downgrade Your Plan";
                } else {

                    if ($this->request->query['plantype'] == 'free') {
                        $checkplan = $connection->execute("SELECT * FROM user_plan_payment WHERE iFkUserId = $UID AND vStatus='active'")->fetchall('assoc');

                        if (!empty($checkplan)) {
                            $get_user_subscription_detail = $connection->execute("select subscription_id from user_plan_payment where iFkUserId= $UID AND vStatus='active'")->fetchAll('assoc');

                            if (!empty($get_user_subscription_detail[0]['subscription_id'])) {
                                $get_user_subscription_id = $get_user_subscription_detail[0]['subscription_id'];

                                $subscription = \Stripe\Subscription::retrieve($get_user_subscription_id);
                                $subscription->cancel();
                            }

                            $connection->update('user_plan_payment', [
                                'vStatus' => 'inactive'
                            ], ['iFkUserId' => $UID]);
                        }

                        $connection->insert('user_plan_payment', [
                            'iFkUserId' => $UID,
                            'iFkUserPlanId' => $user_plan_id,
                            'vPlanType' => 'free',
                            'dPaymentAmount' => 0,
                            'vStatus' => 'active',
                            'dtPaymentOn' => $now
                        ]);
                    }
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                }
            } else {
                $connection->insert('user_plan_payment', [
                    'iFkUserId' => $UID,
                    'iFkUserPlanId' => $user_plan_id,
                    'vPlanType' => $plantype,
                    'dPaymentAmount' => 0,
                    'vStatus' => 'active',
                    'dtPaymentOn' => $now
                ]);
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            }
        } else {

            if ($this->request->query['plantype'] == 'free') {
                $checkplan = $connection->execute("SELECT * FROM user_plan_payment WHERE iFkUserId = $UID AND vStatus='active'")->fetchall('assoc');

                if (!empty($checkplan)) {
                    $get_user_subscription_detail = $connection->execute("select subscription_id from user_plan_payment where iFkUserId= $UID AND vStatus='active'")->fetch('assoc');
                    if ($get_user_subscription_detail['subscription_id'] != '') {
                        $get_user_subscription_id = $get_user_subscription_detail['subscription_id'];
                        $subscription = \Stripe\Subscription::retrieve($get_user_subscription_id);
                        $subscription->cancel();
                    }

                    $connection->update('user_plan_payment', [
                        'vStatus' => 'inactive'
                    ], ['iFkUserId' => $UID]);
                }

                $connection->insert('user_plan_payment', [
                    'iFkUserId' => $UID,
                    'iFkUserPlanId' => $user_plan_id,
                    'vPlanType' => 'free',
                    'dPaymentAmount' => 0,
                    'vStatus' => 'active',
                    'dtPaymentOn' => $now
                ]);
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }


    /** checkdefaultplan */
    public function checkdefaultplan()
    {
        $connection = ConnectionManager::get('default');
        $now = date('Y-m-d');
        $check_plan = $connection->execute("SELECT * FROM general_settings")->fetch('assoc');
        //echo "<pre>"; print_r($check_plan); exit;
        $pid = $check_plan['vDefaultPlan'];
        $tpd = $check_plan['ITrialPeriod'];
        //echo $pid; exit;
        $dafault_plan = $connection->execute("SELECT * FROM mst_plans where iPkPlanId = $pid")->fetch('assoc');
        $dafault_plan['Start_date'] = $now;
        $end_date = date("Y-m-d", strtotime($now . "+$tpd day"));
        $dafault_plan['End_date'] = $end_date;
        //echo "<pre>"; print_r($dafault_plan); exit;
        if (!empty($dafault_plan)) {
            if ($dafault_plan['ePlanFee'] == 'free') {
                $this->httpStatusCode = 200;
                $this->apiResponse['plan'] = 'free';
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 200;
                $this->apiResponse['plan'] = 'paid';
                $this->apiResponse['valid'] = true;
                $this->apiResponse['data'] = $dafault_plan;
            }
        }
    }

    public function updateLessonWatchedStatus()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $user_product_id = $this->request->data['pid'];
            $UID = $this->request->session()->read('user_id');
            $now = date('Y-m-d H:i:s');

            $check_user_lesson = TableRegistry::get('ul', ['className' => 'user_lesson'])->find()
                ->select(['ul.iPkUserLessonId', 'ul.eIsCompleted', 'ul.dtUserLessonCompletedOn'])
                ->where(['ul.iFkLessonId' => $this->request->data['fieldvalue']])->andWhere(['ul.iFkUserProductId' => $user_product_id])->toArray();

            if (!empty($check_user_lesson)) {
                $status = '0';
                $date = null;
                if ($check_user_lesson[0]['eIsCompleted'] == '0') {
                    $status = '1';
                    $date = $now;
                }
                $connection->update('user_lesson', [
                    'iFkUserId' => $UID,
                    'iFkLessonFolderId' => $this->request->data['lfid'],
                    'eIsCompleted' => $status,
                    'dtUserLessonCompletedOn' => $date
                ], ['iFkUserProductId' => $user_product_id, 'iFkLessonId' => $this->request->data['fieldvalue']]);
            } else {
                $connection->insert('user_lesson', [
                    'iFkUserId' => $UID,
                    'iFkUserProductId' => $user_product_id,
                    'iFkLessonId' => $this->request->data['fieldvalue'],
                    'iFkLessonFolderId' => $this->request->data['lfid'],
                    'eIsCompleted' => '1',
                    'dtUserLessonCompletedOn' => $now
                ]);
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    /*********************************************
     *********** SUMMARY OF CRITERIA *************
     *********************************************/

    public function getUserSOC()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $soc_folder_ids = explode(',', $this->request->data['fieldvalue']);
            $soc_data = TableRegistry::get('msoc', ['className' => 'mst_summary_of_criteria'])->find()
                ->select([
                    'msoc.iPkSummaryId', 'msoc.iFkFolderId', 'msoc.vSummaryTitle', 'msoc.vSummaryDescription', 'cat_title' => 'cat.vDocCat', 'iPkUserSummaryId' => 'usoc.iPkUserSummaryId',
                    'is_watched' => 'CASE WHEN usoc.iPkUserSummaryId != "" THEN 1 ELSE 0 END'
                ])
                ->leftJoin(['cat' => 'mst_doc_category'], ['cat.iPkDocCatId =  msoc.iFkDocCatId'])
                ->leftJoin(['usoc' => 'user_summary_criteria'], ['usoc.iFkSummaryId =  msoc.iPkSummaryId', 'usoc.iFkUserProductId' => $this->request->data['pid'], 'usoc.eIsCompleted' => '1'])
                ->where(['msoc.iFkFolderId IN' => $soc_folder_ids])->andWhere(['msoc.eSummaryStatus' => 'active'])->order(['cat.iPriority' => 'ASC', 'cat.dtPriority' => 'DESC', 'msoc.iPriority' => 'ASC', 'msoc.dtPriority' => 'DESC'])->toArray();

            $result = array();
            foreach ($soc_data as $element) {
                $result[$element['cat_title']]['elements'][] = $element;
            }

            foreach ($result as $key => $soc) {
                $satisfied = 1;
                foreach ($soc['elements'] as $s) {
                    if ($s['is_watched'] == 0) {
                        $satisfied = 0;
                    }
                    $result[$key]['satisfied'] = $satisfied;
                }
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $result;
        }
    }

    public function getStatus()
    {

        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $status = $this->request->query['status'];
            $UID = $this->request->session()->read('user_id');
            $connection = ConnectionManager::get('default');
            $IMAGE_PATH = image_url() . 'product/';
            $products = $connection->execute("SELECT up.*,mvp.*,mvc.vVisaCat,plink.* FROM user_products AS up
                        LEFT JOIN user_products_linking AS plink ON up.iPkUserProductId = plink.iFkUserProductId OR up.iPkUserProductId = plink.iFkUserProductIdLinked
                        LEFT JOIN mst_visa_product AS mvp ON mvp.iPkVisaProductId = up.iFkVisaProductId
                        LEFT JOIN mst_visa_category AS mvc ON mvc.iPkVisaCatId = mvp.iFkVisaCatId
                        WHERE up.iFkUserId = '" . $UID . "' AND up.vLodgmentStatus LIKE '%$status%'AND up.eUserProductStatus = 'active' ORDER BY dtUserProductPurchasedOn DESC")->fetchAll('assoc');

            $records = array();
            foreach ($products as $key => $product) {
                $product['linked_product'] = '';
                if (!empty($product['iPkLinkId'])) {
                    if ($product['iFkUserProductId'] != $product['iPkUserProductId']) {
                        $product['linked_product'] = urlencode(urlencode(Security::encrypt($product['iFkUserProductId'], ENCRYPTION_KEY)));
                    } else {
                        $product['linked_product'] = urlencode(urlencode(Security::encrypt($product['iFkUserProductIdLinked'], ENCRYPTION_KEY)));
                    }
                }
                if ($this->request->query['limit'] == '2') {
                    if ($key < 2) {
                        $records[] = $product;
                        $iPkUserProductId = Security::encrypt($product['iPkUserProductId'], ENCRYPTION_KEY);
                        $records[$key]['iPkUserProductId'] = urlencode(urlencode($iPkUserProductId));
                        $records[$key]['eUserProStartDate'] = date('d, M Y', strtotime($product['eUserProductStartDate']));
                        if ($product['eUserProductStatus'] == 'active') {
                            $records[$key]['eUserProStatus'] = 'Active';
                        } else {
                            $records[$key]['eUserProStatus'] = 'Archived';
                        }
                        $records[$key]['pid'] = $product['iPkUserProductId'];
                        $records[$key]['vUserProductImage'] = $IMAGE_PATH . $product['vUserProductImage'];
                        $records[$key]['keyProgress'] = $this->getKeyprogress($product);

                        if ($product['dtDeadLineDate'] == '') {
                            $records[$key]['dtDeadLineDate'] = '-';
                        } else {
                            $records[$key]['dtDeadLineDate'] = date('l, jS F Y', strtotime($product['dtDeadLineDate']));
                        }
                    }
                } else {
                    $records[] = $product;
                    $iPkUserProductId = Security::encrypt($product['iPkUserProductId'], ENCRYPTION_KEY);
                    $records[$key]['iPkUserProductId'] = urlencode(urlencode($iPkUserProductId));
                    $records[$key]['eUserProStartDate'] = date('d, M Y', strtotime($product['eUserProductStartDate']));
                    if ($product['eUserProductStatus'] == 'active') {
                        $records[$key]['eUserProStatus'] = 'Active';
                    } else {
                        $records[$key]['eUserProStatus'] = 'Archived';
                    }
                    $records[$key]['pid'] = $product['iPkUserProductId'];
                    $records[$key]['vUserProductImage'] = $IMAGE_PATH . $product['vUserProductImage'];
                    $records[$key]['keyProgress'] = $this->getKeyprogress($product);

                    if ($product['dtDeadLineDate'] == '') {
                        $records[$key]['dtDeadLineDate'] = '-';
                    } else {
                        $records[$key]['dtDeadLineDate'] = date('l, jS F Y', strtotime($product['dtDeadLineDate']));
                    }
                }
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $records;
            $this->apiResponse['total_products'] = count($products);
        }
    }

    public function updateSummaryWatchedStatus()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $user_product_id = $this->request->data['pid'];
            $UID = $this->request->session()->read('user_id');
            $now = date('Y-m-d H:i:s');

            $check_user_summary = TableRegistry::get('usoc', ['className' => 'user_summary_criteria'])->find()
                ->select(['usoc.iPkUserSummaryId', 'usoc.dtUserSummaryCompletedOn', 'usoc.eIsCompleted'])
                ->where(['usoc.iFkSummaryId' => $this->request->data['fieldvalue']])->andWhere(['usoc.iFkUserProductId' => $user_product_id])->toArray();

            if (!empty($check_user_summary)) {
                $status = '0';
                $date = null;
                if ($check_user_summary[0]['eIsCompleted'] == '0') {
                    $status = '1';
                    $date = $now;
                }
                $connection->update('user_summary_criteria', [
                    'iFkUserId' => $UID,
                    'iFkSummaryFolderId' => $this->request->data['sfid'],
                    'eIsCompleted' => $status,
                    'dtUserSummaryCompletedOn' => $date
                ], ['iFkUserProductId' => $user_product_id, 'iFkSummaryId' => $this->request->data['fieldvalue']]);
            } else {
                $connection->insert('user_summary_criteria', [
                    'iFkUserId' => $UID,
                    'iFkUserProductId' => $user_product_id,
                    'iFkSummaryId' => $this->request->data['fieldvalue'],
                    'iFkSummaryFolderId' => $this->request->data['sfid'],
                    'eIsCompleted' => '1',
                    'dtUserSummaryCompletedOn' => $now
                ]);
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    /*********************************************
     ************ DOCUMENT CHECKLIST *************
     *********************************************/

    public function getDocuments()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $iPkUserRelationId = $this->request->data['relationid'];
            $user_product_ID = $this->request->data['pid'];

            $system_data = TableRegistry::get('md', ['className' => 'mst_documents'])->find()
                ->select([
                    'md.iPkDocId', 'md.vDocName', 'md.iFkDocCatId', 'md.vDocSuggestion', 'cat.dtPriority', 'cat.iPriority', 'md.vDocGuide', 'ud.vDocComment', 'cat_title' => 'cat.vDocCat',
                    'iPkDocCatId' => 'cat.iPkDocCatId', 'vFileName' => 'ud.vFileName', 'ud.eUserDocType',
                    'iPkUserDocId' => 'ud.iPkUserDocId', 'eUserDocStatus' => 'ud.eUserDocStatus',
                    'is_template_avail' => 'CASE WHEN template.iPkDocTemplateId != "" THEN 1 ELSE 0 END', 'dDocPrice' => 'tag.dDocPrice'
                ])
                ->leftJoin(['cat' => 'mst_doc_category'], ['cat.iPkDocCatId =  md.iFkDocCatId'])
                ->leftJoin(['template' => 'mst_doc_template'], ['template.iFkDocId =  md.iPkDocId'])
                ->leftJoin(['tag' => 'mst_tags'], ['tag.iDocFolderId =  md.iFkFolderId'])
                ->leftJoin(['ur' => 'user_relationship'], ['ur.iFkTagId =  tag.iPKTagId'])
                ->leftJoin(['ud' => 'user_required_documents'], ['ud.iFkDocId = md.iPkDocId', 'ud.iFkUserRelationId = ur.iPkUserRelationId', 'ud.iFkUserProductId = ur.iFkUserProductId', 'ud.eUserDocType' => 'system'])
                ->where(['ur.iPkUserRelationId' => $iPkUserRelationId])->andWhere(['ur.iFkUserProductId' => $user_product_ID])->andWhere(['md.eDocStatus' => 'active'])->order(['cat.iPriority' => 'ASC', 'cat.dtPriority' => 'DESC', 'md.iPriority' => 'ASC', 'md.dtPriority' => 'DESC'])->distinct()->toArray();

            $custom_data = TableRegistry::get('ur', ['className' => 'user_required_documents'])->find()
                ->select([
                    'iPkDocId' => 'ur.iFkDocId', 'ur.vDocName', 'ur.iFkDocCatId', 'ur.vDocSuggestion', 'ur.vDocGuide', 'ur.vDocComment', 'cat_title' => 'cat.vDocCat',
                    'iPkDocCatId' => 'cat.iPkDocCatId', 'vFileName' => 'ur.vFileName', 'ur.eUserDocType',
                    'iPkUserDocId' => 'ur.iPkUserDocId', 'eUserDocStatus' => 'ur.eUserDocStatus'
                ])
                ->leftJoin(['cat' => 'mst_doc_category'], ['cat.iPkDocCatId =  ur.iFkDocCatId'])
                ->where(['ur.eUserDocType' => 'custom'])->where(['ur.iFkUserRelationId' => $iPkUserRelationId])->andWhere(['ur.iFkUserProductId' => $user_product_ID])->order(['ur.iPkUserDocId' => 'ASC'])->toArray();

            $document_data = array_merge($system_data, $custom_data);
            $result = array();

            $templates = 0;
            foreach ($document_data as $element) {
                $is_template_avail = 0;
                if (isset($element->is_template_avail)) {
                    $is_template_avail = $element->is_template_avail;
                }

                if (!isset($element->eUserDocType)) {
                    $element->eUserDocType = 'system';
                }

                if (empty($element->eUserDocStatus)) {
                    $element->eUserDocStatus = 'notcollected';
                }

                if (!empty($element->vFileName)) {
                    $element->docfile = image_url() . 'documents/' . $element->vFileName;
                } else {
                    $element->docfile = '';
                }
                $element->is_template_avail = $is_template_avail;
                $result[$element['cat_title']]['elements'][] = $element;
                $result[$element['cat_title']]['cat_id'] = $element['iPkDocCatId'];
                if ($is_template_avail == 1) {
                    $templates++;
                }
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $result;
            $this->apiResponse['t_price'] = $system_data[0]['dDocPrice'];
            $this->apiResponse['templates'] = $templates;
        }
    }

    /* UPLOAD DOCUMENT FOR FUT */
    public function uploadDocument()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $this->request->allowMethod('post');
            $connection = ConnectionManager::get('default');
            $now = date('Y-m-d H:i:s');

            $user_product_ID = $this->request->data['pid'];
            $relation_ID = $this->request->data['relationid'];
            $document_ID = $this->request->data['docid'];
            $category_ID = $this->request->data['dcid'];
            $doc_type = $this->request->data['doc_type'];

            $target_dir = WWW_ROOT . 'documents/';
            if (isset($this->request->data['docFile']['name'])) {
                $target_file = $target_dir . basename($this->request->data['docFile']['name']);
                $imageFileType = pathinfo($target_file, PATHINFO_EXTENSION);
                $current = strtotime("now");

                $image_name = 'DOC_' . $current . '.' . $imageFileType;
                $target_file = $target_dir . $image_name;
                if (move_uploaded_file($this->request->data["docFile"]["tmp_name"], $target_file)) {

                    if ($doc_type == 'custom') {
                        $record = $connection->execute("SELECT * FROM user_required_documents WHERE iPkUserDocId = '" . $document_ID . "'")->fetch('assoc');
                    } else {
                        $record = $connection->execute("SELECT * FROM user_required_documents WHERE iFkUserRelationId = '" . $relation_ID . "' AND iFkUserProductId = '" . $user_product_ID . "' AND iFkDocId = '" . $document_ID . "' AND iFkDocCatId = '" . $category_ID . "'")->fetch('assoc');
                    }

                    if (!empty($record)) {
                        if (file_exists($target_dir . $record['vFileName'])) {
                            unlink($target_dir . $record['vFileName']);
                        }
                        if ($doc_type == 'custom') {
                            $connection->update('user_required_documents', ['vFileName' => $image_name], ['iPkUserDocId' => $document_ID]);
                        } else {
                            $connection->update(
                                'user_required_documents',
                                ['vFileName' => $image_name],
                                ['iFkUserRelationId' => $relation_ID, 'iFkUserProductId' => $user_product_ID, 'iFkDocId' => $document_ID, 'iFkDocCatId' => $category_ID]
                            );
                        }
                    } else {
                        $connection->insert('user_required_documents', [
                            'iFkUserRelationId' => $relation_ID,
                            'iFkUserProductId' => $user_product_ID,
                            'iFkDocId' => $document_ID,
                            'iFkDocCatId' => $category_ID,
                            'eUserDocType' => 'system',
                            'vFileName' => $image_name,
                            'dtUserDocCreatedOn' => $now
                        ]);
                    }

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Your document has been uploaded';
                } else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Unable to upload document. Please try again';
                }
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Please select document';
            }
        }
    }

    public function updateDocStatus()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $this->request->allowMethod('post');
            $connection = ConnectionManager::get('default');
            $now = date('Y-m-d H:i:s');
            $user_product_ID = $this->request->data['pid'];
            $relation_ID = $this->request->data['relationid'];
            $document_ID = $this->request->data['docid'];
            $category_ID = $this->request->data['dcid'];
            $status = $this->request->data['status'];
            $doc_type = $this->request->data['doc_type'];

            if ($doc_type == 'custom') {
                $connection->update('user_required_documents', ['eUserDocStatus' => $status], ['iPkUserDocId' => $document_ID]);
            } else {
                $record = $connection->execute("SELECT * FROM user_required_documents
                                        WHERE iFkUserRelationId = '" . $relation_ID . "' AND iFkUserProductId = '" . $user_product_ID . "' AND iFkDocId = '" . $document_ID . "' AND iFkDocCatId = '" . $category_ID . "'")->fetch('assoc');

                if (!empty($record)) {
                    $connection->update(
                        'user_required_documents',
                        ['eUserDocStatus' => $status],
                        ['iFkUserRelationId' => $relation_ID, 'iFkUserProductId' => $user_product_ID, 'iFkDocId' => $document_ID, 'iFkDocCatId' => $category_ID]
                    );
                } else {
                    $connection->insert('user_required_documents', [
                        'iFkUserRelationId' => $relation_ID,
                        'iFkUserProductId' => $user_product_ID,
                        'iFkDocId' => $document_ID,
                        'iFkDocCatId' => $category_ID,
                        'eUserDocType' => 'system',
                        'eUserDocStatus' => $status,
                        'dtUserDocCreatedOn' => $now
                    ]);
                }
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    public function createNewDocument()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $this->request->allowMethod('post');
            $connection = ConnectionManager::get('default');
            $now = date('Y-m-d H:i:s');
            $UID = $this->request->session()->read('user_id');
            $user_product_ID = $this->request->data['pid'];
            $relation_ID = $this->request->data['relationid'];
            $doc_title = $this->request->data['doc_title'];
            $doc_guide = $this->request->data['doc_guide'];
            // $doc_comment = $this->request->data['doc_comment'];
            $category_ID = $this->request->data['dcid'];

            $connection->insert('user_required_documents', [
                'iFkUserRelationId' => $relation_ID,
                'iFkUserProductId' => $user_product_ID,
                'iFkDocCatId' => $category_ID,
                'vDocName' => $doc_title,
                'vDocGuide' => $doc_guide,
                // 'vDocComment' => $doc_comment,
                'eUserDocType' => 'custom',
                'eUserDocStatus' => 'notcollected',
                'dtUserDocCreatedOn' => $now
            ]);
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    public function deleteDocument()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $iPkUserDocId = $this->request->data['udid'];
            $doc_type = $this->request->data['doc_type'];
            $target_dir = WWW_ROOT . 'documents/';

            if ((!empty($iPkUserDocId) && $iPkUserDocId != 'undefined') && (!empty($UID) && $UID != 'undefined')) {
                $connection = ConnectionManager::get('default');
                $record = $connection->execute("SELECT * FROM user_required_documents WHERE iPkUserDocId = '" . $iPkUserDocId . "'")->fetch('assoc');
                if (file_exists($target_dir . $record['vFileName'])) {
                    unlink($target_dir . $record['vFileName']);
                }

                if (!empty($record)) {
                    if ($doc_type == 'custom') {
                        $connection->delete('user_required_documents', ['iPkUserDocId' => $iPkUserDocId]);
                    } else {
                        $connection->update('user_required_documents', ['vFileName' => ''], ['iPkUserDocId' => $iPkUserDocId]);
                    }
                }
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Something went wrong';
            }
        }
    }

    public function documentPayment()
    {
        //$url = str_replace("webservice/", "", home_base_url());
        $url = str_replace("/api", "", home_base_url());
        $user_product_id = $this->request->data['pid'];
        $relation_id = $this->request->data['relation_id'];
        $encrypted_relation_id = urlencode(urlencode(Security::encrypt($relation_id, ENCRYPTION_KEY)));
        $iPkUserProductId = Security::encrypt($user_product_id, ENCRYPTION_KEY);
        //$location_path = $url . 'product/document_checklist?vpid=' . urlencode(urlencode($iPkUserProductId));
        $location_path = 'http://app.veazy.com.au/dashboard';
        $connection = ConnectionManager::get('default');
        $UID = $this->request->session()->read('user_id');
        $now = date('Y-m-d H:i:s');

        $system_data = TableRegistry::get('md', ['className' => 'mst_documents'])->find()
            ->select(['md.iPkDocId', 'vDocTemplateFile' => 'template.vDocTemplateFile', 'dDocPrice' => 'tag.dDocPrice', 'vTagName' => 'tag.vTagName'])
            ->leftJoin(['template' => 'mst_doc_template'], ['template.iFkDocId =  md.iPkDocId'])
            ->leftJoin(['tag' => 'mst_tags'], ['tag.iDocFolderId =  md.iFkFolderId'])
            ->leftJoin(['ur' => 'user_relationship'], ['ur.iFkTagId =  tag.iPKTagId'])
            ->where(['ur.iPkUserRelationId' => $relation_id])->andWhere(['ur.iFkUserProductId' => $user_product_id])->andWhere(['md.eDocStatus' => 'active'])->andWhere(['template.vDocTemplateFile !=' => ''])->order(['md.iPkDocId' => 'DESC'])->toArray();

        $getUser = $connection->execute("SELECT * FROM mst_user WHERE iPkUserId = '" . $UID . "'")->fetch('assoc');
        //echo "<pre>"; print_r($getUser); exit;

        $email = $getUser['vEmail'];
        //echo $email; exit;

        $target_dir = WWW_ROOT . 'doctemplates/';
        //Archive name
        $archive_file_name = 'Templates_' . $system_data[0]->vTagName . '_' . $now . '.zip';
        $zip = new \ZipArchive();

        //create the file and throw the error if unsuccessful
        if ($zip->open($target_dir . $archive_file_name, \ZipArchive::CREATE) !== TRUE) {
            echo '<script>localStorage.setItem("t_status","fail");localStorage.setItem("rid","' . $encrypted_relation_id . '");localStorage.setItem("msg","Transaction Failed. Unable to download template.");window.location.href ="' . $location_path . '"; </script>';
            exit;
        } else {
            //add each files of $file_name array to archive
            foreach ($system_data as $files) {
                $zip->addFile($target_dir . $files->vDocTemplateFile, $files->vDocTemplateFile);
            }
            $zip->close();

            \Stripe\Stripe::setApiKey(stripe_secret_key);

            try {
                $stripetoken = $this->request->data['stripeToken'];

                $charge = \Stripe\Charge::create(array(
                    "description" => "Template Pack Fees",
                    "source" => $stripetoken,
                    'amount' => $system_data[0]->dDocPrice * 100,
                    'currency' => 'aud',
                    'receipt_email' => $email,
                ));

                $brand = $charge->source;
                $brand = $brand->__toArray();
                $brand = $brand['brand'];

                $transaction_id = $charge->id;
                $connection->insert('user_template_payment', [
                    'iFkUserId' => $UID,
                    'vTransId' => $transaction_id,
                    'brand' => $brand,
                    'iFkUserRelationId' => $relation_id,
                    'iFkUserProductId' => $user_product_id,
                    'vZipFile' => $archive_file_name,
                    'dPaymentAmount' => $system_data[0]->dDocPrice,
                    'vPaymentCurrency' => 'AUD',
                    'ePaymentStatus' => 'success',
                    'dtPaymentOn' => $now
                ]);

                $file = $archive_file_name;

                $fileName = basename($file);
                $filePath = WWW_ROOT . 'doctemplates/' . $file;

                if (!empty($fileName) && file_exists($filePath)) {
                    // Define headers
                    /*header('Cache-Control: no-cache', TRUE);
                    header('Pragma: Public', TRUE);
                    header("Expires: 0");
                    header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
                    //header("Cache-Control: public");
                    header("Content-Description: File Transfer");
                    header("Content-type: application/zip");
                    //header("Content-Type:" . mime_content_type($file));
                    header("filename:" . $fileName);
                    header("Content-Disposition: attachment; filename=$fileName");
                    header("Content-Transfer-Encoding: binary");
                    //ob_end_flush();
                    //@readfile($filePath);

                    // Read the file
                    readfile($filePath);
                    unlink($filePath);
                    exit;*/

                    ob_clean(); //very important
                    // http headers for zip downloads
                    header("Pragma: public");
                    header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
                    header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
                    header("Cache-Control: public");
                    header('Content-Type: application/x-download');
                    header("Content-Disposition: attachment; filename=\"$fileName\"");
                    header("Content-Length: " . filesize($filePath));

                    @readfile($filePath);
                    unlink($filePath);  //very important
                    exit; //very important
                } else {
                    $this->httpStatusCode = 404;
                    $this->apiResponse['valid'] = false;
                }
                echo '<script>localStorage.setItem("t_status","success");localStorage.setItem("rid","' . $encrypted_relation_id . '");localStorage.setItem("zipFile","' . $archive_file_name . '");localStorage.setItem("msg","Your transaction has been done successfully. Thanks for purchasing templates.");window.location.href ="' . $location_path . '"; </script>';
                exit;
            } catch (\Exception $e) {
                $error = $e->getMessage();
                echo '<script>localStorage.setItem("t_status","fail");localStorage.setItem("rid","' . $encrypted_relation_id . '");localStorage.setItem("msg","' . $error . '");window.location.href ="' . $location_path . '"; </script>';
                exit;
            }
        }
    }




    public function downloadPaidDocument()
    {

        if (isset($this->request->query['relation_id'])) {

            $user_product_id = $this->request->query['pid'];
            $relation_id = $this->request->query['relation_id'];
            $now = date('Y-m-d H:i:s');

            $system_data = TableRegistry::get('md', ['className' => 'mst_documents'])->find()
                ->select(['md.iPkDocId', 'vDocTemplateFile' => 'template.vDocTemplateFile', 'dDocPrice' => 'tag.dDocPrice', 'vTagName' => 'tag.vTagName'])
                ->leftJoin(['template' => 'mst_doc_template'], ['template.iFkDocId =  md.iPkDocId'])
                ->leftJoin(['tag' => 'mst_tags'], ['tag.iDocFolderId =  md.iFkFolderId'])
                ->leftJoin(['ur' => 'user_relationship'], ['ur.iFkTagId =  tag.iPKTagId'])
                ->where(['ur.iPkUserRelationId' => $relation_id])->andWhere(['ur.iFkUserProductId' => $user_product_id])->andWhere(['md.eDocStatus' => 'active'])->andWhere(['template.vDocTemplateFile !=' => ''])->order(['md.iPkDocId' => 'DESC'])->toArray();

            //echo "<pre>"; print_r($system_data); exit;

            $target_dir = WWW_ROOT . 'doctemplates/';
            //Archive name
            $archive_file_name = 'Templates_' . $system_data[0]->vTagName . '_' . $now . '.zip';
            //echo $archive_file_name; exit;
            $zip = new \ZipArchive();

            //create the file and throw the error if unsuccessful
            if ($zip->open($target_dir . $archive_file_name, \ZipArchive::CREATE) !== TRUE) {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
            } else {
                //add each files of $file_name array to archive
                foreach ($system_data as $files) {
                    $zip->addFile($target_dir . $files->vDocTemplateFile, $files->vDocTemplateFile);
                }
                //echo "<pre>"; print_r($zip); exit;
                $zip->close();
                $file = $archive_file_name;

                $fileName = basename($file);
                $filePath = WWW_ROOT . 'doctemplates/' . $file;
                //echo $fileName; exit;
                if (!empty($fileName) && file_exists($filePath)) {

                    // Define headers
                    /*header("Cache-Control: public");
                    header("Content-Type:" . mime_content_type($file));
                    header("filename:" . $fileName);
                    header("Content-Description: File Transfer");
                    header("Content-Disposition: attachment; filename=$fileName");
                    header("Content-Transfer-Encoding: binary");

                    // Read the file
                    readfile($filePath);
                    unlink($filePath);
                    exit;*/
                    ob_clean(); //very important
                    // http headers for zip downloads
                    header("Pragma: public");
                    header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
                    header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
                    header("Cache-Control: public");
                    header("filename:" . $fileName);
                    header('Content-Type: application/zip');
                    header("Content-Disposition: attachment; filename=$fileName");
                    header("Content-Length: " . filesize($filePath));

                    @readfile($filePath);
                    unlink($filePath);  //very important
                    exit; //very important
                } else {
                    $this->httpStatusCode = 404;
                    $this->apiResponse['valid'] = false;
                }
            }
        } else {
            //die('hiii');
            $file = $this->request->query['filename'];

            $fileName = basename($file);
            $filePath = WWW_ROOT . 'doctemplates/' . $file;

            if (!empty($fileName) && file_exists($filePath)) {
                // Define headers
                /*header("Cache-Control: public");
                header("Content-Type:" . mime_content_type($file));
                header("filename:" . $fileName);
                header("Content-Description: File Transfer");
                header("Content-Disposition: attachment; filename=$fileName");
                header("Content-Transfer-Encoding: binary");

                // Read the file
                readfile($filePath);
                unlink($filePath);
                exit;*/

                ob_clean(); //very important
                // http headers for zip downloads
                header("Pragma: public");
                header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
                header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
                header("Cache-Control: public");
                header('Content-Type: application/x-download');
                header("Content-Disposition: attachment; filename=\"$fileName\"");
                header("Content-Length: " . filesize($filePath));

                @readfile($filePath);
                unlink($filePath);  //very important
                exit; //very important
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
            }
        }
    }

    /*********************************************
     *************** TO DO LIST ******************
     *********************************************/

    public function getUserToDo()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $todo_folder_ids = explode(',', $this->request->data['fieldvalue']);
            $system_todo_data = TableRegistry::get('mtd', ['className' => 'mst_todo'])->find()
                ->select([
                    'todoId' => 'mtd.iPkToDoId', 'mtd.iFkFolderId', 'mtd.vToDo', 'cat_title' => 'cat.vDocCat',
                    'todo_type' => 'IF(mtd.iPkToDoId IS NOT NULL, "system", "system")',
                    'is_watched' => 'CASE WHEN utd.iPkUserToDoId != "" THEN 1 ELSE 0 END'
                ])
                ->leftJoin(['cat' => 'mst_doc_category'], ['cat.iPkDocCatId =  mtd.iFkDocCatId'])
                ->leftJoin(['utd' => 'user_todo'], ['utd.iFkToDoId = mtd.iPkToDoId', 'utd.iFkUserProductId' => $this->request->data['pid'], 'utd.eUserToDoType' => 'system', 'utd.eIsCompleted' => '1'])
                ->where(['mtd.iFkFolderId IN' => $todo_folder_ids])->andWhere(['mtd.eToDoStatus' => 'active'])->order(['cat.iPriority' => 'ASC', 'cat.dtPriority' => 'DESC', 'mtd.iPriority' => 'ASC', 'mtd.dtPriority' => 'DESC'])->toArray();

            $result = array();
            foreach ($system_todo_data as $element) {
                $result[$element['cat_title']]['elements'][] = $element;
            }

            foreach ($result as $key => $soc) {
                $satisfied = 1;
                foreach ($soc['elements'] as $s) {
                    if ($s['is_watched'] == 0) {
                        $satisfied = 0;
                    }
                    $result[$key]['satisfied'] = $satisfied;
                }
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $result;
        }
    }

    public function updateToDoWatchedStatus()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $user_product_id = $this->request->data['pid'];
            $UID = $this->request->session()->read('user_id');
            $to_do_id = $this->request->data['fieldvalue'];
            $now = date('Y-m-d H:i:s');

            $check_user_todo = TableRegistry::get('utd', ['className' => 'user_todo'])->find()
                ->select(['utd.iPkUserToDoId', 'utd.dtUserToDoCompletedOn', 'utd.eIsCompleted'])
                ->where(['utd.iFkToDoId' => $to_do_id])->andWhere(['utd.iFkUserProductId' => $user_product_id])->toArray();

            if (!empty($check_user_todo)) {
                $status = '0';
                $date = null;
                if ($check_user_todo[0]['eIsCompleted'] == '0') {
                    $status = '1';
                    $date = $now;
                }
                $connection->update('user_todo', [
                    'iFkUserId' => $UID,
                    'eIsCompleted' => $status,
                    'dtUserToDoCompletedOn' => $date
                ], ['iFkUserProductId' => $user_product_id, 'iFkToDoId' => $to_do_id]);
            } else {
                $connection->insert('user_todo', [
                    'iFkUserId' => $UID,
                    'iFkUserProductId' => $user_product_id,
                    'iFkToDoId' => $to_do_id,
                    'eUserToDoType' => 'system',
                    'eIsCompleted' => '1',
                    'dtUserToDoCompletedOn' => $now
                ]);
            }

            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    /*********************************************
     ****************** FAQ **********************
     *********************************************/
    public function getUserFAQ()
    {
        $faq_folder_ids = explode(',', $this->request->data['fieldvalue']);
        $faq_data = TableRegistry::get('faq', ['className' => 'mst_faq'])->find()
            ->select(['faq.iPkFAQId', 'faq.vFAQ', 'faq.vFAQAnswer'])
            ->where(['faq.iFkFolderId IN' => $faq_folder_ids])->andWhere(['faq.eFAQStatus' => 'active'])
            ->order(['faq.iPriority' => 'ASC', 'faq.dtPriority' => 'DESC'])
            ->toArray();

        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
        $this->apiResponse['data'] = $faq_data;
    }

    /*********************************************
     *************** COVER LETTER ****************
     *********************************************/

    public function getUserCoverLetter()
    {
        if (isset($this->request->data['cid'])) {
            $coverID = $this->request->data['cid'];
            $where = ['cl.iPkCoverLetterId' => $coverID];
        } else {
            $cl_folder_ids = explode(',', $this->request->data['fieldvalue']);
            $where = ['cl.iFkFolderId IN' => $cl_folder_ids];
        }
        $THUMBNAIL_PATH = image_url() . 'coverletters/thumbnail/';

        $cl_data = TableRegistry::get('cl', ['className' => 'mst_cover_letter'])->find()
            ->select(['cl.iPkCoverLetterId', 'cl.vCoverLetterTitle', 'cl.vCoverLetterDesc', 'vCoverLetterThumbFile' => "CONCAT('$THUMBNAIL_PATH', cl.vCoverLetterThumbFile)", 'cl.vCoverLetterFile', 'cl.eCoverFee', 'cl.dCoverLetterPrice'])
            ->where($where)->andWhere(['cl.eCoverLetterStatus' => 'active'])->order(['iPriority' => 'ASC', 'dtPriority' => 'DESC'])->toArray();

        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
        $this->apiResponse['data'] = $cl_data;
    }

    public function downloadCoverLetter()
    {
        $file_id = $this->request->query['filename'];
        $is_payment_done = true;
        $cl_data = TableRegistry::get('cl', ['className' => 'mst_cover_letter'])->find()
            ->select(['cl.iPkCoverLetterId', 'cl.vCoverLetterTitle', 'cl.vCoverLetterDesc', 'cl.vCoverLetterFile', 'cl.eCoverFee', 'cl.dCoverLetterPrice'])
            ->where(['cl.iPkCoverLetterId' => $file_id])->first();
        $file = $cl_data->vCoverLetterFile;
        if ($cl_data->eCoverFee == 'paid') {
            $is_payment_done = false;
        }
        if ($is_payment_done) {
            $fileName = basename($file);
            $filePath = WWW_ROOT . 'coverletters/file/' . $file;

            if (!empty($fileName) && file_exists($filePath)) {
                // Define headers
                header("Cache-Control: public");
                header("Content-Type:" . mime_content_type($file));
                header("Content-Description: File Transfer");
                header("Content-Disposition: attachment; filename=$fileName");
                header("Content-Transfer-Encoding: binary");

                // Read the file
                readfile($filePath);
                exit;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'The file does not exist on server.';
            }
        } else {
            $this->httpStatusCode = 400;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['is_payment_done'] = $is_payment_done;
        }
    }

    public function downloadPaidCoverLetter()
    {
        $file_id = $this->request->query['filename'];
        $file_id = Security::decrypt(urldecode(urldecode($file_id)), ENCRYPTION_KEY);
        $cl_data = TableRegistry::get('cl', ['className' => 'mst_cover_letter'])->find()
            ->select(['cl.iPkCoverLetterId', 'cl.vCoverLetterTitle', 'cl.vCoverLetterDesc', 'cl.vCoverLetterFile', 'cl.eCoverFee', 'cl.dCoverLetterPrice'])
            ->where(['cl.iPkCoverLetterId' => $file_id])->first();
        $file = $cl_data->vCoverLetterFile;

        $fileName = basename($file);
        $filePath = WWW_ROOT . 'coverletters/file/' . $file;

        if (!empty($fileName) && file_exists($filePath)) {
            // Define headers
            header("Cache-Control: public");
            header("Content-Type:" . mime_content_type($file));
            header("filename:" . $fileName);
            header("Content-Description: File Transfer");
            header("Content-Disposition: attachment; filename=$fileName");
            header("Content-Transfer-Encoding: binary");

            // Read the file
            readfile($filePath);
            exit;
        } else {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'The file does not exist on server.';
        }
    }

    public function coverletterPayment()
    {
        //$url = str_replace("webservice/", "", home_base_url());
        $url = str_replace("/api", "", home_base_url());
        $user_product_id = $this->request->data['pid'];
        $cid = $this->request->data['cid'];
        $cover_letter_id = urlencode(urlencode(Security::encrypt($cid, ENCRYPTION_KEY)));
        $iPkUserProductId = Security::encrypt($user_product_id, ENCRYPTION_KEY);
        $location_path = $url . 'product/coverletter?vpid=' . urlencode(urlencode($iPkUserProductId));
        $connection = ConnectionManager::get('default');
        $UID = $this->request->session()->read('user_id');
        $now = date('Y-m-d H:i:s');

        \Stripe\Stripe::setApiKey(stripe_secret_key);

        try {
            $stripetoken = $this->request->data['stripeToken'];

            $charge = \Stripe\Charge::create(array(
                "description" => "Cover Letter Fee",
                "source" => $stripetoken,
                'amount' => $this->request->data['amount'],
                'currency' => 'aud'
            ));

            $brand = $charge->source;
            $brand = $brand->__toArray();
            $brand = $brand['brand'];

            $transaction_id = $charge->id;
            $connection->insert('user_coverletter_payment', [
                'iFkUserId' => $UID,
                'vTransId' => $transaction_id,
                'brand' => $brand,
                'iFkCoverLetterId' => $cid,
                'iFkUserProductId' => $user_product_id,
                'dPaymentAmount' => ($this->request->data['amount'] / 100),
                'vPaymentCurrency' => 'AUD',
                'ePaymentStatus' => 'success',
                'dtPaymentOn' => $now
            ]);

            echo '<script>localStorage.setItem("cp_status","success");localStorage.setItem("cid","' . $cover_letter_id . '");localStorage.setItem("msg","Your transaction has been done successfully. Thanks for purchasing cover letter.");window.location.href ="' . $location_path . '"; </script>';
            exit;
        } catch (\Exception $e) {
            $error = $e->getMessage();
            echo '<script>localStorage.setItem("cp_status","fail");localStorage.setItem("cid","' . $cover_letter_id . '");localStorage.setItem("msg","' . $error . '");window.location.href ="' . $location_path . '"; </script>';
            exit;
        }
    }


    /*********************************************
     ****************** NOTES ********************
     *********************************************/

    public function saveNotes()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $vTitle = $this->request->data['vTitle'];
            $tDescription = $this->request->data['tDescription'];
            $iPkUserNotesId = $this->request->data['iPkUserNotesId'];
            $user_product_id = $this->request->data['pid'];
            $now = date('Y-m-d H:i:s');

            if (!empty($vTitle) && !empty($tDescription)) {
                $connection = ConnectionManager::get('default');
                if (!empty($iPkUserNotesId)) {
                    $connection->update('user_notes', [
                        'vTitle' => $vTitle,
                        'tDescription' => $tDescription,
                        'dtUserNotesCreatedOn' => $now
                    ], ['iPkUserNotesId' => $iPkUserNotesId]);
                } else {
                    $connection->insert('user_notes', [
                        'iFkUserId' => $UID,
                        'iFkUserProductId' => $user_product_id,
                        'vTitle' => $vTitle,
                        'tDescription' => $tDescription,
                        'dtUserNotesCreatedOn' => $now
                    ]);
                }
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Note Title & Description is required';
            }
        }
    }

    public function getNotes()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $user_product_id = $this->request->query['pid'];

            $notes = TableRegistry::get('user_notes', ['className' => 'user_notes'])->find('all')
                ->where(['iFkUserId' => $UID])->andWhere(['iFkUserProductId' => $user_product_id])->order(['iPkUserNotesId' => 'DESC'])->toArray();

            foreach ($notes as $k => $v) {
                $timestamp = strtotime($v['dtUserNotesCreatedOn']);
                $newDate = date('d F Y', $timestamp);
                $new_time = date('G.ia', $timestamp);
                $notes[$k]['created_date'] = $newDate . ' at ' . $new_time;
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $notes;
        }
    }

    public function getplan()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $mst_plans = $connection->execute("SELECT * FROM mst_plans WHERE is_Visible = 'active' ORDER BY dPlanMonthlyPrice ASC")->fetchAll('assoc');

            $UID = $this->request->session()->read('user_id');

            $currentplan = $connection->execute("SELECT * FROM user_plan_payment WHERE vStatus='active' AND iFkUserId = '" . $UID . "'")->fetch('assoc');

            foreach ($mst_plans as $key => $value) {

                $mst_plans[$key]['current_plan'] = $currentplan['iFkUserPlanId'];
                $mst_plans[$key]['plan_type'] = $currentplan['vPlanType'];
            }

            //echo "<pre>"; print_r($mst_plans); exit;
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $mst_plans;
        }
    }

    public function editdconblur()
    {

        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $this->request->allowMethod('post');
            $connection = ConnectionManager::get('default');
            $now = date('Y-m-d H:i:s');
            $user_product_ID = $this->request->data['pid'];
            $relation_ID = $this->request->data['relationid'];
            $document_ID = $this->request->data['docid'];
            $category_ID = $this->request->data['dcid'];
            $status = $this->request->data['status'];
            $doc_type = $this->request->data['doc_type'];
            $message = $this->request->data['message'];
            $coloumnname = $this->request->data['coloumnname'];
            $userdoc = $this->request->data['userdoc'];

            if ($doc_type == 'custom') {
                $connection->update('user_required_documents', [$coloumnname => $message], ['iPkUserDocId' => $userdoc]);
            } else {
                if ($coloumnname == 'vDocGuide') {

                    $connection->update(
                        'mst_documents',
                        [$coloumnname => $message,],
                        ['iPkDocId' => $document_ID]
                    );
                } elseif ($coloumnname == 'vDocName') {

                    $connection->update(
                        'mst_documents',
                        [$coloumnname => $message,],
                        ['iPkDocId' => $document_ID]
                    );
                } else {
                    $record = $connection->execute("SELECT * FROM user_required_documents
                                        WHERE iFkUserRelationId = '" . $relation_ID . "' AND iFkUserProductId = '" . $user_product_ID . "' AND iFkDocId = '" . $document_ID . "' AND iFkDocCatId = '" . $category_ID . "'")->fetch('assoc');
                    if (!empty($record)) {

                        $connection->update(
                            'user_required_documents',
                            [$coloumnname => $message,],
                            ['iPkUserDocId' => $userdoc]
                        );
                    } else {
                        $connection->insert('user_required_documents', [
                            'iFkUserRelationId' => $relation_ID,
                            'iFkUserProductId' => $user_product_ID,
                            'iFkDocId' => $document_ID,
                            'iFkDocCatId' => $category_ID,
                            'eUserDocType' => 'system',
                            'eUserDocStatus' => $status,
                            $coloumnname => $message,
                            'dtUserDocCreatedOn' => $now
                        ]);
                    }
                }
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
        }
    }

    public function deleteNotes()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $iPkUserNotesId = $this->request->query['id'];

            if ((!empty($iPkUserNotesId) && $iPkUserNotesId != 'undefined') && (!empty($UID) && $UID != 'undefined')) {
                $connection = ConnectionManager::get('default');
                $connection->execute("DELETE FROM user_notes WHERE iPkUserNotesId =$iPkUserNotesId AND iFkUserId=$UID");
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Something went wrong';
            }
        }
    }
    
    public function getCountries()
    {
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        $connection = ConnectionManager::get('default');
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $record = $connection->execute("SELECT * FROM mst_country WHERE eCountryStatus = 'active'")->fetchAll('assoc');
            
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $record;
        }
    }
    
    public function applicationSubclassforCase(){
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        $connection = ConnectionManager::get('default');
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $UID = $this->request->session()->read('user_id');
            $record = $connection->execute("SELECT iPkVisaProductId,vVisaProductTitle FROM mst_visa_product WHERE (vVisaProductTitle LIKE '%Onshore - Subclass 820%' OR vVisaProductTitle LIKE '%Offshore - Subclass 300 (PMV)%' OR vVisaProductTitle LIKE '%Offshore - Subclass 309%') AND  eVisaProductStatus = 'active'")->fetchAll('assoc');
            
            if(count($record)>0){
                foreach($record as $key=>$subclass){
                    $record[$key]['vVisaProductTitle'] = preg_replace('/\D/', '', $subclass['vVisaProductTitle']);
                }
            }
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $record;
        }
    }
    
    public function saveTimelineCase()
    {
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $now = date('Y-m-d H:i:s');
            $UID = $this->request->session()->read('user_id');
            $case_data = $this->request->data['case_data'];
            if (!empty($case_data)) {
                $connection = ConnectionManager::get('default');
                
                if(isset($case_data['iPkTimelineId']) && !empty($case_data['iPkTimelineId'])){
                    $connection->update('mst_case_timeline', [
                        'iFkUserId' => $UID,
                        'ApplicationSubclass' => $case_data['ApplicationSubclass'],
                        'OnOffShore' => $case_data['OnOffShore'],
                        'Nationality' => $case_data['Nationality'],
                        'VisaOffice' => $case_data['VisaOffice'],
                        'DateOfLodgement' => date('Y-m-d H:i:s', strtotime($case_data['DateOfLodgement'] . ' +1 day')),
                        'CurrentStatus' => $case_data['CurrentStatus'],
                        'DocumentReqDate' => $case_data['DocumentReqDate'] != null ? date('Y-m-d H:i:s', strtotime($case_data['DocumentReqDate'] . ' +1 day')) : '',
                        'MedicalCompDate' => $case_data['MedicalCompDate'] != null ? date('Y-m-d H:i:s', strtotime($case_data['MedicalCompDate'] . ' +1 day')) : '',
                        'dtGrantedOn' => $case_data['dtGrantedOn'] != '' ? date('Y-m-d H:i:s', strtotime($case_data['dtGrantedOn'] . ' +1 day')) : '',
                        'IsAnonymous' => $case_data['IsAnonymous'] != '' ? $case_data['IsAnonymous'] : 0,
                        'dtUpdatedOn' => $now,
                    ], ['iPkTimelineId' => $case_data['iPkTimelineId']]);
                    
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['message'] = 'Case saved successfully..';
                }else{
                    
                    //check already has timeline case
                    $record = $connection->execute("SELECT * FROM mst_case_timeline WHERE iFkUserId=".$UID)->fetch('assoc');
                    
                    if(empty($record)){
                        $connection->insert('mst_case_timeline', [
                            'iFkUserId' => $UID,
                            'ApplicationSubclass' => $case_data['ApplicationSubclass'],
                            'OnOffShore' => $case_data['OnOffShore'],
                            'Nationality' => $case_data['Nationality'],
                            'VisaOffice' => $case_data['VisaOffice'],
                            'DateOfLodgement' => date('Y-m-d H:i:s', strtotime($case_data['DateOfLodgement'] . ' +1 day')),
                            'CurrentStatus' => $case_data['CurrentStatus'],
                            'DocumentReqDate' => $case_data['DocumentReqDate'] != null ? date('Y-m-d H:i:s', strtotime($case_data['DocumentReqDate'] . ' +1 day')) : '',
                            'MedicalCompDate' => $case_data['MedicalCompDate'] != null ? date('Y-m-d H:i:s', strtotime($case_data['MedicalCompDate'] . ' +1 day')) : '',
                            'dtGrantedOn' => $case_data['dtGrantedOn'] != '' ? date('Y-m-d H:i:s', strtotime($case_data['dtGrantedOn'] . ' +1 day')) : '',
                            'IsAnonymous' => $case_data['IsAnonymous'] != '' ? $case_data['IsAnonymous'] : 0,
                            'dtCreatedOn' => $now,
                            'dtUpdatedOn' => $now,
                        ]);
                        
                        $this->httpStatusCode = 200;
                        $this->apiResponse['valid'] = true;
                        $this->apiResponse['message'] = 'Case saved successfully..';
                    }else{
                        $this->httpStatusCode = 402;
                        $this->apiResponse['valid'] = false;
                        $this->apiResponse['message'] = 'You cannot create second case';
                    }
                }
                
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Something is missing..';
            }
        }
    }
    
    public function getAllTimelineCase(){
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $UID = $this->request->session()->read('user_id');
            $record = [];
            $is_exists = "no";
            $search_fields = $this->request->query();
            
            $where = ' ';
            if((isset($search_fields['Nationality']) && !empty($search_fields['Nationality'])) && ($search_fields['Nationality'] != undefined) && ($search_fields['Nationality'] != 'null')){
                $where .= ' AND Nationality='.$search_fields['Nationality'];
            }
            if(isset($search_fields['ApplicationSubclass']) && !empty($search_fields['ApplicationSubclass']) && ($search_fields['ApplicationSubclass'] != undefined) && ($search_fields['ApplicationSubclass'] != 'null')){
                $where .= ' AND ApplicationSubclass='.$search_fields['ApplicationSubclass'];
            }
            if(isset($search_fields['OnOffShore']) && !empty($search_fields['OnOffShore']) && ($search_fields['OnOffShore'] != undefined) && ($search_fields['OnOffShore'] != 'null')){
                $where .= ' AND OnOffShore LIKE "%'.$search_fields['OnOffShore'].'%"';
            }
            if(isset($search_fields['CurrentStatus']) && !empty($search_fields['CurrentStatus']) && ($search_fields['CurrentStatus'] != undefined) && ($search_fields['CurrentStatus'] != 'null')){
                $where .= ' AND CurrentStatus LIKE "%'.$search_fields['CurrentStatus'].'%"';
            }
            if((isset($search_fields['VisaOffice']) && !empty($search_fields['VisaOffice'])) && ($search_fields['VisaOffice'] != undefined) && ($search_fields['VisaOffice'] != 'null')){
                $where .= ' AND VisaOffice='.$search_fields['VisaOffice'];
            }
            
            if(isset($UID) && !empty($UID)){
                $record = $connection->execute("SELECT mct.*, mvp.vVisaProductTitle, mc.vCountryName, mcv.vCountryName AS visa_office, mu.vFirstName, mu.vLastName, mu.vProfileImage FROM mst_case_timeline mct JOIN mst_country as mc ON mc.iPkCountryId = mct.Nationality JOIN mst_country as mcv ON mcv.iPkCountryId = mct.VisaOffice JOIN mst_visa_product as mvp ON mvp.iPkVisaProductId = mct.ApplicationSubclass JOIN mst_user as mu ON mu.iPkUserId = mct.iFkUserId WHERE CurrentStatus != ''".$where)->fetchAll('assoc');
                
                if(count($record)>0){
                    $is_exists = "yes";
                    foreach($record as $key=> $case){
                        //echo '<pre>'; print_r($case);
                        if($case['IsAnonymous'] == 1){
                            $record[$key]['vFirstName'] = 'Anonymous';
                            $record[$key]['vLastName'] = '';
                        }
                        
                        $iPkTimelineId = Security::encrypt($case['iPkTimelineId'], ENCRYPTION_KEY);
                        $record[$key]['enc_iPkTimelineId'] = urlencode(urlencode($iPkTimelineId));
                        
                        if (strtotime($case['DateOfLodgement']) != '0000-00-00 00:00:00') {
                            $DateOfLodgement = date_create($case['DateOfLodgement']);
                            $DateOfLodgement = date_format($DateOfLodgement, "dS M, Y");
                            $record[$key]['DateOfLodgement'] = $DateOfLodgement;
                    
                        } else {
                            $record[$key]['DateOfLodgement'] = '-';
                        }
                        
                        if ($case['MedicalCompDate'] != '0000-00-00 00:00:00') {
                            $MedicalCompDate = date_create($case['MedicalCompDate']);
                            $MedicalCompDate = date_format($MedicalCompDate, "dS M, Y");
                            $record[$key]['MedicalCompDate'] = $MedicalCompDate;
                    
                        } else {
                            $record[$key]['MedicalCompDate'] = 'N/A';
                        }
                        
                        if ($case['dtGrantedOn'] != '0000-00-00 00:00:00') {
                            $dtGrantedOn = date_create($case['dtGrantedOn']);
                            $dtGrantedOn = date_format($dtGrantedOn, "dS M, Y");
                            $record[$key]['dtGrantedOn'] = $dtGrantedOn;
                    
                        } else {
                            $record[$key]['dtGrantedOn'] = 'N/A';
                        }
                        
                        $dtCreatedOn = date_create($case['dtCreatedOn']);
                        $dtCreatedOn = date_format($dtCreatedOn, "dS M, Y");
                        $record[$key]['dtCreatedOn'] = $dtCreatedOn;
                        
                        $dtUpdatedOn = date_create($case['dtUpdatedOn']);
                        $dtUpdatedOn = date_format($dtUpdatedOn, "dS M, Y");
                        $record[$key]['dtUpdatedOn'] = $dtUpdatedOn;
                        
                        $record[$key]['vVisaProductTitle'] = preg_replace('/\D/', '', $case['vVisaProductTitle']);
                        
                        $record[$key]['DayBLodgeGrant'] = '-';
                        if(!empty($case['DateOfLodgement']) && $case['dtGrantedOn'] != '0000-00-00 00:00:00'){
                            $date1 = strtotime($case['DateOfLodgement']);
                            $date2 = strtotime($case['dtGrantedOn']);
                            $datediff = $date2 - $date1;
                            
                            $record[$key]['DayBLodgeGrant'] = round($datediff / (60 * 60 * 24));
                            if($record[$key]['DayBLodgeGrant'] == 1){
                                $record[$key]['DayBLodgeGrant'] = $record[$key]['DayBLodgeGrant'].' Day';
                            }else{
                                $record[$key]['DayBLodgeGrant'] = $record[$key]['DayBLodgeGrant'].' Days';
                            }
                        }else{
                            $record[$key]['DayBLodgeGrant'] = 'N/A';
                        }
                    }
                }
            } else{
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['data'] = $record;
                $this->apiResponse['allData'] = $allData;
                $this->apiResponse['is_exists'] = $is_exists;
                $this->apiResponse['login_user_id'] = $UID;
            }
            
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $record;
            $this->apiResponse['is_exists'] = $is_exists;
            $this->apiResponse['login_user_id'] = $UID;
        }
    }
    
    public function getUserCase(){
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $UID = $this->request->session()->read('user_id');
            $record = [];
            $is_exists = "no";
            $fetchid = $this->request->query['iPkTimelineId'];
            $user_case_ID = Security::decrypt(urldecode($fetchid), ENCRYPTION_KEY);
            if(isset($UID) && !empty($UID)){
                $record = $connection->execute("SELECT * FROM mst_case_timeline WHERE iPkTimelineId=".$user_case_ID)->fetch('assoc');
                
                if(!empty($record)){
                    $is_exists = 'yes';
                    $DateOfLodgement = date_create($record['DateOfLodgement']);
                        $DateOfLodgement = date_format($DateOfLodgement, "d-F-Y");
                        $record['DateOfLodgement'] = $DateOfLodgement;
                    
                    if($record['DocumentReqDate'] != "0000-00-00 00:00:00"){
                            $DocumentReqDate = date_create($record['DocumentReqDate']);
                            $DocumentReqDate = date_format($DocumentReqDate, "d-F-Y");
                            $record['DocumentReqDate'] = $DocumentReqDate;
                    }else{
                        $record['DocumentReqDate'] = '';
                    }
                    
                    if($record['MedicalCompDate'] != "0000-00-00 00:00:00"){
                            $MedicalCompDate = date_create($record['MedicalCompDate']);
                            $MedicalCompDate = date_format($MedicalCompDate, "d-F-Y");
                            $record['MedicalCompDate'] = $MedicalCompDate;
                    }else{
                        $record['MedicalCompDate'] = '';
                    }
                    
                    if($record['dtGrantedOn'] != "0000-00-00 00:00:00"){
                        $dtGrantedOn = date_create($record['dtGrantedOn']);
                        $dtGrantedOn = date_format($dtGrantedOn, "d-F-Y");
                        $record['dtGrantedOn'] = $dtGrantedOn;
                    }else{
                        $record['dtGrantedOn'] = '';
                    }
                }
            } else{
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['data'] = $record;
                $this->apiResponse['is_exists'] = $is_exists;
            }
            
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $record;
            $this->apiResponse['is_exists'] = $is_exists;
        }
    }
    
    public function getGraphData(){
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $UID = $this->request->session()->read('user_id');
            $record = [];
            $subclass800count = 0;
            $subclass300count = 0;
            $subclass309count = 0;
            $graphData = [];
            
            $subclass820count = 0;
            $subclass300count = 0;
            $subclass309count = 0;
            
            $subclass820countForGranted = 0;
            $subclass300countForGranted = 0;
            $subclass309countForGranted = 0;
            
            $subclass820days = 0;
            $subclass300days = 0;
            $subclass309days = 0;
            
            if(isset($UID) && !empty($UID)){
                $record = $connection->execute("SELECT * FROM mst_case_timeline")->fetchAll('assoc');
                
                if(count($record)>0){
                    foreach($record as $key=>$case){
                        if($case['ApplicationSubclass'] == 1){
                            $subclass800count++;
                        }
                        
                        if($case['ApplicationSubclass'] == 23){
                            $subclass300count++;
                        }
                        
                        if($case['ApplicationSubclass'] == 24){
                            $subclass309count++;
                        }
                        
                        //avg processing time for subclass lodge to grant
                        if($case['DateOfLodgement'] != '0000-00-00 00:00:00' && $case['dtGrantedOn'] != '0000-00-00 00:00:00' && $case['CurrentStatus'] == 'Granted'){
                            if($case['ApplicationSubclass'] == 1){
                                $subclass820countForGranted++;
                                $date1 = strtotime($case['DateOfLodgement']);
                                $date2 = strtotime($case['dtGrantedOn']);
                                $datediff = $date2 - $date1;
                                
                                $subclass820days += round($datediff / (60 * 60 * 24));
                            }
                            
                            if($case['ApplicationSubclass'] == 23){
                                $subclass300countForGranted++;
                                $date1 = strtotime($case['DateOfLodgement']);
                                $date2 = strtotime($case['dtGrantedOn']);
                                $datediff = $date2 - $date1;
                                
                                $subclass300days += round($datediff / (60 * 60 * 24));
                            }
                            
                            if($case['ApplicationSubclass'] == 24){
                                $subclass309countForGranted++;
                                $date1 = strtotime($case['DateOfLodgement']);
                                $date2 = strtotime($case['dtGrantedOn']);
                                $datediff = $date2 - $date1;
                                
                                $subclass309days += round($datediff / (60 * 60 * 24));
                            }
                        }
                    }
                }
                $graphData = [
                    'subclass800' => $subclass800count,
                    'subclass300' => $subclass300count,
                    'subclass309' => $subclass309count,
                    'avgtimefor800' => $subclass820countForGranted > 0 ? round($subclass820days / $subclass820countForGranted) : '-',
                    'avgtimefor300' => $subclass300countForGranted > 0 ? round($subclass300days / $subclass300countForGranted) : '-',
                    'avgtimefor309' => $subclass309countForGranted > 0 ? round($subclass309days / $subclass309countForGranted) : '-',
                ];
                
            } else{
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['data'] = $graphData;
            }
            
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $graphData;
        }
    }
    
    public function searchGraphData(){
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $search_data = $this->request->data();
            $subclass = '-';
            $nationality = '-';
            $subclass820countForGranted = 0;
            $subclass300countForGranted = 0;
            $subclass309countForGranted = 0;
            
            $subclass820days = 0;
            $subclass300days = 0;
            $subclass309days = 0;
            
            $avgDays = [
                'avgtimefor820' => 0,
                'avgtimefor300' => 0,
                'avgtimefor309' => 0,
            ];
            if(!empty($search_data['graph_data'])){
                $where = ' ';
                if((isset($search_data['graph_data']['Nationality']) && !empty($search_data['graph_data']['Nationality'])) && ($search_data['graph_data']['Nationality'] != undefined) && ($search_data['graph_data']['Nationality'] != 'null')){
                    $where .= ' AND Nationality='.$search_data['graph_data']['Nationality'];
                }
                if(isset($search_data['graph_data']['ApplicationSubclass']) && !empty($search_data['graph_data']['ApplicationSubclass']) && ($search_data['graph_data']['ApplicationSubclass'] != undefined) && ($search_data['graph_data']['ApplicationSubclass'] != 'null')){
                    $where .= ' AND ApplicationSubclass='.$search_data['graph_data']['ApplicationSubclass'];
                }
                
                $record = $connection->execute("SELECT mst_case_timeline.*, mc.vCountryName, mvp.vVisaProductTitle FROM mst_case_timeline JOIN mst_country mc ON mc.iPkCountryId = mst_case_timeline.Nationality JOIN mst_visa_product AS mvp ON mvp.iPkVisaProductId = mst_case_timeline.ApplicationSubclass WHERE CurrentStatus != '' ".$where)->fetchAll('assoc');
                
                if(!empty($record)){
                    
                    foreach($record as $key => $case){
                        //avg processing time for subclass lodge to grant
                        if($case['DateOfLodgement'] != '0000-00-00 00:00:00' && $case['dtGrantedOn'] != '0000-00-00 00:00:00' && $case['CurrentStatus'] == 'Granted'){
                            if($case['ApplicationSubclass'] == 1){
                                $subclass820countForGranted++;
                                $date1 = strtotime($case['DateOfLodgement']);
                                $date2 = strtotime($case['dtGrantedOn']);
                                $datediff = $date2 - $date1;
                                
                                $subclass820days += round($datediff / (60 * 60 * 24));
                            }
                            
                            if($case['ApplicationSubclass'] == 23){
                                $subclass300countForGranted++;
                                $date1 = strtotime($case['DateOfLodgement']);
                                $date2 = strtotime($case['dtGrantedOn']);
                                $datediff = $date2 - $date1;
                                
                                $subclass300days += round($datediff / (60 * 60 * 24));
                            }
                            
                            if($case['ApplicationSubclass'] == 24){
                                $subclass309countForGranted++;
                                $date1 = strtotime($case['DateOfLodgement']);
                                $date2 = strtotime($case['dtGrantedOn']);
                                $datediff = $date2 - $date1;
                                
                                $subclass309days += round($datediff / (60 * 60 * 24));
                            }
                        }
                    }
                    $avgDays = [
                        'avgtimefor820' => $subclass820countForGranted > 0 ? round($subclass820days / $subclass820countForGranted) : 0,
                        'avgtimefor300' => $subclass300countForGranted > 0 ? round($subclass300days / $subclass300countForGranted) : 0,
                        'avgtimefor309' => $subclass309countForGranted > 0 ? round($subclass309days / $subclass309countForGranted) : 0,
                    ];
                    $subclass = preg_replace('/\D/', '', $record[0]['vVisaProductTitle']);
                    
                    $nationality = $record[0]['vCountryName'];
                    
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['msg'] = "Count available";
                    $this->apiResponse['case_count'] = count($record);
                    $this->apiResponse['Nationality'] = $nationality;
                    $this->apiResponse['Subclass'] = $subclass;
                    $this->apiResponse['avg_days'] = $avgDays; 
                }else {
                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['msg'] = "Count not available";
                    $this->apiResponse['case_count'] = 0;
                    $this->apiResponse['Nationality'] = $nationality;
                    $this->apiResponse['Subclass'] = $subclass;
                    $this->apiResponse['avg_days'] = $avgDays;
                }
                
            }else{
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['msg'] = "Please search something..";
                $this->apiResponse['case_count'] = 0;
                $this->apiResponse['Nationality'] = $nationality;
                $this->apiResponse['Subclass'] = $subclass;
                $this->apiResponse['avg_days'] = $avgDays;
            }
        }
    }
    
    public function searchGraphDateWise_old(){
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $search_data = $this->request->data();
            $countfor820 = 0;
            $countfor300 = 0;
            $countfor309 = 0;
            $counts = [];
            if(array_key_exists('startDate',$search_data) && array_key_exists('endDate',$search_data)){
                $startDate = date('Y-m-d', strtotime($search_data['startDate']));
                $endDate = date('Y-m-d', strtotime($search_data['endDate']));
                
                $record = $connection->execute("SELECT * FROM mst_case_timeline WHERE dtCreatedOn >= '".$startDate."' AND dtCreatedOn <='".$endDate."'")->fetchAll('assoc');
                if(count($record)>0){
                    foreach($record as $key=>$case){
                        if($case['ApplicationSubclass'] == 1){
                            $countfor820++;
                        }else if($case['ApplicationSubclass'] == 23){
                            $countfor300++;
                        }else if($case['ApplicationSubclass'] == 24){
                            $countfor309++;
                        }
                    }
                }
                $counts = [
                    'countsfor820' => $countfor820,
                    'countsfor300' => $countfor300,
                    'countsfor309' => $countfor309
                ];
                
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['msg'] = "success";
                $this->apiResponse['counts'] = $counts;
                
            }else{
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['msg'] = "Start Date and EndDate is Required..";
            }
        }
    }
    
    public function searchGraphDateWise(){
        $checkToken = $this->checkToken($this->request->data['uid'], $this->request->data['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $search_data = $this->request->data();
            $countfor820 = 0;
            $countfor300 = 0;
            $countfor309 = 0;
            $counts = [];
            if(array_key_exists('daterange',$search_data)){
                $implode_dates = explode('-',$search_data['daterange']);
                
                $startDate = date('Y-m-d', strtotime($implode_dates[0]));
                $endDate = date('Y-m-d', strtotime($implode_dates[1]));
                
                $record = $connection->execute("SELECT * FROM mst_case_timeline WHERE dtCreatedOn >= '".$startDate."' AND dtCreatedOn <='".$endDate."'")->fetchAll('assoc');
                if(count($record)>0){
                    foreach($record as $key=>$case){
                        if($case['ApplicationSubclass'] == 1){
                            $countfor820++;
                        }else if($case['ApplicationSubclass'] == 23){
                            $countfor300++;
                        }else if($case['ApplicationSubclass'] == 24){
                            $countfor309++;
                        }
                    }
                }
                $counts = [
                    'countsfor820' => $countfor820,
                    'countsfor300' => $countfor300,
                    'countsfor309' => $countfor309
                ];
                
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['msg'] = "success";
                $this->apiResponse['counts'] = $counts;
                
            }else{
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['msg'] = "Start Date and EndDate is Required..";
            }
        }
    }
    
    // week, month, year No. of cases
    public function noOfNewCases(){
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $connection = ConnectionManager::get('default');
            $thisWeekCases = 0;
            $thisMonthCases = 0;
            $thisYearCases = 0;
            
            $thisWeekCases = $connection->execute("SELECT COUNT(*) AS thisWeekCases FROM mst_case_timeline WHERE YEARWEEK(`dtCreatedOn`, 1) = YEARWEEK(CURDATE(), 1)")->fetchAll('assoc');
            
            $thisMonthCases = $connection->execute("select COUNT(*) AS thisMonthCases from mst_case_timeline
               WHERE MONTH(dtCreatedOn)=MONTH(now()) AND YEAR(dtCreatedOn)=YEAR(now())")->fetchAll('assoc');
            
            $thisYearCases = $connection->execute("select COUNT(*) AS thisYearCases from mst_case_timeline WHERE YEAR(dtCreatedOn)=YEAR(now())")->fetchAll('assoc');
            
            $data = [
                'thisWeekCases'=>$thisWeekCases[0]['thisWeekCases'],
                'thisMonthCases'=>$thisMonthCases[0]['thisMonthCases'],
                'thisYearCases'=>$thisYearCases[0]['thisYearCases']
            ];
            
            $this->httpStatusCode = 200;
            $this->apiResponse['valid'] = true;
            $this->apiResponse['data'] = $data;
            $this->apiResponse['message'] = "No. of Cases.";
        }
    }
    
    public function deleteTimelineCase(){
        $checkToken = $this->checkToken($this->request->query['uid'], $this->request->query['token']);
        if ($checkToken['code'] == 402) {
            $this->httpStatusCode = $checkToken['code'];
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = $checkToken['message'];
        } else {
            $iPkTimelineId = $this->request->query['iPkTimelineId'];
            if(isset($iPkTimelineId) && !empty($iPkTimelineId)){
                $connection = ConnectionManager::get('default');
                $connection->execute("DELETE FROM mst_case_timeline WHERE iPkTimelineId = $iPkTimelineId");
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = true;
                $this->apiResponse['message'] = "Case deleted successfully.";
                
            } else{
                $this->httpStatusCode = 200;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = "Something went wrong.";
            }
        }
    }

    public function test()
    {
        echo "<pre>";
        print_r($this->request->data);
        exit;

        //echo "<a href='" . $_SERVER['HTTP_HOST'] . '/login?='.$confirm_token."'>Click Here</a>"; exit;
        //$confirm_token = generate_string(CONFIRMATION_TOKEN, 20);
        //echo CONFIRMATION_TOKEN; exit;
        //$file = 'https://app.veazy.com.au/api/webroot/doctemplates/Templates_Main_Applicant_1569077720.zip';
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        echo json_encode(array("status" => 200, "msg" => "hii"));
        exit;
        $connection = ConnectionManager::get('default');
        $statement = $connection->insert('mst_user', [
            'vEmail' => 'test@gmail.com',
            'vFirstName' => 'test',
            'vLastName' => 'test',
            'vPassword' => '123',
            'vMobile' => '1111111111',
            'eUserStatus' => 'active',
            //'dtUserCreatedOn' => Time::now(),
            'eIsVerified' => 'yes',
            'confirm_token' => '1111111111'
        ]);
        exit;
        $archive_file_name = 'test.zip';
        $target_dir = WWW_ROOT . 'doctemplates/';
        $zip = new \ZipArchive();
        $zip->open($target_dir . $archive_file_name, \ZipArchive::CREATE);
        $zip->addFile($target_dir . 'TrueTrackGPSMielageReport_1544073202.pdf', 'TrueTrackGPSMielageReport_1544073202.pdf');
        /*$zip->addFile('some-file.pdf', 'subdir/filename.pdf');
            $zip->addFile('another-file.xlxs', 'filename.xlxs');*/

        //$file = $zip->filename; 
        $file = $target_dir . $archive_file_name;
        $zip->close();


        if (headers_sent()) {
            echo "HTTP header already sent";
        } else {
            if (!is_file($file)) {
                header($_SERVER['SERVER_PROTOCOL'] . " 404 Not Found");
                echo "File not found";
            } else if (!is_readable($file)) {
                header($_SERVER['SERVER_PROTOCOL'] . " 403 Forbidden");
                echo "File not readable";
            } else {
                header($_SERVER['SERVER_PROTOCOL'] . " 200 OK");
                header('Content-Type: application/zip');
                header("Content-Length: " . filesize($file));
                header("Content-Disposition: attachment; filename=" . basename($file));
                header('Location:' . $file);
                header("Pragma: no-cache");
                $handle = fopen($file, "rb");
                //fpassthru($handle);
                fclose($handle);
            }
        }
        exit;
        //echo substr(sha1(time()), 0, 6); exit; 

    }
    
    function generateRandomString($length = 10) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }
    
    public function regfromstripe($data){
        $confirm_token = substr(sha1(time()), 0, 20);
        //$this->request->allowMethod('post');
        $connection = ConnectionManager::get('default');
        if (empty($data['name'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Name is required';
        } else if (empty($data['email'])) {
            $this->httpStatusCode = 402;
            $this->apiResponse['valid'] = false;
            $this->apiResponse['message'] = 'Email is required';
        } else {
            $email = $data['email'];
            $checkEmailExist = $this->checkEmailExist($email);
            if (!$checkEmailExist) {
                /*if (!$checkMobileExist) {*/
                    Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
                    
                    $password_text = $this->generateRandomString();
                    $password = md5($password_text);
                    $statement = $connection->insert('mst_user', [
                        'vEmail' => $data['email'],
                        'vFirstName' => $data['name'],
                        'vLastName' => '',
                        'vPassword' => $password,
                        //'vMobile' => $mobile,
                        'eUserStatus' => 'active',
                        'dtUserCreatedOn' => Time::now(),
                        'eIsVerified' => 'yes',
                        'confirm_token' => $confirm_token
                    ]);
                    $user_ID = $statement->lastInsertId('mst_user');
                    $connection->insert('mst_user_general_settings', ['user_id' => $user_ID, 'language' => 'en']);
                    $payload = ['email' => $email, 'vpassword' => $password_text];
                    $token = JwtToken::generateToken($payload);
                    $encrypt_ID = md5($user_ID);
                    $this->request->session()->write([
                        'user_id' => $user_ID,
                        'uid' => $encrypt_ID,
                        'token' => $token
                    ]);

                    $now = Time::now();

                    /** check general_setting plans*/
                    $checkdefaultplan = $connection->execute("SELECT vDefaultPlan,ITrialPeriod FROM `general_settings`")->fetch('assoc');
                    $planid = $data['plan_id'];
                    
                    $check_plan = $connection->execute("SELECT * FROM `mst_plans` WHERE Unique_Plan_ID = '$planid'")->fetch('assoc');

                    $expire_day = $checkdefaultplan['ITrialPeriod'];
                    $trial_end_date = date('Y-m-d H:i:s', strtotime($now . ' +' . $expire_day . ' day'));
                    
                    if(empty($check_plan)){
                        $connection->insert('user_plan_payment', [
                            'iFkUserId' => $user_ID,
                            //'iFkUserPlanId' => $planid,
                            //'vPlanType' => $check_plan['Plan_Duration'],
                            //'dPaymentAmount' => $check_plan['Plan_prices'],
                            'customer_id' => $data['customer_id'],
                            'subscription_id' => $data['subscription_id'],
                            'vStatus' => 'active',
                            'is_trial' => 'no',
                            'dtCreatedOn' => $now,
                            'dtPaymentOn' => $now,
                            'Trial_End_Date' => date("Y-m-d H:i:s", strtotime("+1 day", strtotime($now))),
                            'dtExpireDate' => date("Y-m-d H:i:s", strtotime("+1 day", strtotime($now)))
                        ]);
                    }else{
                        if ($check_plan['ePlanFee'] == 'free') {
                            $connection->insert('user_plan_payment', [
                                'iFkUserId' => $user_ID,
                                'iFkUserPlanId' => $check_plan['iPkPlanId'],
                                'vPlanType' => 'free',
                                'dPaymentAmount' => 0,
                                'customer_id' => $data['customer_id'],
                                'subscription_id' => $data['subscription_id'],
                                'vStatus' => 'active',
                                'is_trial' => 'yes',
                                'dtCreatedOn' => $now
                            ]);
                        } else {
                            if ($check_plan['Plan_Duration'] == 'monthly') {
                                $expire_date = date("Y-m-d H:i:s", strtotime("+1 months", strtotime($now)));
                            } else if ($check_plan['Plan_Duration'] == 'free') {
                                $expire_date = '';
                            } else {
                                $expire_date = date("Y-m-d H:i:s", strtotime("+1 years", strtotime($now)));
                            }
                            $connection->insert('user_plan_payment', [
                                'iFkUserId' => $user_ID,
                                'iFkUserPlanId' => $check_plan['iPkPlanId'],
                                'vPlanType' => $check_plan['Plan_Duration'],
                                'dPaymentAmount' => $check_plan['Plan_prices'],
                                'customer_id' => $data['customer_id'],
                                'subscription_id' => $data['subscription_id'],
                                'vStatus' => 'active',
                                //'is_trial' => 'yes',
                                'dtCreatedOn' => $now,
                                'Trial_End_Date' => $expire_date,
                                'dtExpireDate' => $expire_date
                            ]);
                        }
                    }
                    

                    /** send email start*/

                    $email = new Email();

                    $link = "<a href='https://" . $_SERVER['HTTP_HOST'] . "/login?token=" . $confirm_token . "'>";

                    $dir = new Folder(WWW_ROOT . 'templates');
                    $files = $dir->find('welcome.html', true);
                    foreach ($files as $file) {
                        $file = new File($dir->pwd() . DS . $file);
                        $contents = $file->read();
                        $file->close();
                    }

                    $patterns = array();
                    $outputs = preg_replace($patterns, '', $contents);

                    $message = str_replace(
                        array('{TITLE}', '{FIRSTNAME}', '{BODY}', '{EMAIL}', '{PASSWORD}'),
                        array('Successful Registration', $data['firstname'], $link, $data['email'], $password_text),
                        $outputs
                    );

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
                        ->to([$data['email']])
                        //->to(['poojanmehta008@gmail.com'])
                        //->cc(['ts101230@hotmail.com'])
                        ->cc(['poojanmehta008@gmail.com'])
                        //->cc(['addon.akbar@gmail.com'])
                        ->subject('Successful Registration')
                        ->send($message);

                    /** send email end */

                    $this->httpStatusCode = 200;
                    $this->apiResponse['valid'] = true;
                    $this->apiResponse['user_id'] = $encrypt_ID;
                    $this->apiResponse['api_token'] = $token;
                    $this->apiResponse['fname'] = $data['name'];
                    $this->apiResponse['lname'] = $data['name'];
                    $this->apiResponse['email'] = $data['email'];
                    $this->apiResponse['message'] = 'Please check your mail and verify it.';
                /*} else {
                    $this->httpStatusCode = 402;
                    $this->apiResponse['valid'] = false;
                    $this->apiResponse['message'] = 'Mobile number already in use';
                }*/
            } else {
                $this->httpStatusCode = 402;
                $this->apiResponse['valid'] = false;
                $this->apiResponse['message'] = 'Email already in use';
            }
        }
    }
    
    public function stripetest(){
        $url = 'https://api.stripe.com/v1/customers';
          
        $requestMethod = "GET";        
        $resData = $this->curlf($data, $url, $requestMethod);
        $json_string = json_decode($resData, true);
        $data = array();
        if(!empty($json_string)){
            foreach($json_string['data'] as $key => $customer){
                $customerId = $customer['id'];
                $url = 'https://api.stripe.com/v1/subscriptions?customer='.$customerId;
          
                $requestMethod = "GET";        
                $resSubscriptionData = $this->curlf($data, $url, $requestMethod);
                $json_subscription_string = json_decode($resSubscriptionData, true);
                if(!empty($json_subscription_string)){
                    $data['name'] = $customer['name'];
                    $data['email'] = $customer['email'];
                    $json_string['data'][$key]['subscription_data'] = $json_subscription_string;
                    $plan_id = $json_string['data'][$key]['subscription_data']['data'][$key]['items']['data'][$key]['plan']['product'];
                    $data['plan_id'] = $plan_id;
                    $data['customer_id'] = $json_string['data'][$key]['id'];
                    $data['subscription_id'] = $json_string['data'][$key]['subscription_data']['data'][$key]['id'];
                    
                } //print_r($data); exit;
                $this->regfromstripe($data);
            } 
        }
        
        $this->httpStatusCode = 200;
        $this->apiResponse['valid'] = true;
    }
    
    public function curlf($data = array(), $endPoint = '', $requestMethod = ''){
        $curl = curl_init();

        $json_string = json_encode($data);

        $headers = array(
            //'Content-Type:application/json',
            'Authorization: Bearer sk_test_51Kb5SESH6YpkiFrTw4ZbUU7cT4BgCOhtwCRyUzsL4ymQ3jxA1R3CmzqCp1nC1iwspqf1UjPNvRiKQSk1eweA6ET900rEiC8JJV'
        );

        curl_setopt($curl, CURLOPT_URL, $endPoint);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true );

        $data = curl_exec($curl);

        curl_close($curl);
        return $data;
    }
}

function image_url()
{
    //file path
    return Router::url('/', true);
}

function home_base_url()
{
    // first get http protocol if http or https
    $base_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') ? 'https://' : 'http://';

    // get default website root directory
    $tmpURL = dirname(__FILE__);
    // when use dirname(__FILE__) will return value like this "C:\xampp\htdocs\my_website",
    //convert value to http url use string replace,
    // replace any backslashes to slash in this case use chr value "92"

    $tmpURL = str_replace(chr(92), '/', $tmpURL);
    // now replace any same string in $tmpURL value to null or ''
    // and will return value like /localhost/my_website/ or just /my_website/

    $tmpURL = str_replace($_SERVER['DOCUMENT_ROOT'], '', $tmpURL);
    // delete any slash character in first and last of value

    $tmpURL = ltrim($tmpURL, '/');
    $tmpURL = rtrim($tmpURL, '/');
    // check again if we find any slash string in value then we can assume its local machine

    if (strpos($tmpURL, '/')) {
        // explode that value and take only first value
        $tmpURL = explode('/', $tmpURL);
        $tmpURL = $tmpURL[0];
    }

    if ($_SERVER['HTTP_HOST'] == 'localhost' || $_SERVER['HTTP_HOST'] == '202.131.106.51') {
        return $base_url .= $_SERVER['HTTP_HOST'] . '/' . $tmpURL . '/veazy/';
    }
    // now last steps
    // assign protocol in first value
    if ($tmpURL !== $_SERVER['HTTP_HOST'])
        // if protocol its http then like this
        $base_url .= $_SERVER['HTTP_HOST'] . '/' . $tmpURL . '/';
    else
        // else if protocol is https
        $base_url .= $tmpURL . '/';
    // give return value
    return $base_url;
}


function mime_content_type($filename)
{

    $mime_types = array(
        'txt' => 'text/plain',
        'htm' => 'text/html',
        'html' => 'text/html',
        'php' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'xml' => 'application/xml',
        'swf' => 'application/x-shockwave-flash',
        'flv' => 'video/x-flv',

        // images
        'png' => 'image/png',
        'jpe' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'jpg' => 'image/jpeg',
        'gif' => 'image/gif',
        'bmp' => 'image/bmp',
        'ico' => 'image/vnd.microsoft.icon',
        'tiff' => 'image/tiff',
        'tif' => 'image/tiff',
        'svg' => 'image/svg+xml',
        'svgz' => 'image/svg+xml',

        // archives
        'zip' => 'application/zip',
        'rar' => 'application/x-rar-compressed',
        'exe' => 'application/x-msdownload',
        'msi' => 'application/x-msdownload',
        'cab' => 'application/vnd.ms-cab-compressed',

        // audio/video
        'mp3' => 'audio/mpeg',
        'qt' => 'video/quicktime',
        'mov' => 'video/quicktime',

        // adobe
        'pdf' => 'application/pdf',
        'psd' => 'image/vnd.adobe.photoshop',
        'ai' => 'application/postscript',
        'eps' => 'application/postscript',
        'ps' => 'application/postscript',

        // ms office
        'doc' => 'application/msword',
        'rtf' => 'application/rtf',
        'xls' => 'application/vnd.ms-excel',
        'ppt' => 'application/vnd.ms-powerpoint',

        // open office
        'odt' => 'application/vnd.oasis.opendocument.text',
        'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
    );

    $ext = strtolower(array_pop(explode('.', $filename)));
    if (array_key_exists($ext, $mime_types)) {
        return $mime_types[$ext];
    } elseif (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME);
        $mimetype = finfo_file($finfo, $filename);
        finfo_close($finfo);
        return $mimetype;
    } else {
        return 'application/octet-stream';
    }
}
