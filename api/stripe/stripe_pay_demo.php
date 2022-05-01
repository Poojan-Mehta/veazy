<?php 

require('../init.php');

\Stripe\Stripe::setApiKey("sk_test_QZgjegBLM6KLTHjb6DSujehe");

$plan = \Stripe\Plan::create(array(
  "name" => "name1",
  "id" => "plan1",
  "interval" => "month",
  "currency" => "usd",
  "amount" => 20,
));

?>