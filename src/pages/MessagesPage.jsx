import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Avatar, Spinner } from '@/components/ui'
import { timeAgo, modeConfig } from '@/lib/utils'
import { MOCK_CONVERSATIONS } from '@/lib/mockData'

export default function MessagesPage() {
  const { user, profile } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')

  // Load conversations
  useEffect(() => {
    if (isDemo) {
      setConversations(MOCK_CONVERSATIONS)
      const convId = searchParams.get('conv')
      if (convId) {
        const c = MOCK_CONVERSATIONS.find(c => c.id === convId)
        if (c) openConv(c)
      }
      setLoading(false)
      return
    }
    const load = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*, books(title, mode), profiles!buyer_id(prenom, avatar_url)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      setConversations(data || [])
      const convId = searchParams.get('conv')
      if (convId && data) {
        const c = data.find(c => c.id === convId)
        if (c) openConv(c)
      }
      setLoading(false)
    }
    load()
  }, [user.id])

  const openConv = async (conv) => {
    setActiveConv(conv)
    if (isDemo) {
      setMessages(conv.messages || [])
      return
    }
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    // Mark as read
    await supabase.from('messages')
      .update({ read: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', user.id)
    // Subscribe realtime
    const channel = supabase.channel(`conv-${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        payload => setMessages(prev => [...prev, payload.new])
      ).subscribe()
    return () => supabase.removeChannel(channel)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !activeConv) return
    const text = input.trim()
    setInput('')
    if (isDemo) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), sender_id: 'me', content: text,
        created_at: new Date().toISOString(), read: false
      }])
      return
    }
    await supabase.from('messages').insert({
      conversation_id: activeConv.id, sender_id: user.id, content: text
    })
  }

  const unreadCount = (conv) => {
    if (isDemo) return conv.messages?.filter(m => !m.read && m.sender_id !== 'me').length || 0
    return 0
  }

  // Conversation list
  if (!activeConv) return (
    <div className="pb-safe">
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <h1 className="text-xl font-bold text-ink">Messages</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner className="w-5 h-5 text-accent" /></div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="font-medium">Aucun message</p>
          <p className="text-sm mt-1">Vos conversations apparaîtront ici</p>
        </div>
      ) : (
        <div>
          {conversations.map(conv => {
            const other = conv.profiles
            const lastMsg = conv.messages?.[conv.messages.length - 1] || {}
            const unread = unreadCount(conv)
            return (
              <button key={conv.id} onClick={() => openConv(conv)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border hover:bg-surface transition-colors text-left">
                <Avatar name={other?.prenom || '?'} src={other?.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-ink">{other?.prenom}</span>
                    <span className="text-xs text-muted">{lastMsg.created_at ? timeAgo(lastMsg.created_at) : ''}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 line-clamp-1">{conv.books?.title}</p>
                  <p className="text-xs text-muted line-clamp-1 mt-0.5">{lastMsg.content}</p>
                </div>
                {unread > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // Active conversation
  const other = activeConv.profiles

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white flex-shrink-0">
        <button onClick={() => setActiveConv(null)} className="p-1 -ml-1 text-ink">
          <ArrowLeft size={20} />
        </button>
        <Avatar name={other?.prenom || '?'} src={other?.avatar_url} size="sm" />
        <div>
          <p className="font-semibold text-sm text-ink leading-tight">{other?.prenom}</p>
          <p className="text-xs text-muted">{activeConv.books?.title}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface">
        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id || msg.sender_id === 'me'
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                ${isMe
                  ? 'bg-accent text-white rounded-br-sm'
                  : 'bg-white text-ink border border-border rounded-bl-sm'
                }`}>
                {msg.content}
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60 text-right' : 'text-muted'}`}>
                  {timeAgo(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-border bg-white" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Votre message…"
          rows={1}
          className="flex-1 resize-none bg-surface border border-border rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-colors max-h-28 overflow-y-auto"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
