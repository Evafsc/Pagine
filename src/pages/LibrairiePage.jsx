import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Store, Clock, CheckCircle } from 'lucide-react'
import { Spinner } from '@/components/ui'

export default function LibrairiePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existante, setExistante] = useState(null)
  const [form, setForm] = useState({
    nom: '', adresse: '', ville: '', siret: '', site_web: '', description: ''
  })

  useEffect(() => {
    if (user === undefined) return // encore en chargement
    const check = async () => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('librairies')
        .select('id, nom, statut')
        .eq('user_id', user.id)
      setExistante(data?.[0] || null)
      setLoading(false)
    }
    check()
  }, [user])

  const handleSubmit = async () => {
    if (!form.nom || !form.ville) return alert('Nom et ville obligatoires')
    setSubmitting(true)
    const { error } = await supabase.from('librairies').insert({
      user_id: user.id,
      nom: form.nom,
      adresse: form.adresse,
      ville: form.ville,
      siret: form.siret,
      site_web: form.site_web,
      description: form.description,
      statut: 'en_attente'
    })
    setSubmitting(false)
    if (error) { alert('Erreur lors de la soumission'); return }
    const { data } = await supabase
      .from('librairies')
      .select('id, nom, statut')
      .eq('user_id', user.id)
    setExistante(data?.[0] || null)
  }

  if (loading || user === undefined) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="w-5 h-5 text-accent" />
    </div>
  )

  return (
    <div className="pb-24 min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/profil" className="p-1"><ArrowLeft size={20} className="text-ink" /></Link>
        <p className="font-semibold text-ink">Devenir Librairie Partenaire</p>
      </div>

      {/* Déjà approuvée */}
      {existante?.statut === 'approuve' && (
        <div className="px-4 pt-6">
          <div className="bg-white rounded-2xl border border-border p-6 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-ink mb-1">Votre librairie est active !</p>
            <p className="text-sm text-muted mb-4">{existante.nom}</p>
            <Link to={`/librairie/${existante.id}`}
              className="inline-block bg-accent text-white px-6 py-2.5 rounded-xl text-sm font-medium">
              Voir ma vitrine
            </Link>
          </div>
        </div>
      )}

      {/* En attente */}
      {existante?.statut === 'en_attente' && (
        <div className="px-4 pt-6">
          <div className="bg-white rounded-2xl border border-border p-6 text-center">
            <Clock size={40} className="text-yellow-500 mx-auto mb-3" />
            <p className="font-semibold text-ink mb-1">Demande en cours d'examen</p>
            <p className="text-sm text-muted">Votre demande pour <strong>{existante.nom}</strong> est en attente de validation. Vous serez notifié dès qu'elle sera traitée.</p>
          </div>
        </div>
      )}

      {/* Refusée */}
      {existante?.statut === 'refuse' && (
        <div className="px-4 pt-6">
          <div className="bg-white rounded-2xl border border-border p-6 text-center">
            <Store size={40} className="text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-ink mb-1">Demande refusée</p>
            <p className="text-sm text-muted mb-4">Votre demande pour <strong>{existante.nom}</strong> n'a pas été acceptée. Contactez-nous pour plus d'informations.</p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {!existante && (
        <div className="px-4 pt-5 space-y-5">
          <div className="bg-white rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <Store size={20} className="text-accent" />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">Rejoignez Pagine</p>
                <p className="text-xs text-muted">Visibilité gratuite pour votre librairie</p>
              </div>
            </div>
            <p className="text-xs text-muted">Créez votre vitrine, publiez vos annonces et touchez une communauté de lecteurs passionnés.</p>
          </div>

          {[
            { key: 'nom', label: 'Nom de la librairie *', placeholder: 'Ex: Librairie des Abbesses' },
            { key: 'adresse', label: 'Adresse', placeholder: 'Ex: 12 rue de Rivoli' },
            { key: 'ville', label: 'Ville *', placeholder: 'Ex: Paris' },
            { key: 'siret', label: 'Numéro SIRET', placeholder: 'Ex: 12345678912345' },
            { key: 'site_web', label: 'Site web', placeholder: 'Ex: https://malibrairie.fr' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-semibold text-ink mb-1.5 block">{label}</label>
              <input
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          ))}

          <div>
            <label className="text-sm font-semibold text-ink mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez votre librairie, vos spécialités..."
              rows={4}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full bg-accent text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Spinner className="w-4 h-4" /> : <Store size={16} />}
            {submitting ? 'Envoi en cours...' : 'Soumettre ma demande'}
          </button>
        </div>
      )}
    </div>
  )
}