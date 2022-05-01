<?php
/**
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link          https://cakephp.org CakePHP(tm) Project
 * @since         0.10.8
 * @license       https://opensource.org/licenses/mit-license.php MIT License
 */

/*
 * Configure paths required to find CakePHP + general filepath constants
 */
require __DIR__ . '/paths.php';

/*
 * Bootstrap CakePHP.
 *
 * Does the various bits of setup that CakePHP needs to do.
 * This includes:
 *
 * - Registering the CakePHP autoloader.
 * - Setting the default application paths.
 */
require CORE_PATH . 'config' . DS . 'bootstrap.php';

use Cake\Cache\Cache;
use Cake\Console\ConsoleErrorHandler;
use Cake\Core\App;
use Cake\Core\Configure;
use Cake\Core\Configure\Engine\PhpConfig;
use Cake\Core\Plugin;
use Cake\Database\Type;
use Cake\Datasource\ConnectionManager;
use Cake\Error\ErrorHandler;
use Cake\Http\ServerRequest;
use Cake\Log\Log;
use Cake\Mailer\Email;
use Cake\Utility\Inflector;
use Cake\Utility\Security;

/**
 * Uncomment block of code below if you want to use `.env` file during development.
 * You should copy `config/.env.default to `config/.env` and set/modify the
 * variables as required.
 */
// if (!env('APP_NAME') && file_exists(CONFIG . '.env')) {
//     $dotenv = new \josegonzalez\Dotenv\Loader([CONFIG . '.env']);
//     $dotenv->parse()
//         ->putenv()
//         ->toEnv()
//         ->toServer();
// }

/*
 * Read configuration file and inject configuration into various
 * CakePHP classes.
 *
 * By default there is only one configuration file. It is often a good
 * idea to create multiple configuration files, and separate the configuration
 * that changes from configuration that does not. This makes deployment simpler.
 */
try {
    Configure::config('default', new PhpConfig());
    Configure::load('app', 'default', false);
} catch (\Exception $e) {
    exit($e->getMessage() . "\n");
}

Configure::write('Session', [
    'defaults' => 'php',
    'ini' => [
        'session.cookie_secure' => false
    ]
]);


/*
 * Load an environment local configuration file.
 * You can use a file like app_local.php to provide local overrides to your
 * shared configuration.
 */
//Configure::load('app_local', 'default');

/*
 * When debug = true the metadata cache should only last
 * for a short time.
 */
if (Configure::read('debug')) {
    Configure::write('Cache._cake_model_.duration', '+2 minutes');
    Configure::write('Cache._cake_core_.duration', '+2 minutes');
}

/*
 * Set server timezone to UTC. You can change it to another timezone of your
 * choice but using UTC makes time calculations / conversions easier.
 * Check http://php.net/manual/en/timezones.php for list of valid timezone strings.
 */
date_default_timezone_set('UTC');

/*
 * Configure the mbstring extension to use the correct encoding.
 */
mb_internal_encoding(Configure::read('App.encoding'));

/*
 * Set the default locale. This controls how dates, number and currency is
 * formatted and sets the default language to use for translations.
 */
ini_set('intl.default_locale', Configure::read('App.defaultLocale'));

/*
 * Register application error and exception handlers.
 */
$isCli = PHP_SAPI === 'cli';
if ($isCli) {
    (new ConsoleErrorHandler(Configure::read('Error')))->register();
} else {
    (new ErrorHandler(Configure::read('Error')))->register();
}

/*
 * Include the CLI bootstrap overrides.
 */
if ($isCli) {
    require __DIR__ . '/bootstrap_cli.php';
}

/*
 * Set the full base URL.
 * This URL is used as the base of all absolute links.
 *
 * If you define fullBaseUrl in your config file you can remove this.
 */
if (!Configure::read('App.fullBaseUrl')) {
    $s = null;
    if (env('HTTPS')) {
        $s = 's';
    }

    $httpHost = env('HTTP_HOST');
    if (isset($httpHost)) {
        Configure::write('App.fullBaseUrl', 'http' . $s . '://' . $httpHost);
    }
    unset($httpHost, $s);
}

Cache::setConfig(Configure::consume('Cache'));
ConnectionManager::setConfig(Configure::consume('Datasources'));
Email::setConfigTransport(Configure::consume('EmailTransport'));
Email::setConfig(Configure::consume('Email'));
Log::setConfig(Configure::consume('Log'));
Security::setSalt(Configure::consume('Security.salt'));

/*
 * The default crypto extension in 3.0 is OpenSSL.
 * If you are migrating from 2.x uncomment this code to
 * use a more compatible Mcrypt based implementation
 */
//Security::engine(new \Cake\Utility\Crypto\Mcrypt());

/*
 * Setup detectors for mobile and tablet.
 */
ServerRequest::addDetector('mobile', function ($request) {
    $detector = new \Detection\MobileDetect();

    return $detector->isMobile();
});
ServerRequest::addDetector('tablet', function ($request) {
    $detector = new \Detection\MobileDetect();

    return $detector->isTablet();
});

/*
 * Enable immutable time objects in the ORM.
 *
 * You can enable default locale format parsing by adding calls
 * to `useLocaleParser()`. This enables the automatic conversion of
 * locale specific date formats. For details see
 * @link https://book.cakephp.org/3.0/en/core-libraries/internationalization-and-localization.html#parsing-localized-datetime-data
 */
Type::build('time')
    ->useImmutable();
Type::build('date')
    ->useImmutable();
Type::build('datetime')
    ->useImmutable();
Type::build('timestamp')
    ->useImmutable();

/*
 * Custom Inflector rules, can be set to correctly pluralize or singularize
 * table, model, controller names or whatever other string is passed to the
 * inflection functions.
 */
