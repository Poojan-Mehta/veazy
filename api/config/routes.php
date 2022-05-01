<?php
/**
 * Routes configuration
 *
 * In this file, you set up routes to your controllers and their actions.
 * Routes are very important mechanism that allows you to freely connect
 * different URLs to chosen controllers and their actions (functions).
 *
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 * @link          https://cakephp.org CakePHP(tm) Project
 * @license       https://opensource.org/licenses/mit-license.php MIT License
 */

use Cake\Core\Plugin;
use Cake\Routing\RouteBuilder;
use Cake\Routing\Router;
use Cake\Routing\Route\DashedRoute;

/**
 * The default class to use for all routes
 *
 * The following route classes are supplied with CakePHP and are appropriate
 * to set as the default:
 *
 * - Route
 * - InflectedRoute
 * - DashedRoute
 *
 * If no call is made to `Router::defaultRouteClass()`, the class used is
 * `Route` (`Cake\Routing\Route\Route`)
 *
 * Note that `Route` does not do any inflections on URLs which will result in
 * inconsistently cased URLs when used with `:plugin`, `:controller` and
 * `:action` markers.
 *
 */
Router::defaultRouteClass(DashedRoute::class);

Router::scope('/', function (RouteBuilder $routes) {
    /**
     * Here, we are connecting '/' (base path) to a controller called 'Pages',
     * its action called 'display', and we pass a param to select the view file
     * to use (in this case, src/Template/Pages/home.ctp)...
     */
    $routes->connect('/', ['controller' => 'Pages', 'action' => 'display', 'home']);

    /**
     * ...and connect the rest of 'Pages' controller's URLs.
     */
    $routes->connect('/pages/*', ['controller' => 'Pages', 'action' => 'display']);

    $routes->connect('/webservice/signup', ['controller' => 'Webservice', 'action' => 'signup','allowWithoutToken' => true]);
    $routes->connect('/webservice/checklogin', ['controller' => 'Webservice', 'action' => 'checklogin','allowWithoutToken' => true]);
    $routes->connect('/webservice/login', ['controller' => 'Webservice', 'action' => 'login','allowWithoutToken' => true]);
    $routes->connect('/webservice/forgotpassword', ['controller' => 'Webservice', 'action' => 'forgotpassword','allowWithoutToken' => true]);
    $routes->connect('/webservice/resetpassword', ['controller' => 'Webservice', 'action' => 'resetpassword','allowWithoutToken' => true]);
    $routes->connect('/webservice/:action/*', ['controller' => 'Webservice','allowWithoutToken' => false]);
    $routes->connect('/webservice/editdconblur', ['controller' => 'Webservice','action' => 'editdconblur','allowWithoutToken' => true]);
    $routes->connect('/webservice/getplan', ['controller' => 'Webservice','action' => 'getplan','allowWithoutToken' => true]);
    $routes->connect('/webservice/expireplan', ['controller' => 'Webservice','action' => 'expireplan','allowWithoutToken' => true]);
    $routes->connect('/webservice/expireplanmail', ['controller' => 'Webservice','action' => 'expireplanmail','allowWithoutToken' => true]);
    $routes->connect('/webservice/checkapplication', ['controller' => 'Webservice','action' => 'checkapplication','allowWithoutToken' => true]);
    $routes->connect('/webservice/checkdefaultplan', ['controller' => 'Webservice','action' => 'checkdefaultplan','allowWithoutToken' => true]);
    $routes->connect('/webservice/logindefaultplan', ['controller' => 'Webservice','action' => 'logindefaultplan','allowWithoutToken' => false]);
    $routes->connect('/webservice/getProfile', ['controller' => 'Webservice','action' => 'getProfile','allowWithoutToken' => false]);
    $routes->connect('/webservice/trialPayment', ['controller' => 'Webservice','action' => 'trialPayment','allowWithoutToken' => true]);
    $routes->connect('/webservice/trialendmail', ['controller' => 'Webservice','action' => 'trialendmail','allowWithoutToken' => true]);
    $routes->connect('/webservice/checktrialday', ['controller' => 'Webservice','action' => 'checktrialday','allowWithoutToken' => true]);
    $routes->connect('/webservice/receivepayment', ['controller' => 'Webservice','action' => 'receivepayment','allowWithoutToken' => true]);
    $routes->connect('/webservice/test', ['controller' => 'Webservice','action' => 'test','allowWithoutToken' => true]);
    //stripeApiTest added by poojan date 14/3/2022
    $routes->connect('/webservice/stripetest', ['controller' => 'Webservice','action' => 'stripetest','allowWithoutToken' => true]);
    $routes->connect('/webservice/generate_string', ['controller' => 'Webservice','action' => 'generate_string','allowWithoutToken' => true]);
    $routes->connect('/webservice/checkotp', ['controller' => 'Webservice','action' => 'checkotp','allowWithoutToken' => true]);
    $routes->connect('/webservice/updateDeadlineDate', ['controller' => 'Webservice','action' => 'updateDeadlineDate','allowWithoutToken' => true]);

    $routes->connect('/webservice/createZip', ['controller' => 'Webservice','action' => 'createZip','allowWithoutToken' => true]);

    $routes->connect('/webservice/expiretrial', ['controller' => 'Webservice','action' => 'expiretrial','allowWithoutToken' => true]);
    
    $routes->connect('/webservice/getCountries', ['controller' => 'Webservice','action' => 'getCountries','allowWithoutToken' => true]);
    

    /**
     * Connect catchall routes for all controllers.
     *
     * Using the argument `DashedRoute`, the `fallbacks` method is a shortcut for
     *    `$routes->connect('/:controller', ['action' => 'index'], ['routeClass' => 'DashedRoute']);`
     *    `$routes->connect('/:controller/:action/*', [], ['routeClass' => 'DashedRoute']);`
     *
     * Any route class can be used with this method, such as:
     * - DashedRoute
     * - InflectedRoute
     * - Route
     * - Or your own route class
     *
     * You can remove these routes once you've connected the
     * routes you want in your application.
     */
    $routes->fallbacks(DashedRoute::class);
});

/**
 * Load all plugin routes. See the Plugin documentation on
 * how to customize the loading of plugin routes.
 */
Plugin::routes();
