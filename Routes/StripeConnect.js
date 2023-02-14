const express = require('express');
const Joi = require('joi');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const router = express.Router()
// const BaseUrl = 'http://localhost:9000'
const BaseUrl = "https://stripe-payment.herokuapp.com"
router.post("/connect-account", async (req, res) => {
    const value = Joi.object({
        email: Joi.string().email().required(),
    }).validate(req.body);
    if (value.error) {
        return res.status(400).json({
            error: value.error.message,
        });
    }
    try {
        const account = await stripe.accounts.create({
            type: "express",
            country: "US",
            email: req.body.email,
        });
        // The Stripe account ID for the connected account. save this in your database to send payouts to this account.
        console.log('User accoutID ' + account.id);

        const accountLinks = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${BaseUrl}/connect-account/refresh`, // The URL you provide to redirect the user to if they decide to refresh or revisit the link.
            return_url: `${BaseUrl}/connect-account/success`, // The URL you provide to redirect the user to after they have successfully completed the onboarding flow.
            type: "account_onboarding",
        });
        console.log(accountLinks.url)
        res.status(200).json({
            url: accountLinks.url,
        });
    } catch (error) {
        res.status(500).send({
            error: error.message,
        });
    }
});

router.get("/connect-account/success", async (req, res) => {
    try {
        res.status(500).json({
            message: "Account connected successfully",
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});

router.get("/connect-account/refresh", async (req, res) => {
    try {
        res.status(500).json({
            message: "something went wrong",
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
});

router.post("/send-payout", async (req, res) => {
    try {
        const transfer = await stripe.transfers.create({
            amount: req.body.amount,
            currency: "usd",
            destination: req.body.accountId,
        });
        if (!transfer) {
            return res.status(500).json({
                error: "Something went wrong",
            });
        }
        res.status(200).json({
            success: true,
            message: "Payout sent successfully",

        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: error.message,
        });
    }
});






router.post("/charge-customer", async (req, res) => {
    try {
        const customer = await stripe.customers.create();
        const paymentIntent = await stripe.paymentIntents.create({
            customer: customer.id,
            setup_future_usage: 'off_session',
            amount: 1099,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
        });
        if (!paymentIntent) {
            return res.status(500).json({
                success: false,
                error: "Something went wrong",
            });
        }
        res.status(200).json({
            success: true,
            message: "Payment intent created successfully",
            client_secret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: error.message,
        });
    }
});
router.post("/charge/new-customer", async (req, res) => {
    try {
        const customer = await stripe.customers.create({
            email: 'majid123@example.com',
            source: req.body.token,
            amount: req.body.amount,
        });
        if (!customer) {
            return res.status(500).json({
                success: false,
                error: "Something went wrong",
            });
        }

        // Charge the customer
        const charge = await stripe.charges.create({
            amount: req.body.amount * 100, // Amount in cents
            currency: 'usd',
            customer: customer.id,
        });

        // Get the payment method ID for future charges
        const paymentMethodId = customer.default_source;

        res.status(200).json({
            success: true,
            message: "Payment intent created successfully",
            client_secret: paymentMethodId,
            customerId: customer.id
        });

        //pid = "card_1MbKBcGVj1b6RabbPRIc96i7"
        // cid = "cus_NM2GRCEfo3W1on"

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

router.post("/charge/verified-customer", async (req, res) => {
    try {
        const customerId = req.body.customerId;
        const paymentMethodId = req.body.paymentMethodId;
        const amount = req.body.amount;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: 'usd',
            payment_method: paymentMethodId,
            customer: customerId,
            confirm: true
        });

        res.status(200).json({
            success: true,
            message: "Payment succeeded",
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


module.exports = router;