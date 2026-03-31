const supabase = require('../config/supabase')

const generateNumbers = () => {
  const nums = []
  while (nums.length < 5) {
    const n = Math.floor(Math.random() * 45) + 1
    if (!nums.includes(n)) nums.push(n)
  }
  return nums
}

exports.runDraw = async (req, res) => {
  const numbers = [1,2,3,4,5]

  const { data: drawData } = await supabase
    .from('draws')
    .insert([{ numbers }])
    .select()

  const drawId = drawData[0].id

  await supabase.from('winnings').delete().neq('id', '0')

  const { data: users } = await supabase.from('users').select('id')

  for (const user of users) {
    const { data: scores } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)
      .eq('draw_id', drawId)

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
          draw_id: drawId
        }
      ])
    }
  }

  res.json({ numbers })
}