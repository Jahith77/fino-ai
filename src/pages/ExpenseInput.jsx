import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Wallet, Tag, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

function ExpenseInput() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' | 'error'
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await axios.post(`${API_URL}/api/expenses`, {
        user_id: user.id,
        amount,
        category,
        date,
        note
      })
      setMessage('Expense added successfully!')
      setMessageType('success')
      setTimeout(() => {
        setAmount('')
        setCategory('Food')
        setNote('')
        setDate('')
        setMessage('')
      }, 1000)
    } catch (err) {
      setMessage('Error: ' + err.message)
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Add Expense</h1>
          <p className="text-slate-400 text-sm mt-1">Log a new transaction to track your spending.</p>
        </div>

        {message && (
          <div className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm border ${
            messageType === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {messageType === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {message}
          </div>
        )}

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 space-y-5">

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Wallet size={14} />
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 focus:border-sky-500 outline-none text-white p-3 rounded-xl transition-colors"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Tag size={14} />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 focus:border-sky-500 outline-none text-white p-3 rounded-xl transition-colors"
            >
              <option>Food</option>
              <option>Travel</option>
              <option>Bills</option>
              <option>Shopping</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Calendar size={14} />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 focus:border-sky-500 outline-none text-white p-3 rounded-xl transition-colors"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <FileText size={14} />
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 focus:border-sky-500 outline-none text-white p-3 rounded-xl transition-colors"
              placeholder="e.g. Zomato order"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-950 font-semibold py-3 rounded-xl"
          >
            {submitting ? 'Adding...' : 'Add Expense'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default ExpenseInput