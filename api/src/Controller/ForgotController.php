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
use App\Controller\AppController;
use Cake\Filesystem\Folder;
use Cake\Filesystem\File;


class ForgotController extends AppController
{
    var $helpers = array('Html');

    public function initialize()
    {
        $this->loadComponent('RequestHandler');
    }

    public function index()
    {
    }

    public function forgotpassword(){
        $connection = ConnectionManager::get('default');
        $email_data =$this->request->data['vEmail'];
        $pathlink =$this->request->data['path'];
        $query = $connection->execute("select * from mst_admin where vAdminEmail = :email and eAdminStatus='active'",['email' => $email_data])->fetchAll('assoc');

        $id=base64_encode($query[0]['iPkAdminId']);
        $emails=$query[0]['vAdminEmail'];
        $fname=$query[0]['vAdminFirstName'];
        
        $host = $_SERVER['HTTP_HOST'];
        $login_link='<a href="'.$pathlink.'admin/resetpassword?key='.$id.'">'.'Click Here'.'</a>';
        if($emails == $email_data) {
            $dir = new Folder(WWW_ROOT . 'templates');
            $files = $dir->find('welcome.html', true);

            foreach ($files as $file) {
                $file = new File($dir->pwd() . DS . $file);
                $contents = $file->read();
                $file->close();
            }
            $emails_content =  $contents;
            $patterns = array();
            $outputs = preg_replace($patterns, '', $emails_content);

            $message = str_replace(array('{TITLE}','{FIRSTNAME}','{BODY}'),
                array('Password Reset Request',$fname,'Using this link to reset your password.You can <a href="#">'.$login_link.'</a>'),$outputs);



            $email  = new Email();

            if(EMAILTYPE == 'gmail'){
                Email::dropTransport('Gmail');
                Email::configTransport('Gmail', [
                    'host' => SMTPHOST,
                    'port' => SMTPPORT,
                    'username' => SMTPUSERNAME,
                    'password' => SMTPPASSWORD,
                    'className' => 'Smtp'
                ]);
                $email ->transport('Gmail');
            }else{
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
                $email ->transport('default');
            }
            $email  ->emailFormat('html')
                ->from([ADMIN_EMAIL => PROJECTNAME])
                ->to([$emails])
                ->subject('Password Reset')
                ->send($message);
            $this->response('s');
        } else{
            $this->response('f');
        }
    }


    public function resetpassword()
    {
        $connection = ConnectionManager::get('default');
        $currentpassword = md5($this->request->data['vConfirmPassword']);
        $newpassword = md5($this->request->data['vPassword']);
        $key = $this->request->data['key'];
        $id= base64_decode($key);
       // $query = $connection->execute("select * from tbl_system_admin where iAdminId=$id")->fetchAll('assoc');
        //$password = $query[0]['vPassword'];
       // print_r($id);exit;
        if (md5($currentpassword) == md5($newpassword)) {
            $connection->execute("CALL `sp_changepassword`('systemadmin',$id,'$newpassword')");
            $this->response('s');
        } else {
            $this->response('f');
        }
    }




}
