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

  const numbers = generateNumbers()

  const { error } = await supabase
    .from('draws')
    .insert([{ numbers }])

  if (error) return res.status(400).json(error)

  res.json({ numbers })
}