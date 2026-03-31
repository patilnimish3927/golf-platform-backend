const router = require('express').Router()
const { verifyUser } = require('../middlewares/auth')
const { createOrder, webhookHandler } = require('../controllers/paymentController')

router.post('/order', verifyUser, createOrder)
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler)

module.exports = router