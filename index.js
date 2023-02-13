const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors');
const PORT = process.env.PORT || 9000
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(cors({
    origin: '*'
}))
app.use(bodyParser.json())

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.get('/', (req, res) => {
    res.json({ success: true, message: "Api is working" })
})

app.use('/', require('./Routes/RootRoute'))



app.listen(PORT, (req, res) => {
    console.log(`Server is running on port ${PORT}`)
})