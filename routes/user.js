const router = require('express').Router()
const { verifyUser } = require('../middlewares/auth')
const { addScore } = require('../controllers/userController')

router.post('/score', verifyUser, addScore)

module.exports = router