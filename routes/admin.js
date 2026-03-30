const router = require('express').Router()
const { verifyUser, verifyAdmin } = require('../middlewares/auth')
const { runDraw } = require('../controllers/adminController')

router.post('/draw', verifyUser, verifyAdmin, runDraw)

module.exports = router