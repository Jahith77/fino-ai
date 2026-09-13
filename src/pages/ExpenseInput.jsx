import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ExpenseInput() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/expenses', {
        user_id: user.id,
        amount,
        category,
        date,
        note
      })
      setMessage('Expense added! ✅')
      setTimeout(() => {
        setAmount('')
        setCategory('Food')
        setNote('')
        setDate('')
        setMessage('')
      }, 800)
    } catch (err) {
      setMessage('Error: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Add Expense</h1>
      {message && <p className="mb-4 text-green-400">{message}</p>}
      <div className="bg-gray-800 p-6 rounded-xl max-w-md">
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Amount</label>
          <input type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg"
            placeholder="Enter amount" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Category</label>
          <select value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg">
            <option>Food</option>
            <option>Travel</option>
            <option>Bills</option>
            <option>Shopping</option>
            <option>Other</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Date</label>
          <input type="date" value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Note</label>
          <input type="text" value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg"
            placeholder="e.g. Zomato order" />
        </div>
        <button onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">
          Add Expense
        </button>
      </div>
    </div>
  )
}

export default ExpenseInput