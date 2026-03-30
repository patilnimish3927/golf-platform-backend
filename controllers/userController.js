const supabase = require('../config/supabase')

exports.addScore = async (req, res) => {
  const userId = req.user.id
  const { score } = req.body

  const { data } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (data.length >= 5) {
    const oldest = data[0]
    await supabase.from('scores').delete().eq('id', oldest.id)
  }

  await supabase.from('scores').insert([{ user_id: userId, score }])

  res.json({ msg: 'Score added' })
}