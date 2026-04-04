const razorpay = require('../config/razorpay')
const crypto = require('crypto')
const supabase = require('../config/supabase')

exports.createOrder = async (req, res) => {
  const { amount, plan } = req.body
  const userId = req.user.id

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    notes: {
      user_id: userId,
      plan
    }
  })

  res.json(order)
}

exports.webhookHandler = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  const signature = req.headers['x-razorpay-signature']

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex')

  if (signature !== expected) {
    return res.status(400).send('Invalid signature')
  }

  const event = JSON.parse(req.body.toString())

  if (event.event === 'payment.captured') {
    const userId = event.payload.payment.entity.notes.user_id
    const plan = event.payload.payment.entity.notes.plan

    const start = new Date()
    const end = new Date()

    if (plan === 'yearly') end.setFullYear(end.getFullYear() + 1)
    else end.setMonth(end.getMonth() + 1)

    await supabase.from('subscriptions').insert([{
      user_id: userId,
      plan,
      status: 'active',
      start_date: start,
      end_date: end
    }])

    await supabase
      .from('users')
      .update({ subscription_status: 'active' })
      .eq('id', userId)
  }

  res.json({ status: 'ok' })
}