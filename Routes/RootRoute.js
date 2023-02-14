const express = require('express')
const router = express.Router()

router.use('/', require('./Subscription'))
router.use('/', require('./StripeConnect'))
module.exports = router

