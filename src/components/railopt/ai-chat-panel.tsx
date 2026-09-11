'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, X, Sparkles, User, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  'What blocks are at risk of conflict?',
  'Best window for engineering work on NDLS-AGC?',
  'Explain the approval workflow',
  'How can we reduce train disruptions?',
]

export function AiChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `chat-${Date.now()}`)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text.trim() }),
      })
      const data = await res.json()

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.response || data.error || 'No response',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      toast.error('Failed to get response')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = async () => {
    try {
      await fetch(`/api/chat?sessionId=${sessionId}`, { method: 'DELETE' })
    } catch {
      // ignore
    }
    setMessages([])
    toast.success('Chat cleared')
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border relative">
      {/* Subtle gradient border on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#1a237e]/40 via-[#3f51b5]/20 to-transparent pointer-events-none z-10" />

      {/* Header - frosted glass */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#283593] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
            <p className="text-[10px] text-muted-foreground">
              {messages.length > 0 ? `${messages.length} messages` : 'Ask about block planning'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={clearChat}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a237e]/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#1a237e]" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">RailOpt AI Assistant</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expert in Indian Railways block planning &amp; optimization
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-[260px]">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs p-2.5 rounded-lg border border-border hover:border-[#1a237e]/30 hover:bg-[#1a237e]/5 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`flex gap-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-[#1a237e]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-[#283593]" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-6 h-6 rounded-full bg-[#1a237e]/10 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-[#283593]" />
            </div>
            <div className="bg-muted rounded-xl px-3 py-2 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-muted-foreground/60 typing-dot-1" />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 typing-dot-2" />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 typing-dot-3" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage(input)
          }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about block planning..."
            className="flex-1 h-9 text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 w-9 p-0 bg-[#283593] hover:bg-[#0d47a1] text-white shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
