import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, ExternalLink, Store, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

function LibrairieCard({ librairie }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 hover:border-accent transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
          <Store size={20} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink text-sm">{librairie.nom}</p>
            <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">Partenaire</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-muted" />
            <p className="text-xs text-muted">{librairie.ville}{librairie.adresse ? ` — ${librairie.adresse}` : ''}</p>
          </div>
          {librairie.description && (
            <p className="text-xs text-muted mt-2 line-clamp-2">{librairie.description}</p>
          )}
          {librairie.site_web && (
            <a href={librairie.site_web} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 mt-2 text-xs text-accent font-medium">
              <ExternalLink size={11} />Voir le site
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LibrairiesListePage() {
  const [librairies, setLibrairies] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('liste')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('librairies')
        .select('*')
        .eq('statut', 'approuve')
        .order('created_at', { ascending: false })
      setLibrairies(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/profil" className="p-1"><ArrowLeft size={20} className="text-ink" /></Link>
          <div>
            <p className="font-semibold text-ink">Librairies Partenaires</p>
            <p className="text-xs text-muted">{librairies.length} partenaire{librairies.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link to="/librairie/rejoindre"
          className="text-xs bg-accent text-white px-3 py-2 rounded-xl font-medium">
          Rejoindre
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-border">
        {[{ id: 'liste', label: '📋 Liste' }, { id: 'carte', label: '🗺️ Carte' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'liste' && (
        <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
          {loading && <div className="text-center py-12 text-muted text-sm">Chargement...</div>}
          {!loading && librairies.length === 0 && (
            <div className="text-center py-12">
              <Store size={40} className="text-muted mx-auto mb-3" />
              <p className="text-ink font-medium">Aucune librairie partenaire pour l'instant</p>
              <p className="text-muted text-sm mt-1">Soyez la première à rejoindre Pagine !</p>
              <Link to="/librairie/rejoindre"
                className="inline-block mt-4 bg-accent text-white px-6 py-3 rounded-xl font-medium text-sm">
                Devenir partenaire
              </Link>
            </div>
          )}
          {librairies.map(l => <LibrairieCard key={l.id} librairie={l} />)}
        </div>
      )}

      {tab === 'carte' && (
        <div className="px-4 py-4 space-y-3">
          {loading && <div className="text-center py-12 text-muted text-sm">Chargement...</div>}
          {!loading && librairies.length === 0 && (
            <div className="text-center py-12">
              <MapPin size={40} className="text-muted mx-auto mb-3 opacity-30" />
              <p className="text-ink font-medium">Aucune librairie à afficher</p>
            </div>
          )}
          {librairies.map(l => (
            <a key={l.id}
              href={`https://www.google.com/maps/search/${encodeURIComponent((l.nom || '') + ' ' + (l.adresse || '') + ' ' + (l.ville || ''))}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white border border-border rounded-2xl p-4 hover:border-accent transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink text-sm">{l.nom}</p>
                <p className="text-xs text-muted">{l.ville}{l.adresse ? ` — ${l.adresse}` : ''}</p>
              </div>
              <span className="text-xs text-accent font-medium">Voir sur Maps →</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}