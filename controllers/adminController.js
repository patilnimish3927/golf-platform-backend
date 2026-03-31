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
  const generateNumbers = () => {
    const nums = []
    while (nums.length < 5) {
      const n = Math.floor(Math.random() * 45) + 1
      if (!nums.includes(n)) nums.push(n)
    }
    return nums
  }

  const numbers = [1,2,3,4,5]
  // const numbers = generateNumbers()

  const { data: drawData } = await supabase
    .from('draws')
    .insert([{ numbers }])
    .select()

  const drawId = drawData[0].id

  const { data: users } = await supabase.from('users').select('id')

  for (const user of users) {
    const { data: scores } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)

    const userScores = scores.map(s => s.score)

    const matches = userScores.filter(s => numbers.includes(s)).length

    if (matches >= 3) {
      await supabase.from('winnings').insert([
        {
          user_id: user.id,
          match_count: matches,
          amount: 0,
          status: 'pending'
        }
      ])
    }
  }

  res.json({ numbers })
}