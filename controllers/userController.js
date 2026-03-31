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