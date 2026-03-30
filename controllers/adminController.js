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
  const numbers = generateNumbers()

  await supabase.from('draws').insert([{ numbers }])

  res.json({ numbers })
}