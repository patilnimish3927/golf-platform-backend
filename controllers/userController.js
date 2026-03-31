const supabase = require('../config/supabase')

exports.addScore = async (req, res) => {
  const userId = req.user.id
  const { score } = req.body

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
    .order('created_at', { ascending: true })

  if (data.length >= 5) {
    const oldest = data[0]
    await supabase.from('scores').delete().eq('id', oldest.id)
  }

  await supabase.from('scores').insert([
    {
      user_id: userId,
      score,
      draw_id: drawId
    }
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
  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false })
    .limit(1)

  if (error) return res.status(400).json(error)

  res.json(data[0])
}

exports.getWinnings = async (req, res) => {
  const userId = req.user.id

  const { data, error } = await supabase
    .from('winnings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json(error)

  res.json(data)
}