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

class CmsController extends AppController
{
    public function initialize(){
        $this->loadComponent('RequestHandler');
        $this->checkValidToken();
    }

    public function getmenu(){

        error_reporting(0);
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select * from mst_cms_menu where eMenuStatus !='deleted' ")->fetchAll('assoc');
        $this->response('s',$query);
    }

    public function index(){
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("select mc.*,cm.*
        from mst_cms_page as mc
        LEFT JOIN mst_cms_menu as cm on cm.iPkMenuId=mc.vCmsPageName
        where mc.eCmsPageStatus !='deleted'")->fetchAll('assoc');
        $this->response('s', $query);
    }

    public function view(){
        $cmsId = $this->request->query['cmsId'];
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("call sp_cms_page ('selectbyid','$cmsId','0','','','','','','0','')")->fetch('assoc');
        if($query){
            $this->response('s', $query);
        }else{
            $error = 'Something went wrong.';
            $connection->rollback();
            $this->response('f', '', $error);
        }
    }

    public function changeStatus(){
        if(isset($this->request->data['statusId'])){
            $id = $this->request->data['statusId'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            }else{
                $status = 'active';
            }
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("CALL `sp_cms_page`('$status','$id','0','','','','','','0','$status')");
            $this->response('s',$query);
        }else{
            $this->response('f',$query);
        }
    }

    public function changeStatusAll(){

        if(isset($this->request->data['selectedIds'])){
            $ids = $this->request->data['selectedIds'];
            if ($this->request->data['status'] == 'active') {
                $status = 'inactive';
            } else {
                $status = 'active';
            }
            $connection = ConnectionManager::get('default');

            foreach($ids as $id){
                $query = $connection->execute("call sp_cms_page ('$status','$id','0','','','','','','0','$status')");
            }
            $this->response('s');
        }
    }

    public function delete(){
        if(isset($this->request->data['deleteId'])){
            $id = $this->request->data['deleteId'];
            $connection = ConnectionManager::get('default');
            $query = $connection->execute("call sp_cms_page ('delete','$id','0','','','','','','0','deleted')");
            $this->response('s');
        }
    }

    public function deleteAll(){
        if(isset($this->request->data['deleteIds'])){
            $ids = $this->request->data['deleteIds'];
            $connection = ConnectionManager::get('default');
            foreach($ids as $id){
                $query = $connection->execute("call sp_cms_page ('delete','$id','0','','','','','','0','deleted')");
            }
            $this->response('s');
        }
    }

    public function add(){
        $vCmsPageMenu = '';
        $vCmsPageTitle = '';
        $vCmsPageContent = '';
        $vCmsPageMetaTitle = '';
        $vCmsPageMetaKeyword = '';
        $vCmsPageMetaDescription = '';
        $eCmsPageStatus = '';


        if (!empty($this->request->data['vCmsPageMenu']))
            $vCmsPageMenu = $this->request->data['vCmsPageMenu'];

        if (!empty($this->request->data['vCmsPageTitle']))
            $vCmsPageTitle = $this->request->data['vCmsPageTitle'];

        if (!empty($this->request->data['vCmsPageContent']))
            $vCmsPageContent = $this->request->data['vCmsPageContent'];

        if (!empty($this->request->data['vCmsPageMetaTitle']))
            $vCmsPageMetaTitle = $this->request->data['vCmsPageMetaTitle'];

        if (!empty($this->request->data['vCmsPageMetaKeyword']))
            $vCmsPageMetaKeyword = $this->request->data['vCmsPageMetaKeyword'];

        if (!empty($this->request->data['vCmsPageMetaDescription']))
            $vCmsPageMetaDescription = $this->request->data['vCmsPageMetaDescription'];

        if (!empty($this->request->data['eCmsPageStatus']))
            $eCmsPageStatus = $this->request->data['eCmsPageStatus'];


        if($vCmsPageMenu == '' || $vCmsPageTitle == '' || $vCmsPageContent == '' || $eCmsPageStatus == ''){
            $this->response('f', '', 'Incomplete parameter');
        }

        if ($this->request->is(['post'])){
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');

            $connection = ConnectionManager::get('default');
            $connection->begin();
                try {
                    $query = $connection->insert('mst_cms_page', [

                        'vCmsPageName' => $vCmsPageMenu,
                        'vCmsPageTitle' => $vCmsPageTitle,
                        'vCmsPageContent' => $vCmsPageContent,
                        'vCmsPageMetaTitle' => $vCmsPageMetaTitle,
                        'vCmsPageMetaKeyword' => $vCmsPageMetaKeyword,
                        'vCmsPageMetaDescription' => $vCmsPageMetaDescription,
                        'dtCmsPageCreatedDate' => Time::now(),
                        'eCmsPageStatus' => $eCmsPageStatus ]);

                    $connection->commit();
                    $this->response('s','','Page added successfully');
                } catch (\PDOException $e) {
                    $error = 'Server Error. Something went wrong.';
                    $connection->rollback();
                    $this->response('f', '', $error);
                }
            }else{
                $this->response('f','','Server Error. Something went wrong123.');
            }
    }

    public function edit(){

        $vCmsPageMenu = '';
        $vCmsPageTitle = '';
        $vCmsPageContent = '';
        $vCmsPageMetaTitle = '';
        $vCmsPageMetaKeyword = '';
        $vCmsPageMetaDescription = '';
        $eCmsPageStatus = '';
        $cmsid = '';

        if (!empty($this->request->data['vCmsPageMenu']))
            $vCmsPageMenu = $this->request->data['vCmsPageMenu'];

        if (!empty($this->request->data['vCmsPageTitle']))
            $vCmsPageTitle = $this->request->data['vCmsPageTitle'];

        if (!empty($this->request->data['vCmsPageContent']))
            $vCmsPageContent = $this->request->data['vCmsPageContent'];

        if (!empty($this->request->data['vCmsPageMetaTitle']))
            $vCmsPageMetaTitle = $this->request->data['vCmsPageMetaTitle'];

        if (!empty($this->request->data['vCmsPageMetaKeyword']))
            $vCmsPageMetaKeyword = $this->request->data['vCmsPageMetaKeyword'];

        if (!empty($this->request->data['vCmsPageMetaDescription']))
            $vCmsPageMetaDescription = $this->request->data['vCmsPageMetaDescription'];

        if (!empty($this->request->data['eCmsPageStatus']))
            $eCmsPageStatus = $this->request->data['eCmsPageStatus'];

        if (!empty($this->request->data['cmsId']))
            $cmsId = $this->request->data['cmsId'];

        if($cmsId == '' || $vCmsPageMenu == '' || $vCmsPageTitle == '' || $vCmsPageContent == ''){
            $this->response('f', '', 'Incomplete parameter');
        }


        if ($this->request->is(['post'])){
            Time::setToStringFormat('yyyy-MM-dd HH:mm:ss');
            $connection = ConnectionManager::get('default');
            $connection->begin();

            try {
                $query = $connection->update('mst_cms_page', [

                    'vCmsPageName' => $vCmsPageMenu,
                    'vCmsPageTitle' => $vCmsPageTitle,
                    'vCmsPageContent' => $vCmsPageContent,
                    'vCmsPageMetaTitle' => $vCmsPageMetaTitle,
                    'vCmsPageMetaKeyword' => $vCmsPageMetaKeyword,
                    'vCmsPageMetaDescription' => $vCmsPageMetaDescription,
                    'eCmsPageStatus' => $eCmsPageStatus ],['iPkCmsPageId' => $cmsId]);

                $connection->commit();
                $this->response('s','','CMS Page updated successfully');
            } catch (\PDOException $e) {
                $error = 'Server Error. Something went wrong.';
                $connection->rollback();
                $this->response('f', '', $error);
            }
        }
    }
    public function front_getCmsmenus()
    {
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT * FROM mst_cms_menu where eMenuStatus='active';")->fetchAll('assoc');
        return $query;
    }

    public function front_getCmspage($id)
    {
        $connection = ConnectionManager::get('default');
        $query = $connection->execute("SELECT cp.*,cm.vMenuName FROM mst_cms_page as cp left join mst_cms_menu as cm on cp.vCmsPageName = cm.iPkMenuId where cp.vCmsPageName =  :id AND cp.eCmsPageStatus='active'",['id'=>$id])->fetch('assoc');
        return $query;
    }
}
