const supabase = require('../config/supabase')

const generateNumbers = () => {
  const nums = new Set()
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1)
  }
  return [...nums]
}

exports.runDraw = async (req, res) => {
  const numbers = generateNumbers()

  const { data: subs } = await supabase.from('subscriptions').select('*').eq('status', 'active')

  const totalPool = subs.length * 99

  const jackpotPool = totalPool * 0.4
  const tier4Pool = totalPool * 0.35
  const tier3Pool = totalPool * 0.25

  const { data: prevDraw } = await supabase
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false })
    .limit(1)

  const previousDrawId = prevDraw[0]?.id || null

  const { data: users } = await supabase.from('users').select('*')

  const { data: newDraw } = await supabase
    .from('draws')
    .insert([{ numbers, jackpot: jackpotPool }])
    .select()

  const drawId = newDraw[0].id

  let tier5 = []
  let tier4 = []
  let tier3 = []

  for (const user of users) {
    const { data: scores } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)
      .eq('draw_id', previousDrawId)

    if (!scores || scores.length === 0) continue

    const unique = [...new Set(scores.map(s => s.score))]
    const matches = unique.filter(n => numbers.includes(n)).length

    if (matches === 5) tier5.push(user)
    if (matches === 4) tier4.push(user)
    if (matches === 3) tier3.push(user)
  }

  const distribute = async (arr, pool, match) => {
    if (arr.length === 0) return

    const amount = pool / arr.length

    for (const user of arr) {
      const charity = (amount * (user.charity_percentage || 10)) / 100

      await supabase.from('winnings').insert([{
        user_id: user.id,
        match_count: match,
        amount,
        charity_amount: charity,
        status: 'pending',
        draw_id: drawId
      }])

      if (user.charity_id) {
        await supabase.rpc('increment_charity', {
          charity_id_input: user.charity_id,
          amount_input: charity
        })
      }
    }
  }

  await distribute(tier5, jackpotPool, 5)
  await distribute(tier4, tier4Pool, 4)
  await distribute(tier3, tier3Pool, 3)

  res.json({ numbers })
}

exports.getAllWinnings = async (req, res) => {
  const { data } = await supabase.from('winnings').select('*')
  res.json(data)
}

exports.verifyWinner = async (req, res) => {
  const { id, status } = req.body
  await supabase.from('winnings').update({ status }).eq('id', id)
  res.json({ msg: 'updated' })
}