const razorpay = require('../config/razorpay')
const crypto = require('crypto')
const supabase = require('../config/supabase')

exports.createOrder = async (req, res) => {
  const { amount } = req.body

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR'
  })

  res.json(order)
}

exports.webhookHandler = async (req, res) => {
  const secret = 'golf_secret_123'

  const signature = req.headers['x-razorpay-signature']

  const body = req.body

  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return res.status(400).send('Invalid signature')
  }

  const event = JSON.parse(body.toString())

  if (event.event === 'payment.captured') {
    const email = event.payload.payment.entity.email

    await supabase
      .from('users')
      .update({ subscription_status: 'active' })
      .eq('email', email)
  }

  res.json({ status: 'ok' })
}