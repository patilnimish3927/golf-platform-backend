const supabase = require('../config/supabase')

exports.getProfile = async (req, res) => {
  const userId = req.user.id

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return res.status(400).json(error)

  res.json(data)
}

exports.addScore = async (req, res) => {
  const userId = req.user.id
  const { score } = req.body

  if (!score || score < 1 || score > 45) {
    return res.status(400).json({ msg: 'Invalid score' })
  }

  const { data: latestDraw } = await supabase
    .from('draws')
    .select('id')
    .order('draw_date', { ascending: false })
    .limit(1)

  const drawId = latestDraw[0]?.id || null

  const { data: existing } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .eq('draw_id', drawId)
    .order('created_at', { ascending: true })

  if (existing.length >= 5) {
    await supabase.from('scores').delete().eq('id', existing[0].id)
  }

  await supabase.from('scores').insert([
    { user_id: userId, score, draw_id: drawId }
  ])

  res.json({ msg: 'Score added' })
}

exports.getScores = async (req, res) => {
  const userId = req.user.id

  const { data: latestDraw } = await supabase
    .from('draws')
    .select('id')
    .order('draw_date', { ascending: false })
    .limit(1)

  const drawId = latestDraw[0]?.id || null

  const { data } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .eq('draw_id', drawId)
    .order('created_at', { ascending: false })
    .limit(5)

  res.json(data)
}

exports.getLatestDraw = async (req, res) => {
  const { data } = await supabase
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false })
    .limit(1)

  res.json(data[0] || null)
}

exports.getWinnings = async (req, res) => {
  const userId = req.user.id

  const { data } = await supabase
    .from('winnings')
    .select('*')
    .eq('user_id', userId)

  res.json(data)
}

exports.submitClaim = async (req, res) => {
  const userId = req.user.id
  const { winning_id, full_name, phone, upi_id } = req.body

  if (!winning_id || !full_name || !phone || !upi_id) {
    return res.status(400).json({ msg: 'All fields required' })
  }

  const { data: existing } = await supabase
    .from('claims')
    .select('*')
    .eq('winning_id', winning_id)
    .eq('user_id', userId)

  if (existing && existing.length > 0) {
    return res.status(400).json({ msg: 'Already claimed' })
  }

  const { data: winning } = await supabase
    .from('winnings')
    .select('*')
    .eq('id', winning_id)
    .single()

  if (!winning) {
    return res.status(404).json({ msg: 'Winning not found' })
  }

  await supabase.from('claims').insert([{
    user_id: userId,
    winning_id,
    full_name,
    phone,
    upi_id,
    amount: winning.amount,
    status: 'pending'
  }])

  await supabase
    .from('winnings')
    .update({ claim_status: 'submitted' })
    .eq('id', winning_id)

  res.json({ msg: 'Claim submitted successfully' })
}

exports.updateCharity = async (req, res) => {
  const userId = req.user.id
  const { charity_percentage } = req.body

  if (charity_percentage < 10) {
    return res.status(400).json({ msg: 'Minimum 10%' })
  }

  await supabase
    .from('users')
    .update({ charity_percentage })
    .eq('id', userId)

  res.json({ msg: 'Updated' })
}

exports.activateSubscription = async (req, res) => {
  const userId = req.user.id

  await supabase
    .from('users')
    .update({ subscription_status: 'active' })
    .eq('id', userId)

  res.json({ msg: 'Subscription activated' })
}

exports.selectCharity = async (req, res) => {
  const userId = req.user.id
  const { charity_id, percentage } = req.body

  if (percentage < 10) {
    return res.status(400).json({ msg: 'Minimum 10%' })
  }

  await supabase
    .from('users')
    .update({
      charity_id,
      charity_percentage: percentage
    })
    .eq('id', userId)

  res.json({ msg: 'Charity selected' })
}

exports.uploadProof = async (req, res) => {
  const userId = req.user.id
  const { proof_url, winning_id } = req.body

  await supabase
    .from('winnings')
    .update({ proof_url })
    .eq('id', winning_id)
    .eq('user_id', userId)

  res.json({ msg: 'Proof uploaded' })
}