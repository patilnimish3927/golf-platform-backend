const supabase = require('../config/supabase')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

exports.signup = async (req, res) => {
  const { email, password } = req.body

  const hashed = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password: hashed }])
    .select()

  if (error) return res.status(400).json(error)

  res.json(data)
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (!data) return res.status(404).json({ msg: 'User not found' })

  const match = await bcrypt.compare(password, data.password)
  if (!match) return res.status(401).json({ msg: 'Invalid credentials' })

  const token = jwt.sign({ id: data.id, role: data.role }, process.env.JWT_SECRET)

  res.json({ token, role: data.role })
}