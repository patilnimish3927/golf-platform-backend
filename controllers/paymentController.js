const razorpay = require('../config/razorpay')

exports.createOrder = async (req, res) => {
  const { amount } = req.body

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR'
  })

  res.json(order)
}