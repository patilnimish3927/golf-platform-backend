const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const adminRoutes = require('./routes/admin')
const paymentRoutes = require('./routes/payment')

const app = express()

app.use(cors())
app.use((req, res, next) => {
  if (req.originalUrl === '/payment/webhook') {
    next()
  } else {
    express.json()(req, res, next)
  }
})
app.use('/payment', paymentRoutes)
app.use('/auth', authRoutes)
app.use('/user', userRoutes)
app.use('/admin', adminRoutes)

app.listen(process.env.PORT, () => console.log('Server running'))