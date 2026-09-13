const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()
const pool = require('./db')

const app = express()
const PORT = process.env.PORT || 5000
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173']
}))
app.use(express.json())

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Quick AI Backend is running! 🚀' })
})

// Save expense
app.post('/api/expenses', async (req, res) => {
  const { user_id, amount, category, note, date } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO expenses (user_id, amount, category, note, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, amount, category, note, date]
    )
    res.json({ success: true, expense: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all expenses for a user
app.get('/api/expenses/:user_id', async (req, res) => {
  const { user_id } = req.params
  try {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
      [user_id]
    )
    res.json({ expenses: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ML Analysis route
app.post('/api/analyze', async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/analyze`, req.body)
    res.json(response.data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})