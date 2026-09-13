import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts'
import {
  Wallet, Calendar, Sparkles, BarChart3, Plus,
  AlertTriangle, Lightbulb, Bot
} from 'lucide-react'

const COLORS = ['#38bdf8', '#818cf8', '#fbbf24', '#fb7185', '#a78bfa', '#34d399']

const formatCurrency = (num) =>
  `₹${Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-sky-400 font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

const StatCard = ({ icon: Icon, title, value, sub, accent }) => (
  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-6">
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-400">{title}</p>
      <div className={`p-2 rounded-lg ${accent.bg}`}>
        <Icon size={16} className={accent.text} />
      </div>
    </div>
    <h2 className="text-2xl font-semibold text-white mt-2">{value}</h2>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
)

function Dashboard() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [monthTotal, setMonthTotal] = useState(0)
  const [categoryData, setCategoryData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [prediction, setPrediction] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState(false)

  const topCategory = categoryData.length > 0
    ? categoryData.reduce((a, b) => a.value > b.value ? a : b)
    : null
  const avgDaily = trendData.length > 0
    ? (trendData.reduce((s, d) => s + d.amount, 0) / trendData.length).toFixed(0)
    : 0

  useEffect(() => { if (user) fetchExpenses() }, [user])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:5000/api/expenses/${user.id}`)
      const data = res.data.expenses

      setExpenses(data)

      const totalAmount = data.reduce((sum, e) => sum + parseFloat(e.amount), 0)
      setTotal(totalAmount)

      const thisMonth = new Date().getMonth()
      const monthAmount = data
        .filter(e => new Date(e.date).getMonth() === thisMonth)
        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
      setMonthTotal(monthAmount)

      const catMap = {}
      data.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + parseFloat(e.amount) })
      setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })))

      const dateMap = {}
      data.forEach(e => {
        const day = e.date?.slice(0, 10)
        dateMap[day] = (dateMap[day] || 0) + parseFloat(e.amount)
      })
      setTrendData(Object.entries(dateMap).sort().map(([date, amount]) => ({ date, amount: parseFloat(amount.toFixed(2)) })))

      if (data.length >= 3) fetchMLInsights(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMLInsights = async (data) => {
    setMlLoading(true)
    setMlError(false)
    try {
      const predRes = await axios.post('http://localhost:8000/predict', { user_id: user.id, expenses: data })
      setPrediction(predRes.data)

      const anomalyRes = await axios.post('http://localhost:8000/anomalies', { user_id: user.id, expenses: data })
      setAnomalies(anomalyRes.data.anomalies || [])

      const suggestRes = await axios.post('http://localhost:8000/suggestions', { user_id: user.id, expenses: data })
      setSuggestions(suggestRes.data.suggestions || [])
    } catch (err) {
      setMlError(true)
      const monthlyAvg = data.reduce((s, e) => s + parseFloat(e.amount), 0)
      setPrediction({ total_predicted: (monthlyAvg * 1.05).toFixed(2), confidence: 0.72 })
      setSuggestions([
        'Consider reducing your top spending category.',
        'Set a weekly budget alert to stay on track.',
        'Your spending trends suggest weekend peaks — plan ahead.'
      ])
    } finally {
      setMlLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Financial Overview</h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, {user?.firstName || 'there'} — your spending snapshot.
            </p>
          </div>
          <button
            onClick={() => navigate('/expense')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 transition-colors text-slate-950 font-medium text-sm"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            icon={Wallet}
            title="Total Spent"
            value={loading ? '—' : formatCurrency(total)}
            sub="All time"
            accent={{ bg: 'bg-sky-500/10', text: 'text-sky-400' }}
          />
          <StatCard
            icon={Calendar}
            title="This Month"
            value={loading ? '—' : formatCurrency(monthTotal)}
            sub={new Date().toLocaleString('default', { month: 'long' })}
            accent={{ bg: 'bg-indigo-500/10', text: 'text-indigo-400' }}
          />
          <StatCard
            icon={Sparkles}
            title="AI Prediction"
            value={mlLoading ? '...' : prediction ? formatCurrency(prediction.total_predicted) : '—'}
            sub={prediction ? `${Math.round((prediction.confidence || 0.72) * 100)}% confidence` : 'Need 3+ expenses'}
            accent={{ bg: 'bg-violet-500/10', text: 'text-violet-400' }}
          />
          <StatCard
            icon={BarChart3}
            title="Daily Avg"
            value={formatCurrency(avgDaily)}
            sub={topCategory ? `Top: ${topCategory.name}` : 'No data yet'}
            accent={{ bg: 'bg-amber-500/10', text: 'text-amber-400' }}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">By Category</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), '']}
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">
                Add expenses to see breakdown
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Spending Trend</h2>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="#38bdf8" strokeWidth={2} fill="url(#grad)" dot={{ fill: '#38bdf8', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">
                No trend data yet
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Expenses */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-white">Recent Expenses</h2>
              <span className="text-xs text-slate-500">{expenses.length} total</span>
            </div>

            {anomalies.length > 0 && anomalies.slice(0, 2).map((a, i) => (
              <div key={i} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-400 text-sm font-medium">
                    Anomaly: {a.category} — {formatCurrency(a.amount)}
                  </p>
                  <p className="text-slate-500 text-xs">Unusual spending on {a.date?.slice(0, 10)}</p>
                </div>
              </div>
            ))}

            {expenses.length === 0 ? (
              <p className="text-slate-500 text-sm">No expenses yet!</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {expenses.slice(0, 8).map((e, i) => (
                  <div key={e.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div>
                        <p className="text-sm font-medium text-white">{e.category}</p>
                        <p className="text-xs text-slate-500">{e.note || '—'} · {e.date?.slice(0, 10)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-sky-400">{formatCurrency(e.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Panel */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg font-medium text-white">AI Insights</h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Bot size={10} />
                ML Active
              </span>
            </div>

            {prediction && (
              <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl px-4 py-4 mb-5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Next Month Forecast</p>
                <p className="text-3xl font-semibold text-sky-400">
                  {formatCurrency(prediction.total_predicted)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {Math.round((prediction.confidence || 0.72) * 100)}% model confidence
                </p>
              </div>
            )}

            {mlLoading && (
              <div className="space-y-3">
                <div className="h-20 bg-slate-800/60 rounded-xl animate-pulse" />
                <div className="h-11 bg-slate-800/60 rounded-xl animate-pulse" />
                <div className="h-11 bg-slate-800/60 rounded-xl animate-pulse" />
              </div>
            )}

            {suggestions.length > 0 && (
              <>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Smart Suggestions</p>
                <div className="divide-y divide-slate-800">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex gap-3 py-3 text-sm text-slate-300">
                      <Lightbulb size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{typeof s === 'string' ? s : s.message || s.text || JSON.stringify(s)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!mlLoading && !prediction && expenses.length < 3 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Bot size={28} className="mx-auto mb-2 text-slate-600" />
                <p>Add at least 3 expenses<br />to unlock AI predictions</p>
              </div>
            )}

            {mlError && (
              <p className="text-xs text-amber-400/80 mt-3">
                ⚠️ ML service offline — showing estimates
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard