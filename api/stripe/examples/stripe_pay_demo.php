<?php

require('../init.php');

\Stripe\Stripe::setApiKey("sk_test_QZgjegBLM6KLTHjb6DSujehe");

// $plan = \Stripe\Plan::create(array(
//   "name" => "name1",
//   "id" => "plan1",
//   "interval" => "month",
//   "currency" => "usd",
//   "amount" => 20,
// ));

// $customer = \Stripe\Customer::create(array(
//   "email" => "cus1@example.com",
// ));
// echo "<pre>";
// print_r($customer);


/*$subscription =\Stripe\Subscription::create(array(
  "customer" => "cus_BepWR6kG9aEBXy",
  "items" => array(
    array(
      "plan" => "plan1",
    ),
  ),
));*/


if(!empty($_POST['stripeToken']))
{


	\Stripe\Stripe::setApiKey("sk_test_QZgjegBLM6KLTHjb6DSujehe");

	// Token submitted by the plan form:
	$stripetoken = $_POST['stripeToken'];

// Create a Customer:
// $customer = \Stripe\Customer::create(array(
//   "email" => "paying.user@example.com",
//   "source" => $stripetoken,
// ));

// $subscription = \Stripe\Subscription::retrieve("sub_BerJVIlWOJNt7W");
// $subscription->cancel();



	// Charge the user card:
	$charge = \Stripe\Charge::create(array(
		"amount" => 10300,
		"currency" => "usd",
		"description" => "Product Plan Demo",
		"source" => $stripetoken,
		"metadata" => array("purchase_order_id" => "SKA123456") // Custom parameter
	));
	$chargeJson = json_decode($charge);

	if($chargeJson['amount_refunded'] == 0)
	{
		echo "Transaction completed successfully";
	}
	else
	{
		echo "Transaction has been failed";
	}
}

?>
<style>
.example.example2 button {
            display: block;
            width: calc(100% - 30px);
            height: 40px;
            margin: 40px 15px 0;
            background-color: #24b47e;
            border-radius: 4px;
            color: #fff;
            text-transform: uppercase;
            font-weight: 600;
            cursor: pointer;
        }
</style>
<form action="" class="example" method="post">
    <script
    	src="https://checkout.stripe.com/checkout.js" class="stripe-button example2"
    	data-key="pk_test_Ha7WZQkHb2XrHhsYGdwqUAQJ"
    	data-amount="200"
    	data-locale="us-en"
    	data-name="Product Plan Demo"
    	data-description="Product description ($10)"
    	data-image="https://stripe.com/img/documentation/checkout/marketplace.png"
    	data-locale="auto">
    </script>
</form>
