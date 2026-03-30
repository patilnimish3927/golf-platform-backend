const router = require('express').Router()
const { verifyUser } = require('../middlewares/auth')
const { addScore, getScores } = require('../controllers/userController')
router.post('/score', verifyUser, addScore)
router.get('/scores', verifyUser, getScores)
module.exports = router