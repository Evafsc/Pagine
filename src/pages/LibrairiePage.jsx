import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Store, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LibrairiePage() {
  const [form, setForm] = useState({ nom: '', adresse: '', ville: '', description: '', site_web: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!form.nom || !form.ville) { setError('Nom et ville obligatoires'); return }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Vous devez être connecté'); setLoading(false); return }

    const { error: err } = await supabase.from('librairies').insert({
      user_id: user.id,
      nom: form.nom,
      adresse: form.adresse,
      ville: form.ville,
      description: form.description,
      site_web: form.site_web,
      statut: 'en_attente'
    })

    if (err) { setError('Erreur lors de la soumission'); setLoading(false); return }

    await supabase.from('profiles').update({ role: 'librairie' }).eq('id', user.id)
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-border">
        <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
          <Store size={28} className="text-accent" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Demande envoyée !</h2>
        <p className="text-muted text-sm mb-6">Votre demande de partenariat est en cours d'examen. Nous vous contacterons rapidement.</p>
        <button onClick={() => navigate('/')} className="w-full bg-accent text-white rounded-xl py-3 font-medium">
          Retour à l'accueil
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="p-1"><ArrowLeft size={20} className="text-ink" /></Link>
        <div>
          <p className="font-semibold text-ink">Devenir Librairie Partenaire</p>
          <p className="text-xs text-muted">Rejoignez la communauté Pagine</p>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="bg-accent-light rounded-2xl p-4 mb-6">
          <p className="text-sm text-accent font-medium">🤝 Pourquoi devenir partenaire ?</p>
          <p className="text-xs text-accent mt-1">Gagnez en visibilité, écoulez vos invendus et rejoignez une communauté de lecteurs engagés.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Nom de la librairie *</label>
            <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
              placeholder="Ex: Librairie du Moulin" />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Ville *</label>
            <input value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
              placeholder="Ex: Paris" />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Adresse</label>
            <input value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
              placeholder="Ex: 12 rue des Livres" />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent resize-none"
              placeholder="Décrivez votre librairie..." />
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1 block">Site web</label>
            <input value={form.site_web} onChange={e => setForm({...form, site_web: e.target.value})}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
              placeholder="https://..." />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-accent text-white rounded-xl py-3 font-medium disabled:opacity-50">
            {loading ? 'Envoi...' : 'Envoyer ma demande'}
          </button>
        </div>
      </div>
    </div>
  )
}