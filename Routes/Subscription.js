const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const router = express.Router()
const joi = require('joi')
const BaseUrl = "https://stripe-payment.herokuapp.com"
router.post('/create-checkout-session', async (req, res) => {
    const value = joi.object({
        lookup_key: joi.string().required(),
        autoRenew: joi.boolean().required()
    }).validate(req.body)

    if (value.error) {
        console.log('type error ' + value.error.message)
        return res.status(400).json({ success: false, error: value.error.message })
    }

    const { lookup_key, autoRenew } = req.body;
    let plan;

    // Fetch the price information from Stripe
    try {
        const price = await stripe.prices.retrieve(lookup_key);

        // Fetch the plan information from Stripe

        if (autoRenew || autoRenew === "true") {

            const planData = await stripe.plans.retrieve(price.id);
            plan = planData;

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],

                subscription_data: {
                    items: [{
                        plan: plan.id,
                    }],
                },
                success_url: `${BaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,

                cancel_url: `${BaseUrl}/cancel`
            });

            res.json({ sessionId: session.id });
        } else if (!autoRenew || autoRenew === "false") {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: price.id,
                        quantity: 1,

                    },

                ],
                mode: 'payment',

                success_url: `${BaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,

                cancel_url: `${BaseUrl}/cancel`
            });

            res.json({ sessionId: session.id });
        }
        else {
            console.log("auto renew is not set")
            return res.status(400).json({ success: false, error: "Auto renew is not set" })
        }
    } catch (err) {
        console.log("Error " + err.message)
        return res.status(500).json({ success: false, error: err.message });
    }

});


router.get('/success', (req, res) => {
    res.json({ success: true, message: "Payment Successful", session_id: req.query.session_id })
})

router.get('/cancel', (req, res) => {
    res.json({ success: false, message: "Payment Cancelled" })
})

module.exports = router