//Inflector::rules('plural', ['/^(inflect)or$/i' => '\1ables']);
//Inflector::rules('irregular', ['red' => 'redlings']);
//Inflector::rules('uninflected', ['dontinflectme']);
//Inflector::rules('transliteration', ['/å/' => 'aa']);

/*
 * Plugins need to be loaded manually, you can either load them one by one or all of them in a single call
 * Uncomment one of the lines below, as you need. make sure you read the documentation on Plugin to use more
 * advanced ways of loading plugins
 *
 * Plugin::loadAll(); // Loads all plugins at once
 * Plugin::load('Migrations'); //Loads a single plugin named Migrations
 *
 */

/*
 * Only try to load DebugKit in development mode
 * Debug Kit should not be installed on a production system
 */
if (Configure::read('debug')) {
    Plugin::load('DebugKit', ['bootstrap' => true]);
}


//General
define('NOUSER',' User_name is required');
define('NOPASS',' Password is required');
define('USERPASSWRONG',' Username and Password are wrong !');
define('USERWRONG',' Username or Email is wrong !');
define('FORGOTPASSMSG','Instructions to reset your password have been emailed to ');
define('RESETPASSMSG',' Your password has been reset. Please use the new password to login !');
define('SAVEUSERGENINFOMSG',' Your general information has been updated successfully !');
define('SAVEPASSINFOMSG',' Your password has been changed successfully !');
define('WRONGPASSMSG',' Your current password is wrong !');

//login info

define('UNPROCESSABLE_ENTITY','Unprocessable entity');
define('DETAIL_WRONG','You have entered wrong email address or password.');
define('METHOD_NOT_ALLOWED','Method is not allowed');
define('WRONG_EMAIL_ADDRESS','You have entered wrong email address');
define('TYPE_WRONG','Type is wrong');

//user
define('DELETEMSG','User has been deleted successfully !');
define('NO_DELETE','User can not be delete !');
define('DATA_NOT_FOUND','User is not found.');
define('SUCCESS_EDIT','User has been edited successfully !');

//deleted record
define('RECORD_DELETED','Record has been deleted successfully !');
define('NOT_FOUND','Record has not found !');


$db = ConnectionManager::get('default');
$query = $db->query('select * from general_settings')->fetchAll('assoc');

if(count($query) > 0){
    $support_email = $query[0]['vSettingEmailSupport'];
    $admin_email = $query[0]['vSettingEmailAdmin'];
    $reply_to = $query[0]['vSettingEmailReplyTo'];
    $CC_to = $query[0]['vSettingEmailCC'];
    $BCC_to = $query[0]['vSettingEmailBCC'];
    $emailtype = $query[0]['emailtype'];
    $smtphost = $query[0]['smtphost'];
    $smtpport = $query[0]['smtpport'];
    $smtpusername = $query[0]['smtpusername'];
    $smtppassword = $query[0]['smtppassword'];

    $vPaymentMode = $query[0]['vPaymentMode'];
    $vPaypalApiUserNameSand = $query[0]['vPaypalApiUserNameSand'];
    $vPaypalApiPasswordSand = $query[0]['vPaypalApiPasswordSand'];
    $vPaypalApiSignatureSand= $query[0]['vPaypalApiSignatureSand'];
    $vPaypalApiUserNameLive = $query[0]['vPaypalApiUserNameLive'];
    $vPaypalApiPasswordLive = $query[0]['vPaypalApiPasswordLive'];
    $vPaypalApiSignatureLive = $query[0]['vPaypalApiSignatureLive'];


}else{
    $support_email = 'support@veazy.com.au';
    $admin_email = 'support@veazy.com.au';
    $reply_to = 'support@veazy.com.au';
    $CC_to = '';
    $BCC_to = '';
    $emailtype = 'gmail';
    $smtphost = 'mail.veazy.com.au';
    $smtpport = 465;
    $smtpusername = 'support@veazy.com.au';
    $smtppassword = 'Veazy1234!';
}

define('PROJECTNAME', 'Veazy');
define('SUPPORT_EMAIL', $support_email);
define('ADMIN_EMAIL', $admin_email);
define('REPLY_TO', $reply_to);
define('CC_TO', $CC_to);
define('BCC_TO', $BCC_to);
define('EMAILTYPE', $emailtype);
define('SMTPHOST', $smtphost);
define('SMTPPORT', $smtpport);
define('SMTPUSERNAME', $smtpusername);
define('SMTPPASSWORD', $smtppassword);

define('PAYMENTMODE', $vPaymentMode);
define('SENDAPIUSERNAME', $vPaypalApiUserNameSand);
define('SENDAPIPASSWORD', $vPaypalApiPasswordSand);
define('SENDAPISIGNATURE',$vPaypalApiSignatureSand);

define('LIVEAPIUSERNAME', $vPaypalApiUserNameLive);
define('LIVEAPIPASSWORD', $vPaypalApiPasswordLive);
define('LIVEAPISIGNATURE',$vPaypalApiSignatureLive);

//Stripe Private Key
define('stripe_secret_key','sk_live_Cx5zEyGBbC5OzxSssacrl1vp'); //sk_live_Cx5zEyGBbC5OzxSssacrl1vp   /*Live Keys*/
//define('stripe_secret_key','sk_test_BeFQYeuZwGzO3XLNf0Jp34xm'); //sk_live_Cx5zEyGBbC5OzxSssacrl1vp  /*Test Keys*/
//ENCRYPTION & DECRYPTION KEY
define('ENCRYPTION_KEY', 'wt1U5MACWJFTXGenFoZoiLwQGrLgdbHA');
define('CONFIRMATION_TOKEN','0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

Plugin::load('RestApi', ['bootstrap' => true]);
