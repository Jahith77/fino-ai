import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

export default function ChatWidget() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! Ask me anything about your spending — like \"How much did I spend on food last month?\"" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  const handleSend = async () => {
    if (!input.trim() || !user) return

    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`${API_URL}/api/chat`, {
        user_id: user.id,
        message: userMessage
      })
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't get an answer right now. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/30 flex items-center justify-center z-50"
        >
          <MessageCircle size={24} className="text-slate-950" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-full sm:max-w-sm h-[70vh] max-h-[500px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-sky-400" />
              <span className="text-sm font-medium text-white">FINO Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-sky-400" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  {m.text}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} className="text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-sky-400" />
                </div>
                <div className="bg-slate-800 text-slate-400 rounded-xl px-3 py-2 text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your spending..."
              className="flex-1 bg-slate-800/60 border border-slate-700 focus:border-sky-500 outline-none text-white text-sm px-3 py-2 rounded-xl transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
            >
              <Send size={16} className="text-slate-950" />
            </button>
          </div>

        </div>
      )}
    </>
  )
}