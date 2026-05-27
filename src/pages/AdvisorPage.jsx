import { useState, useRef, useEffect } from 'react'
import { Send, BookOpen, Sparkles, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { formatPrice, modeConfig } from '@/lib/utils'
import { BookPlaceholder } from '@/components/ui'
import { getImageUrl } from '@/lib/supabase'

function InlineBookCard({ book }) {
  const mc = modeConfig[book.mode]
  const img = book.images?.[0] ? getImageUrl(book.images[0]) : null
  return (
    <Link to={`/livre/${book.id}`} className="flex items-center gap-3 bg-white border border-border rounded-lg p-3 hover:border-accent transition-colors mt-2">
      <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-surface">
        {img ? <img src={img} alt={book.title} className="w-full h-full object-cover" /> : <BookPlaceholder title={book.title} className="w-full h-full" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink line-clamp-1">{book.title}</p>
        <p className="text-xs text-muted mt-0.5">{book.author}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${mc?.color}`}>{mc?.label}</span>
          <span className="text-xs font-bold text-ink">{formatPrice(book.price, book.mode)}</span>
        </div>
      </div>
      <span className="text-accent text-xs font-medium flex-shrink-0">Voir →</span>
    </Link>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
          <BookOpen size={14} className="text-accent" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? '' : 'flex-1'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${isUser ? 'bg-accent text-white rounded-br-sm' : 'bg-white border border-border text-ink rounded-bl-sm'}`}>
          {msg.text}
        </div>
        {msg.books?.length > 0 && (
          <div className="mt-1 space-y-1">
            {msg.books.map(b => <InlineBookCard key={b.id} book={b} />)}
          </div>
        )}
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  "Un roman qui me fera voyager",
  "Quelque chose de court et percutant",
  "Un livre pour comprendre l'économie",
  "Une saga dont je ne pourrai pas m'arrêter",
  "Un classique que tout le monde devrait lire",
  "Un livre feel-good pour se remonter le moral",
]

export default function AdvisorPage() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: "Bonjour ! Je suis votre conseiller Pagine 📚\n\nDites-moi ce que vous aimez lire, votre humeur du moment, ou un livre que vous avez adoré — je vous recommande des titres disponibles sur Pagine en ce moment.",
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const searchBooksOnPagine = async (titles) => {
    if (!titles?.length) return []
    const results = []
    for (const title of titles.slice(0, 5)) {
      const { data } = await supabase.from('books').select('*')
        .ilike('title', `%${title}%`).eq('status', 'actif').limit(1)
      if (data?.[0]) results.push(data[0])
    }
    return results
  }

  const send = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    const newMessages = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const systemPrompt = `Tu es un libraire bienveillant et cultivé pour Pagine, une marketplace de livres d'occasion entre particuliers en France. Ton rôle : recommander des livres selon les goûts et l'humeur de l'utilisateur. Règles : Ton chaleureux enthousiaste mais pas excessif. Recommande 2-3 livres maximum par réponse. Pour chaque livre donne une courte explication (1-2 phrases). À la fin de ta réponse inclus TOUJOURS un JSON sur une ligne séparée : {"titles":["Titre 1","Titre 2"]}. Réponds toujours en français.`

      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }))

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [
              ...history,
              { role: 'user', parts: [{ text: userMsg }] }
            ]
          })
        }
      )

      const data = await res.json()
      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (!fullText) {
        setMessages(prev => [...prev, { role: 'assistant', text: "Je n'ai pas pu générer une réponse. Réessayez !" }])
        setLoading(false)
        return
      }

      let titles = []
      let displayText = fullText
      try {
        const jsonMatch = fullText.match(/\{"titles":\[.*?\]\}/)
        if (jsonMatch) {
          titles = JSON.parse(jsonMatch[0]).titles || []
          displayText = fullText.replace(jsonMatch[0], '').trim()
        }
      } catch {}

      const foundBooks = await searchBooksOnPagine(titles)
      let finalText = displayText
      if (foundBooks.length > 0) {
        finalText += `\n\n✨ ${foundBooks.length} de ces livres sont disponibles sur Pagine :`
      } else if (titles.length > 0) {
        finalText += `\n\n💡 Ces livres ne sont pas encore sur Pagine, mais guettez les nouvelles annonces !`
      }
      setMessages(prev => [...prev, { role: 'assistant', text: finalText, books: foundBooks }])
    } catch (err) {
      console.error('Erreur:', err)
      setMessages(prev => [...prev, { role: 'assistant', text: "Désolé, je rencontre un problème technique. Réessayez dans un instant !" }])
    }
    setLoading(false)
  }

  const reset = () => setMessages([{
    role: 'assistant',
    text: "Bonjour ! Je suis votre conseiller Pagine 📚\n\nDites-moi ce que vous aimez lire, votre humeur du moment, ou un livre que vous avez adoré — je vous recommande des titres disponibles sur Pagine en ce moment.",
  }])

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
            <Sparkles size={15} className="text-accent" />
          </div>
          <div>
            <p className="font-semibold text-sm text-ink">Conseiller Pagine</p>
            <p className="text-xs text-muted">Votre libraire personnel</p>
          </div>
        </div>
        <button onClick={reset} className="p-2 text-muted hover:text-ink transition-colors">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 bg-surface" style={{ paddingBottom: '80px' }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0 mr-2">
              <BookOpen size={14} className="text-accent" />
            </div>
            <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.length === 1 && !loading && (
          <div className="mt-2 mb-4">
            <p className="text-xs text-muted mb-2 text-center">Suggestions</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 bg-white border border-border rounded-full text-ink hover:border-accent hover:text-accent transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t-2 border-accent bg-white flex-shrink-0"
        style={{ paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Décrivez vos goûts, votre humeur du moment..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-white border-2 border-accent rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none max-h-28 overflow-y-auto disabled:opacity-50"
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}