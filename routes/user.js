const router = require('express').Router()
const { verifyUser } = require('../middlewares/auth')
const { addScore, getScores, getLatestDraw, getWinnings } = require('../controllers/userController')
router.post('/score', verifyUser, addScore)
router.get('/scores', verifyUser, getScores)
router.get('/draw/latest', verifyUser, getLatestDraw)
router.get('/winnings', verifyUser, getWinnings)
module.exports = router