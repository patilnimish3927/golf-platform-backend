const supabase = require('../config/supabase')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

exports.signup = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ msg: 'Missing fields' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ msg: 'Invalid email format' })
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters' })
  }

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (existing) {
    return res.status(400).json({ msg: 'User already exists' })
  }

  const hashed = await bcrypt.hash(password, 10)

  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password: hashed, role: 'user', subscription_status: 'inactive' }])
    .select()

  if (error) return res.status(400).json(error)

  res.json(data)
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!isValidEmail(email)) {
    return res.status(400).json({ msg: 'Invalid email' })
  }

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