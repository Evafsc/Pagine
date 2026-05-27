import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Camera, MapPin, Calendar, LogOut, BookOpen, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Avatar, StarRating, Spinner } from '@/components/ui'
import { BookCard } from '@/components/books/BookCard'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const { id: paramId } = useParams()
  const { user, profile, signOut, fetchProfile } = useAuthStore()
  const navigate = useNavigate()
  const fileRef = useRef()

  const isOwn = !paramId || paramId === user?.id
  const targetId = paramId || user?.id

  const [profileData, setProfileData] = useState(null)
  const [books, setBooks] = useState([])
  const [favorites, setFavorites] = useState([])
  const [tab, setTab] = useState('annonces')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!targetId) { setLoading(false); return }

      // Fetch profile
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single()
      setProfileData(p)

      // Fetch books
      const { data: b } = await supabase
        .from('books')
        .select('*')
        .eq('seller_id', targetId)
        .neq('status', 'archivé')
        .order('created_at', { ascending: false })
      setBooks(b || [])

      // Fetch favorites (own profile only)
      if (isOwn) {
        const { data: favs } = await supabase
          .from('favorites')
          .select('book_id')
          .eq('user_id', targetId)
        if (favs?.length) {
          const bookIds = favs.map(f => f.book_id)
          const { data: favBooks } = await supabase
            .from('books')
            .select('*')
            .in('id', bookIds)
          setFavorites(favBooks || [])
        }
      }

      setLoading(false)
    }
    load()
  }, [targetId, isOwn])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    await supabase.storage.from('book-images').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('book-images').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    fetchProfile(user.id)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const deleteBook = async (bookId) => {
    if (!confirm('Supprimer cette annonce ?')) return
    await supabase.from('books').update({ status: 'archivé' }).eq('id', bookId)
    setBooks(prev => prev.filter(b => b.id !== bookId))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="w-5 h-5 text-accent" />
    </div>
  )

  if (!profileData) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <p className="font-medium text-ink">Profil introuvable</p>
      <Link to="/" className="text-accent text-sm mt-2">Retour</Link>
    </div>
  )

  const activeBooks = books.filter(b => b.status === 'actif')

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 pt-6 pb-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <Avatar name={profileData.prenom} src={profileData.avatar_url} size="xl" />
            {isOwn && (
              <>
                <button onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center border-2 border-white">
                  <Camera size={13} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-xl font-bold text-ink">{profileData.prenom}</h1>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted">
              {profileData.ville && (
                <span className="flex items-center gap-1"><MapPin size={11} />{profileData.ville}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={11} />Depuis {formatDate(profileData.created_at)}
              </span>
            </div>
          </div>

          {isOwn && (
            <button onClick={handleSignOut} className="p-2 text-muted hover:text-ink transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: activeBooks.length, label: 'Annonces' },
            { n: books.filter(b => b.status === 'vendu').length, label: 'Vendus' },
            { n: favorites.length, label: 'Favoris' },
          ].map(({ n, label }) => (
            <div key={label} className="bg-surface rounded-lg py-3 text-center">
              <p className="text-lg font-bold text-ink">{n}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>

        {!isOwn && (
          <Link to={`/messages?seller=${targetId}`}
            className="mt-4 flex items-center justify-center gap-2 py-2.5 border border-accent text-accent font-medium rounded text-sm hover:bg-accent-light transition-colors">
            Contacter {profileData.prenom}
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-white">
        {[
          { id: 'annonces', label: `Annonces (${activeBooks.length})` },
          ...(isOwn ? [{ id: 'favoris', label: `Favoris (${favorites.length})` }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2
              ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {tab === 'annonces' && (
          activeBooks.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{isOwn ? "Vous n'avez pas encore publié d'annonce" : 'Aucune annonce active'}</p>
              {isOwn && (
                <Link to="/publier" className="mt-3 inline-block text-accent text-sm font-medium hover:underline">
                  Publier mon premier livre
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {activeBooks.map(book => (
                <div key={book.id} className="relative">
                  <BookCard book={book} />
                  {isOwn && (
                    <div className="flex gap-1.5 mt-1.5">
                      <button onClick={() => deleteBook(book.id)}
                        className="flex-1 py-1.5 text-xs font-medium border border-border rounded text-red-500 hover:border-red-300 transition-colors">
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'favoris' && isOwn && (
          favorites.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Heart size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun favori pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favorites.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          )
        )}
      </div>
    </div>
  )
}