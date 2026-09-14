const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()
const pool = require('./db')
const { GoogleGenAI } = require('@google/genai')

const app = express()
const PORT = process.env.PORT || 5000
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

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

// AI Chat Assistant route
app.post('/api/chat', async (req, res) => {
  const { user_id, message } = req.body

  if (!user_id || !message) {
    return res.status(400).json({ error: 'user_id and message are required' })
  }

  try {
    // Fetch the user's expenses to give the AI context
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
      [user_id]
    )
    const expenses = result.rows

    // Build a compact summary instead of sending every raw row
    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
    const categoryTotals = {}
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount)
    })

    const expenseSummary = expenses
      .slice(0, 100) // cap to keep prompt size reasonable
      .map(e => `${e.date?.toString().slice(0, 10)} | ${e.category} | ₹${e.amount} | ${e.note || ''}`)
      .join('\n')

    const prompt = `You are a helpful personal finance assistant inside an expense tracking app called FINO AI.
Answer the user's question using ONLY the expense data provided below. Be concise, friendly, and use ₹ for currency.
If the data doesn't contain enough information to answer, say so honestly instead of guessing.

Total spending: ₹${totalSpent.toFixed(2)}
Category totals: ${JSON.stringify(categoryTotals)}

Recent expenses (date | category | amount | note):
${expenseSummary}

User question: ${message}`

    const result2 = await genAI.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    })
    const reply = result2.text

    res.json({ reply })
  } catch (err) {
    console.error('Chat error:', err.message)
    res.status(500).json({ error: 'Failed to get a response from the AI assistant.' })
  }
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})