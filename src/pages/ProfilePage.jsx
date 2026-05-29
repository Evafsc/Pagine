import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Camera, MapPin, Calendar, LogOut, BookOpen, Heart, Store, ChevronRight, Edit2, Check, X, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Avatar, Spinner } from '@/components/ui'
import { BookCard } from '@/components/books/BookCard'
import { formatDate, modeConfig } from '@/lib/utils'
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

  useEffect(() => {
    const load = async () => {
      if (!targetId) { setLoading(false); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', targetId).single()
      setProfileData(p)
      setBioValue(p?.bio || '')

      const { data: b } = await supabase.from('books').select('*').eq('seller_id', targetId).neq('status', 'archivé').order('created_at', { ascending: false })
      setBooks(b || [])

      const { data: cdc } = await supabase.from('coups_de_coeur').select('*, books(*)').eq('user_id', targetId).order('position')
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
    await supabase.from('coups_de_coeur').upsert({ user_id: user.id, book_id: book.id, position: pickerPosition }, { onConflict: 'user_id,position' })
    const { data: cdc } = await supabase.from('coups_de_coeur').select('*, books(*)').eq('user_id', targetId).order('position')
    setCoupsDeCoeur(cdc || [])
    setShowBookPicker(false)
    setPickerPosition(null)
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

        {/* Bio */}
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
                    className="p-1.5 text-accent hover:text-accent/80"><Check size={16} /></button>
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
            className="mt-4 flex items-center justify-center gap-2 py-2.5 border border-accent text-accent font-medium rounded text-sm">
            Contacter {profileData.prenom}
          </Link>
        )}
      </div>

      {/* Coups de coeur */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-ink">Coups de cœur <span className="text-accent">♥</span></p>
          {isOwn && <p className="text-xs text-muted">Appuyez sur un emplacement pour modifier</p>}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(pos => {
            const cdc = coupsDeCoeur.find(c => c.position === pos)
            const book = cdc?.books
            const img = book?.images?.[0] ? getImageUrl(book.images[0]) : null
            return (
              <div key={pos} className="relative aspect-[2/3]">
                {book ? (
                  <div className="w-full h-full rounded-lg overflow-hidden border border-border">
                    {img
                      ? <img src={img} alt={book.title} className="w-full h-full object-cover" />
                      : <BookPlaceholder title={book.title} className="w-full h-full" />
                    }
                    {isOwn && (
                      <button onClick={() => removeCoupDeCoeur(pos)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                        <X size={10} className="text-white" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => isOwn ? (setPickerPosition(pos), setShowBookPicker(true)) : null}
                    className={`w-full h-full rounded-lg border-2 border-dashed border-border flex items-center justify-center ${isOwn ? 'hover:border-accent cursor-pointer' : 'cursor-default'}`}>
                    {isOwn && <Plus size={20} className="text-muted" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Book Picker Modal */}
      {showBookPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowBookPicker(false)}>
          <div className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-ink">Choisir un livre</p>
              <button onClick={() => setShowBookPicker(false)}><X size={20} className="text-muted" /></button>
            </div>
            <p className="text-xs text-muted mb-3">Choisissez parmi tous les livres sur Pagine</p>
            {books.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">Publiez d'abord des annonces pour les ajouter ici</p>
            ) : (
              <div className="space-y-2">
                {books.map(book => {
                  const img = book.images?.[0] ? getImageUrl(book.images[0]) : null
                  return (
                    <button key={book.id} onClick={() => addCoupDeCoeur(book)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors text-left">
                      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-surface">
                        {img ? <img src={img} alt={book.title} className="w-full h-full object-cover" /> : <BookPlaceholder title={book.title} className="w-full h-full" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink line-clamp-1">{book.title}</p>
                        <p className="text-xs text-muted">{book.author}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
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

      {/* Content */}
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