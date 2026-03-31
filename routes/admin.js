const router = require('express').Router()
const { verifyUser, verifyAdmin } = require('../middlewares/auth')
const { runDraw, getAllWinnings, verifyWinner } = require('../controllers/adminController')

router.post('/draw', verifyUser, verifyAdmin, runDraw)
router.get('/winnings', verifyUser, verifyAdmin, getAllWinnings)
router.post('/verify', verifyUser, verifyAdmin, verifyWinner)

module.exports = router