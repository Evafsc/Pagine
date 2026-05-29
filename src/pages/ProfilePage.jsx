import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Camera, MapPin, Calendar, LogOut, BookOpen, Heart, Store, ChevronRight, Edit2, Check, X, Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Avatar, Spinner } from '@/components/ui'
import { BookCard } from '@/components/books/BookCard'
import { formatDate } from '@/lib/utils'
import { getImageUrl } from '@/lib/supabase'
import { BookPlaceholder } from '@/components/ui'

export default function ProfilePage() {
  const { id: paramId } = useParams()
  const { user, signOut, fetchProfile } = useAuthStore()
  const navigate = useNavigate()
  const fileRef = useRef()

  const isOwn = !paramId || paramId === user?.id
  const targetId = paramId || user?.id

  const [profileData, setProfileData] = useState(null)
  const [books, setBooks] = useState([])
  const [favorites, setFavorites] = useState([])
  const [coupsDeCoeur, setCoupsDeCoeur] = useState([])
  const [tab, setTab] = useState('annonces')
  const [loading, setLoading] = useState(true)
  const [editingBio, setEditingBio] = useState(false)
  const [bioValue, setBioValue] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [showBookPicker, setShowBookPicker] = useState(false)
  const [pickerPosition, setPickerPosition] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!targetId) { setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', targetId).single()
      setProfileData(p)
      setBioValue(p?.bio || '')
      const { data: b } = await supabase.from('books').select('*').eq('seller_id', targetId).neq('status', 'archivé').order('created_at', { ascending: false })
      setBooks(b || [])
      const { data: cdc } = await supabase.from('coups_de_coeur').select('*').eq('user_id', targetId).order('position')
      setCoupsDeCoeur(cdc || [])
      if (isOwn) {
        const { data: favs } = await supabase.from('favorites').select('book_id').eq('user_id', targetId)
        if (favs?.length) {
          const { data: favBooks } = await supabase.from('books').select('*').in('id', favs.map(f => f.book_id))
          setFavorites(favBooks || [])
        }
      }
      setLoading(false)
    }
    load()
  }, [targetId, isOwn])

  const searchBooks = async (q) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=key,title,author_name,cover_i`)
      const data = await res.json()
      setSearchResults(data.docs || [])
    } catch { setSearchResults([]) }
    setSearching(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => searchBooks(searchQuery), 800)
    return () => clearTimeout(timer)
  }, [searchQuery])

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

  const saveBio = async () => {
    setSavingBio(true)
    await supabase.from('profiles').update({ bio: bioValue }).eq('id', user.id)
    setProfileData(prev => ({ ...prev, bio: bioValue }))
    setEditingBio(false)
    setSavingBio(false)
  }

  const addCoupDeCoeur = async (book) => {
    if (!pickerPosition) return
    const couverture = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null
    await supabase.from('coups_de_coeur').upsert({
      user_id: user.id,
      position: pickerPosition,
      titre: book.title,
      auteur: book.author_name?.[0] || 'Auteur inconnu',
      couverture_url: couverture,
      google_books_id: book.key
    }, { onConflict: 'user_id,position' })
    const { data: cdc } = await supabase.from('coups_de_coeur').select('*').eq('user_id', targetId).order('position')
    setCoupsDeCoeur(cdc || [])
    setShowBookPicker(false)
    setPickerPosition(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const removeCoupDeCoeur = async (position) => {
    await supabase.from('coups_de_coeur').delete().eq('user_id', user.id).eq('position', position)
    setCoupsDeCoeur(prev => prev.filter(c => c.position !== position))
  }

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const deleteBook = async (bookId) => {
    if (!confirm('Supprimer cette annonce ?')) return
    await supabase.from('books').update({ status: 'archivé' }).eq('id', bookId)
    setBooks(prev => prev.filter(b => b.id !== bookId))
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner className="w-5 h-5 text-accent" /></div>

  if (!profileData) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <p className="font-medium text-ink">Profil introuvable</p>
      <Link to="/" className="text-accent text-sm mt-2">Retour</Link>
    </div>
  )

  const activeBooks = books.filter(b => b.status === 'actif')

  return (
    <div className="pb-20">
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
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted">
              {profileData.ville && <span className="flex items-center gap-1"><MapPin size={11} />{profileData.ville}</span>}
              <span className="flex items-center gap-1"><Calendar size={11} />Depuis {formatDate(profileData.created_at)}</span>
            </div>
          </div>
          {isOwn && (
            <button onClick={handleSignOut} className="p-2 text-muted hover:text-ink transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>

        <div className="mb-4">
          {editingBio ? (
            <div className="flex flex-col gap-2">
              <textarea value={bioValue} onChange={e => setBioValue(e.target.value)}
                rows={3} maxLength={200}
                placeholder="Parlez de vos goûts littéraires..."
                className="w-full border border-accent rounded-xl px-3 py-2 text-sm text-ink resize-none focus:outline-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{bioValue.length}/200</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingBio(false); setBioValue(profileData.bio || '') }}
                    className="p-1.5 text-muted hover:text-ink"><X size={16} /></button>
                  <button onClick={saveBio} disabled={savingBio}
                    className="p-1.5 text-accent"><Check size={16} /></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="text-sm text-muted flex-1 italic">
                {profileData.bio || (isOwn ? 'Ajoutez une bio pour vous présenter...' : '')}
              </p>
              {isOwn && (
                <button onClick={() => setEditingBio(true)} className="text-muted hover:text-ink flex-shrink-0">
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

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
            className="mt-4 flex items-center justify-center gap-2 py-2.5 border border-accent text-accent font-medium rounded text-sm">
            Contacter {profileData.prenom}
          </Link>
        )}
      </div>

      {/* Coups de coeur */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-ink">Coups de cœur <span className="text-accent">♥</span></p>
          {isOwn && <p className="text-xs text-muted">Appuyez pour modifier</p>}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(pos => {
            const cdc = coupsDeCoeur.find(c => c.position === pos)
            return (
              <div key={pos} className="flex flex-col gap-1">
                <div className="relative aspect-[2/3]">
                  {cdc ? (
                    <div className="w-full h-full rounded-lg overflow-hidden border border-border group relative">
                      {cdc.couverture_url
                        ? <img src={cdc.couverture_url} alt={cdc.titre} className="w-full h-full object-cover" />
                        : <BookPlaceholder title={cdc.titre} className="w-full h-full" />
                      }
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                        <p className="text-white text-[9px] font-semibold line-clamp-2 leading-tight">{cdc.titre}</p>
                        <p className="text-white/70 text-[8px] line-clamp-1 mt-0.5">{cdc.auteur}</p>
                      </div>
                      {isOwn && (
                        <button onClick={() => removeCoupDeCoeur(pos)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} className="text-white" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => { if (isOwn) { setPickerPosition(pos); setShowBookPicker(true) } }}
                      className={`w-full h-full rounded-lg border-2 border-dashed border-border flex items-center justify-center ${isOwn ? 'hover:border-accent cursor-pointer' : 'cursor-default'}`}>
                      {isOwn && <Plus size={20} className="text-muted" />}
                    </button>
                  )}
                </div>
                {cdc && (
                  <p className="text-[9px] text-muted text-center line-clamp-1 leading-tight">{cdc.titre}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Book Picker Modal */}
      {showBookPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setShowBookPicker(false); setSearchQuery(''); setSearchResults([]) }}>
          <div className="bg-white rounded-t-2xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-semibold text-ink">Choisir un livre</p>
              <button onClick={() => { setShowBookPicker(false); setSearchQuery(''); setSearchResults([]) }}>
                <X size={20} className="text-muted" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-border">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un titre, un auteur..."
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {searching && <p className="text-center text-sm text-muted py-4">Recherche...</p>}
              {!searching && searchQuery && searchResults.length === 0 && (
                <p className="text-center text-sm text-muted py-4">Aucun résultat</p>
              )}
              {!searching && !searchQuery && (
                <p className="text-center text-sm text-muted py-4">Tapez le titre d'un livre pour le rechercher</p>
              )}
              <div className="space-y-2">
                {searchResults.map(book => {
                  const cover = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null
                  return (
                    <button key={book.key} onClick={() => addCoupDeCoeur(book)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors text-left">
                      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-surface">
                        {cover
                          ? <img src={cover} alt={book.title} className="w-full h-full object-cover" />
                          : <BookPlaceholder title={book.title} className="w-full h-full" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink line-clamp-1">{book.title}</p>
                        <p className="text-xs text-muted">{book.author_name?.[0] || 'Auteur inconnu'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Découvrir */}
      {isOwn && (
        <div className="px-4 pt-2 pb-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Découvrir</p>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <Link to="/librairies" className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
                <Store size={16} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Librairies Partenaires</p>
                <p className="text-xs text-muted">Découvrez les librairies près de chez vous</p>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </Link>
            <Link to="/librairie/rejoindre" className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors">
              <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
                <BookOpen size={16} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Devenir Librairie Partenaire</p>
                <p className="text-xs text-muted">Rejoignez la communauté Pagine</p>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border bg-white mt-2">
        {[
          { id: 'annonces', label: `Annonces (${activeBooks.length})` },
          ...(isOwn ? [{ id: 'favoris', label: `Favoris (${favorites.length})` }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {tab === 'annonces' && (
          activeBooks.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">{isOwn ? "Vous n'avez pas encore publié d'annonce" : 'Aucune annonce active'}</p>
              {isOwn && <Link to="/publier" className="mt-3 inline-block text-accent text-sm font-medium">Publier mon premier livre</Link>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {activeBooks.map(book => (
                <div key={book.id} className="relative">
                  <BookCard book={book} />
                  {isOwn && (
                    <div className="flex gap-1.5 mt-1.5">
                      <button onClick={() => deleteBook(book.id)}
                        className="flex-1 py-1.5 text-xs font-medium border border-border rounded text-red-500">
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