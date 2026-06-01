import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { MapPin, ExternalLink, Store, ArrowLeft, Globe } from 'lucide-react'
import { BookCard } from '@/components/books/BookCard'
import { Spinner } from '@/components/ui'

export default function LibrairieVitrinePage() {
  const { id } = useParams()
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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner className="w-5 h-5 text-accent" /></div>

  if (!librairie) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <p className="font-medium text-ink">Librairie introuvable</p>
      <Link to="/librairies" className="text-accent text-sm mt-2">Retour</Link>
    </div>
  )

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/librairies" className="p-1"><ArrowLeft size={20} className="text-ink" /></Link>
        <p className="font-semibold text-ink">{librairie.nom}</p>
      </div>

      {/* Infos */}
      <div className="bg-white px-4 pt-6 pb-5 border-b border-border">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center flex-shrink-0">
            <Store size={28} className="text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-ink">{librairie.nom}</h1>
              <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">Partenaire</span>
            </div>
            {librairie.ville && (
              <div className="flex items-center gap-1 text-muted">
                <MapPin size={12} />
                <p className="text-sm">{librairie.ville}{librairie.adresse ? ` — ${librairie.adresse}` : ''}</p>
              </div>
            )}
          </div>
        </div>

        {librairie.description && (
          <p className="text-sm text-muted mb-4">{librairie.description}</p>
        )}

        <div className="flex gap-2">
          {librairie.adresse && (
            <a href={`https://www.google.com/maps/search/${encodeURIComponent(librairie.nom + ' ' + librairie.adresse + ' ' + librairie.ville)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors">
              <MapPin size={15} />Voir sur Maps
            </a>
          )}
          {librairie.site_web && (
            <a href={librairie.site_web} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors">
              <Globe size={15} />Site web
            </a>
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