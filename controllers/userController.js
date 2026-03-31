const supabase = require('../config/supabase')

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

  const { error } = await supabase.from('scores').insert([
    {
      user_id: userId,
      score,
      draw_id: drawId
    }
  ])

  if (error) return res.status(400).json(error)

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

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .eq('draw_id', drawId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return res.status(400).json(error)

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
    .order('created_at', { ascending: false })

  res.json(data)
}

exports.activateSubscription = async (req, res) => {
  const userId = req.user.id

  const { error } = await supabase
    .from('users')
    .update({ subscription_status: 'active' })
    .eq('id', userId)

  if (error) return res.status(400).json(error)

  res.json({ msg: 'Subscription activated' })
}

exports.selectCharity = async (req, res) => {
  const userId = req.user.id
  const { charity_id, percentage } = req.body

  if (percentage < 10) {
    return res.status(400).json({ msg: 'Minimum 10%' })
  }

  const { error } = await supabase
    .from('users')
    .update({
      charity_id,
      charity_percentage: percentage
    })
    .eq('id', userId)

  if (error) return res.status(400).json(error)

  res.json({ msg: 'Charity updated' })
}

exports.uploadProof = async (req, res) => {
  const userId = req.user.id
  const { proof_url, winning_id } = req.body

  const { error } = await supabase
    .from('winnings')
    .update({ proof_url })
    .eq('id', winning_id)
    .eq('user_id', userId)

  if (error) return res.status(400).json(error)

  res.json({ msg: 'Proof uploaded' })
}

exports.signup = async (req, res) => {
  const { email, password, charity_percentage } = req.body

  if (!email || !password) {
    return res.status(400).json({ msg: 'Missing fields' })
  }

  if (charity_percentage < 10) {
    return res.status(400).json({ msg: 'Minimum 10% charity required' })
  }

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        password,
        charity_percentage
      }
    ])
    .select()

  if (error) return res.status(400).json(error)

  res.json(data)
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