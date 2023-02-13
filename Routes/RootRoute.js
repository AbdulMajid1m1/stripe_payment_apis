const express = require('express')
const router = express.Router()

router.use('/', require('./Subscription'))
module.exports = router

