const router = require('express').Router()
const { verifyUser, verifyAdmin } = require('../middlewares/auth')

const {
  runDraw,
  getAllWinnings,
  verifyWinner,
  getClaims,
  approveClaim,
  rejectClaim
} = require('../controllers/adminController')

router.post('/draw', verifyUser, verifyAdmin, runDraw)
router.get('/winnings', verifyUser, verifyAdmin, getAllWinnings)
router.post('/verify', verifyUser, verifyAdmin, verifyWinner)

router.get('/claims', verifyUser, verifyAdmin, getClaims)
router.post('/claim/approve', verifyUser, verifyAdmin, approveClaim)
router.post('/claim/reject', verifyUser, verifyAdmin, rejectClaim)

module.exports = router