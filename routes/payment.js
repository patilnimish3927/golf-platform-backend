const router = require('express').Router()
const { verifyUser } = require('../middlewares/auth')
const { createOrder } = require('../controllers/paymentController')

router.post('/order', verifyUser, createOrder)

module.exports = router