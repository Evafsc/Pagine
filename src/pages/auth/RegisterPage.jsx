import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'
import { BookOpen } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ prenom: '', email: '', password: '', ville: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.prenom.trim()) e.prenom = 'Prénom requis'
    if (!form.email) e.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.password) e.password = 'Mot de passe requis'
    else if (form.password.length < 6) e.password = '6 caractères minimum'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (error) { setServerError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, prenom: form.prenom.trim(), ville: form.ville.trim() || null
      })
    }
    setLoading(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex items-center px-5 pt-12 pb-8">
        <Link to="/" className="flex items-center gap-2 text-ink font-serif font-bold text-xl tracking-tight">
          <BookOpen size={24} className="text-accent" strokeWidth={2} />
          Pagine
        </Link>
      </div>

      <div className="flex-1 px-5 max-w-sm mx-auto w-full pb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Créer un compte</h1>
        <p className="text-muted text-sm mb-8">Rejoignez la communauté des lecteurs.</p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3 mb-5">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Prénom" placeholder="Marie"
            value={form.prenom} onChange={e => set('prenom', e.target.value)}
            error={errors.prenom} autoComplete="given-name" />
          <Input label="Email" type="email" placeholder="vous@exemple.fr"
            value={form.email} onChange={e => set('email', e.target.value)}
            error={errors.email} autoComplete="email" />
          <Input label="Mot de passe" type="password" placeholder="6 caractères minimum"
            value={form.password} onChange={e => set('password', e.target.value)}
            error={errors.password} autoComplete="new-password" />
          <Input label="Ville (optionnel)" placeholder="Paris"
            value={form.ville} onChange={e => set('ville', e.target.value)}
            autoComplete="address-level2" />
          <Button type="submit" size="lg" loading={loading} className="mt-2">
            Créer mon compte
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="text-accent font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}