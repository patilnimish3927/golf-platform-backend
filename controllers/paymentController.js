const razorpay = require('../config/razorpay')
const supabase = require('../config/supabase')
const crypto = require('crypto')

exports.createOrder = async (req, res) => {
  const { plan } = req.body

  const amount = plan === 'yearly' ? 99900 : 9900

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR'
  })

  await supabase.from('payments').insert([{
    user_id: req.user.id,
    amount,
    status: 'created',
    order_id: order.id
  }])

  res.json(order)
}

exports.webhookHandler = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET

  const signature = req.headers['x-razorpay-signature']

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex')

  if (expected !== signature) return res.status(400).send('Invalid')

  const event = JSON.parse(req.body.toString())

  if (event.event === 'payment.captured') {
    const orderId = event.payload.payment.entity.order_id

    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    await supabase.from('payments').update({
      status: 'paid',
      payment_id: event.payload.payment.entity.id
    }).eq('order_id', orderId)

    await supabase.from('subscriptions').insert([{
      user_id: data.user_id,
      status: 'active',
      plan: 'monthly',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 86400000)
    }])

    await supabase.from('users')
      .update({ subscription_status: 'active' })
      .eq('id', data.user_id)
  }

  res.json({ ok: true })
}