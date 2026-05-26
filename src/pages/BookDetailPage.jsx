import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, MapPin, Calendar, Star, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { BookPlaceholder, Avatar, Badge, StarRating, Spinner } from '@/components/ui'
import { formatPrice, modeConfig, etatConfig, formatDate, timeAgo } from '@/lib/utils'
import { getImageUrl } from '@/lib/supabase'
import { MOCK_BOOKS } from '@/lib/mockData'

export default function BookDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')

  useEffect(() => {
    const load = async () => {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 300))
        setBook(MOCK_BOOKS.find(b => b.id === id) || null)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('books')
        .select('*, profiles(id, prenom, ville, avatar_url, created_at)')
        .eq('id', id)
        .single()
      setBook(data)
      if (user && data) {
        const { data: fav } = await supabase.from('favorites')
          .select('book_id').eq('user_id', user.id).eq('book_id', id).single()
        setIsFav(!!fav)
      }
      setLoading(false)
    }
    load()
  }, [id, user])

  const toggleFav = async () => {
    if (!user) { navigate('/connexion'); return }
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('book_id', id)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, book_id: id })
    }
    setIsFav(!isFav)
  }

  const startConversation = async () => {
    if (!user) { navigate('/connexion', { state: { from: { pathname: `/livre/${id}` } } }); return }
    if (!isDemo) {
      const { data: existing } = await supabase.from('conversations')
        .select('id').eq('book_id', id).eq('buyer_id', user.id).single()
      if (existing) { navigate(`/messages?conv=${existing.id}`); return }
      const { data: conv } = await supabase.from('conversations')
        .insert({ book_id: id, buyer_id: user.id, seller_id: book.seller_id })
        .select().single()
      if (conv) navigate(`/messages?conv=${conv.id}`)
    } else {
      navigate('/messages')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="w-6 h-6 text-accent" />
    </div>
  )

  if (!book) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <p className="font-medium text-ink mb-2">Livre introuvable</p>
      <Link to="/" className="text-accent text-sm">Retour à l'accueil</Link>
    </div>
  )

  const mc = modeConfig[book.mode]
  const ec = etatConfig[book.etat]
  const imgs = book.images?.filter(Boolean) || []
  const seller = book.profiles
  const stats = book._sellerStats || { sold: 0, rating: null }
  const isMine = user?.id === book.seller_id

  return (
    <div className="pb-32">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded text-ink hover:bg-surface transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={toggleFav} className="p-1.5 rounded hover:bg-surface transition-colors">
            <Heart size={20} className={isFav ? 'fill-red-500 text-red-500' : 'text-muted'} />
          </button>
          <button className="p-1.5 rounded hover:bg-surface transition-colors">
            <Share2 size={20} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Image(s) */}
      <div className="relative bg-surface aspect-[4/3] overflow-hidden">
        {imgs.length > 0 ? (
          <>
            <img src={getImageUrl(imgs[imgIdx])} alt={book.title} className="w-full h-full object-cover" />
            {imgs.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imgs.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <BookPlaceholder title={book.title} className="w-full h-full" />
        )}
        <div className="absolute top-3 left-3">
          <Badge className={mc.color}>{mc.label}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-5">
        {/* Title + price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-ink leading-tight flex-1">{book.title}</h1>
            <span className="text-2xl font-bold text-ink whitespace-nowrap">
              {formatPrice(book.price, book.mode)}
            </span>
          </div>
          <p className="text-muted mt-1">{book.author}</p>
          {book.genre && <p className="text-sm text-muted mt-0.5">{book.genre}</p>}
        </div>

        {/* Etat + meta */}
        <div className="flex flex-wrap gap-2">
          {book.etat && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded ${ec?.color}`}>
              <span className={`w-2 h-2 rounded-full ${ec?.dot}`} />
              {book.etat}
            </span>
          )}
          {book.isbn && (
            <span className="inline-flex items-center text-xs text-muted bg-surface px-2.5 py-1 rounded border border-border">
              ISBN {book.isbn}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Calendar size={11} /> {timeAgo(book.created_at)}
          </span>
        </div>

        {/* Description */}
        {book.description && (
          <div>
            <h2 className="text-sm font-semibold text-ink mb-2">Description</h2>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{book.description}</p>
          </div>
        )}

        {/* Seller */}
        {seller && (
          <div className="bg-surface rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold text-ink mb-3">Vendeur</h2>
            <div className="flex items-center gap-3">
              <Avatar name={seller.prenom} src={seller.avatar_url} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-sm">{seller.prenom}</p>
                {stats.rating && <StarRating value={stats.rating} count={stats.sold} />}
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
                  {seller.ville && (
                    <span className="flex items-center gap-0.5">
                      <MapPin size={10} /> {seller.ville}
                    </span>
                  )}
                  {seller.created_at && (
                    <span>Depuis {formatDate(seller.created_at)}</span>
                  )}
                </div>
              </div>
              {!isMine && (
                <Link
                  to={`/profil/${book.seller_id}`}
                  className="text-xs text-accent font-medium hover:underline whitespace-nowrap"
                >
                  Voir profil
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {!isMine && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-border px-4 py-3 flex gap-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={startConversation}
            className="w-12 h-12 flex items-center justify-center border border-border rounded text-muted hover:text-ink hover:bg-surface transition-colors flex-shrink-0"
            aria-label="Envoyer un message"
          >
            <MessageCircle size={20} />
          </button>
          <button
            onClick={startConversation}
            className="flex-1 py-3 bg-accent text-white font-semibold rounded text-sm hover:bg-opacity-90 transition-colors active:scale-[0.98]"
          >
            {book.mode === 'vente' && `Acheter · ${book.price ? `${Number(book.price).toFixed(2).replace('.', ',')} €` : '—'}`}
            {book.mode === 'échange' && 'Proposer un échange'}
            {book.mode === 'don' && 'Réserver gratuitement'}
          </button>
        </div>
      )}

      {isMine && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-border px-4 py-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <Link to={`/modifier/${book.id}`} className="w-full py-3 border border-accent text-accent font-semibold rounded text-sm flex items-center justify-center hover:bg-accent-light transition-colors">
            Modifier l'annonce
          </Link>
        </div>
      )}
    </div>
  )
}
