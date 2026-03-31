const supabase = require('../config/supabase')

exports.runDraw = async (req, res) => {
  const numbers = [1,2,3,4,5]

  const { data: lastDraw } = await supabase
    .from('draws')
    .select('id')
    .order('draw_date', { ascending: false })
    .limit(1)

  const previousDrawId = lastDraw[0]?.id || null

  const { data: users } = await supabase.from('users').select('id')

  const { data: newDraw } = await supabase
    .from('draws')
    .insert([{ numbers }])
    .select()

  const newDrawId = newDraw[0].id

  for (const user of users) {
    const { data: scores } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)
      .eq('draw_id', previousDrawId)

    if (!scores || scores.length === 0) continue

    const uniqueScores = [...new Set(scores.map(s => s.score))]
    const matches = uniqueScores.filter(n => numbers.includes(n)).length

    if (matches >= 3) {
      await supabase.from('winnings').insert([
        {
          user_id: user.id,
          match_count: matches,
          amount: 0,
          status: 'pending',
          draw_id: newDrawId
        }
      ])
    }
  }

  res.json({ numbers })
}