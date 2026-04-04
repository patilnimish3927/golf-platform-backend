const supabase = require('../config/supabase')
const Razorpay = require('razorpay')

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

const generateNumbers = () => {
  const nums = new Set()
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(nums)
}

exports.getAllWinnings = async (req, res) => {
  const { data } = await supabase
    .from('winnings')
    .select('*')
    .order('created_at', { ascending: false })

  res.json(data)
}

exports.getClaims = async (req, res) => {
  const { data } = await supabase
    .from('claims')
    .select('*')
    .order('created_at', { ascending: false })

  res.json(data)
}

exports.approveClaim = async (req, res) => {
  const { claim_id } = req.body

  const { data: claim } = await supabase
    .from('claims')
    .select('*')
    .eq('id', claim_id)
    .single()

  if (!claim) {
    return res.status(404).json({ msg: 'Claim not found' })
  }

  if (claim.status !== 'pending') {
    return res.status(400).json({ msg: 'Already processed' })
  }

  let paymentId = 'test_payment'
  let payoutSuccess = false

  try {
    if (process.env.RAZORPAY_ACCOUNT_NUMBER) {
      const payout = await razorpay.payouts.create({
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        amount: claim.amount * 100,
        currency: "INR",
        mode: "UPI",
        purpose: "payout",
        fund_account: {
          account_type: "vpa",
          vpa: {
            address: claim.upi_id
          },
          contact: {
            name: claim.full_name,
            type: "customer"
          }
        }
      })

      paymentId = payout.id
      payoutSuccess = true
    } else {
      payoutSuccess = true
    }

  } catch (err) {
    console.log('Payout error:', err.message)
    payoutSuccess = false
  }

  if (!payoutSuccess) {
    return res.status(500).json({ msg: 'Payment failed' })
  }

  await supabase
    .from('claims')
    .update({
      status: 'approved',
      payment_id: paymentId
    })
    .eq('id', claim_id)

  await supabase
    .from('winnings')
    .update({
      claim_status: 'approved'
    })
    .eq('id', claim.winning_id)

  res.json({ msg: 'Payment processed successfully' })
}

exports.rejectClaim = async (req, res) => {
  const { claim_id } = req.body

  await supabase
    .from('claims')
    .update({ status: 'rejected' })
    .eq('id', claim_id)

  res.json({ msg: 'Rejected' })
}

exports.verifyWinner = async (req, res) => {
  const { id, status } = req.body

  await supabase
    .from('winnings')
    .update({ status })
    .eq('id', id)

  res.json({ msg: 'Updated' })
}

exports.runDraw = async (req, res) => {
  // const numbers = generateNumbers()
  const numbers = [1,2,3,4,5]

  const { data: lastDraw } = await supabase
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false })
    .limit(1)

  const previousDrawId = lastDraw[0]?.id || null

  const { data: users } = await supabase
    .from('users')
    .select('id, charity_percentage, charity_id')

  const { data: newDraw } = await supabase
    .from('draws')
    .insert([{ numbers, draw_date: new Date() }])
    .select()

  const newDrawId = newDraw[0].id

  const totalPool = users.length * 99

  const jackpotPool = totalPool * 0.4
  const tier4Pool = totalPool * 0.35
  const tier3Pool = totalPool * 0.25

  const tier5 = []
  const tier4 = []
  const tier3 = []

  for (const user of users) {
    const { data: scores } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)
      .eq('draw_id', previousDrawId)

    if (!scores || scores.length === 0) continue

    const uniqueScores = [...new Set(scores.map(s => s.score))]
    const matches = uniqueScores.filter(n => numbers.includes(n)).length

    if (matches === 5) tier5.push(user)
    else if (matches === 4) tier4.push(user)
    else if (matches === 3) tier3.push(user)
  }

  const distribute = async (usersArr, pool, match) => {
    if (usersArr.length === 0) return

    const amount = pool / usersArr.length

    for (const user of usersArr) {
      const charityAmount = amount * (user.charity_percentage / 100)

      await supabase.from('winnings').insert([{
        user_id: user.id,
        match_count: match,
        amount,
        status: 'pending',
        draw_id: newDrawId,
        charity_amount: charityAmount,
        claim_status: 'not_claimed'
      }])
    }
  }

  await distribute(tier5, jackpotPool, 5)
  await distribute(tier4, tier4Pool, 4)
  await distribute(tier3, tier3Pool, 3)

  res.json({ numbers })
}