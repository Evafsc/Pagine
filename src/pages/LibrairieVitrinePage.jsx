import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { MapPin, Store, ArrowLeft, Globe, Phone, Clock, MessageCircle, Edit } from 'lucide-react'
import { BookCard } from '@/components/books/BookCard'
import { Spinner } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

export default function LibrairieVitrinePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [librairie, setLibrairie] = useState(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: lib } = await supabase
        .from('librairies')
        .select('*')
        .eq('id', id)
        .single()
      setLibrairie(lib)

      if (lib?.user_id) {
        const { data: b } = await supabase
          .from('books')
          .select('*')
          .eq('seller_id', lib.user_id)
          .eq('status', 'actif')
          .order('created_at', { ascending: false })
        setBooks(b || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  const isOwner = user?.id === librairie?.user_id

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="w-5 h-5 text-accent" />
    </div>
  )

  if (!librairie) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <p className="font-medium text-ink">Librairie introuvable</p>
      <Link to="/librairies" className="text-accent text-sm mt-2">Retour</Link>
    </div>
  )

  return (
    <div className="pb-20">

      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/librairies" className="p-1"><ArrowLeft size={20} className="text-ink" /></Link>
          <p className="font-semibold text-ink">{librairie.nom}</p>
        </div>
        {isOwner && (
          <Link to={`/librairie/${id}/edit`} className="p-1">
            <Edit size={18} className="text-muted" />
          </Link>
        )}
      </div>

      {/* Bannière */}
      <div className="h-40 bg-accent-light overflow-hidden">
        {librairie.banniere_url ? (
          <img src={librairie.banniere_url} alt="bannière" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Store size={48} className="text-accent" />
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="bg-white px-4 pt-4 pb-5 border-b border-border">

        {/* Logo + nom */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-light border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
            {librairie.logo_url ? (
              <img src={librairie.logo_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Store size={28} className="text-accent" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-lg font-bold text-ink">{librairie.nom}</h1>
              <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">Partenaire</span>
            </div>
            {librairie.ville && (
              <div className="flex items-center gap-1 text-muted">
                <MapPin size={11} />
                <p className="text-xs">{librairie.ville}{librairie.adresse ? ` — ${librairie.adresse}` : ''}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {librairie.description && (
          <p className="text-sm text-muted mb-4">{librairie.description}</p>
        )}

        {/* Horaires + Téléphone */}
        <div className="space-y-2 mb-4">
          {librairie.horaires && (
            <div className="flex items-center gap-2 text-sm text-ink">
              <Clock size={14} className="text-accent flex-shrink-0" />
              <span>{librairie.horaires}</span>
            </div>
          )}
          {librairie.telephone && (
            <a href={`tel:${librairie.telephone}`} className="flex items-center gap-2 text-sm text-ink hover:text-accent transition-colors">
              <Phone size={14} className="text-accent flex-shrink-0" />
              <span>{librairie.telephone}</span>
            </a>
          )}
        </div>

        {/* Boutons */}
        <div className="flex gap-2">
          {librairie.adresse && (
            <a href={`https://www.google.com/maps/search/${encodeURIComponent(librairie.nom + ' ' + librairie.adresse + ' ' + librairie.ville)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors">
              <MapPin size={15} />Maps
            </a>
          )}
          {librairie.site_web && (
            <a href={librairie.site_web} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors">
              <Globe size={15} />Site web
            </a>
          )}
          {!isOwner && librairie.user_id && (
            <button
              onClick={() => navigate(`/messages?to=${librairie.user_id}`)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors">
              <MessageCircle size={15} />Contacter
            </button>
          )}
        </div>
      </div>

      {/* Annonces */}
      <div className="px-4 pt-4">
        <p className="text-sm font-semibold text-ink mb-3">
          Annonces disponibles ({books.length})
        </p>
        {books.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <Store size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune annonce pour l'instant</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {books.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        )}
      </div>

    </div>
  )
}