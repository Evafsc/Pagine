import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, ExternalLink, Store, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

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
  const [coords, setCoords] = useState({})
  const [tab, setTab] = useState('liste')

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('librairies')
        .select('*')
        .eq('statut', 'approuve')
        .order('created_at', { ascending: false })
      setLibrairies(data || [])
      setLoading(false)

      // Géocoder les adresses
      const newCoords = {}
      for (const lib of data || []) {
        if (lib.adresse && lib.ville) {
          try {
            const res = await window.fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lib.adresse + ' ' + lib.ville)}&format=json&limit=1`)
            const json = await res.json()
            if (json[0]) newCoords[lib.id] = { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) }
          } catch {}
        } else if (lib.ville) {
          try {
            const res = await window.fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lib.ville + ' France')}&format=json&limit=1`)
            const json = await res.json()
            if (json[0]) newCoords[lib.id] = { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) }
          } catch {}
        }
      }
      setCoords(newCoords)
    }
    fetch()
  }, [])

  const libsWithCoords = librairies.filter(l => coords[l.id])

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
        <div className="h-[calc(100vh-160px)]">
          {libsWithCoords.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              <div className="text-center">
                <MapPin size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucune librairie à afficher sur la carte</p>
              </div>
            </div>
          )}
          {libsWithCoords.length > 0 && (
            <MapContainer
              center={[46.603354, 1.888334]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {libsWithCoords.map(lib => (
                <Marker key={lib.id} position={[coords[lib.id].lat, coords[lib.id].lng]}>
                  <Popup>
                    <div>
                      <p className="font-semibold">{lib.nom}</p>
                      <p className="text-xs text-gray-500">{lib.ville}</p>
                      {lib.site_web && (
                        <a href={lib.site_web} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-500 underline">Voir le site</a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      )}
    </div>
  )
}