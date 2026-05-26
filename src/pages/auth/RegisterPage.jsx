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

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex items-center px-5 pt-12 pb-8">
        <Link to="/" className="flex items-center gap-2 text-ink tracking-tight font-serif font-bold text-xl">
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
          <Input label="Prénom" placeholder="Marie" value={form.prenom} onChange={e => set('prenom', e.target.value)} error={errors.prenom} autoComplete="given-name" />
          <Input label="Email" type="email" placeholder="vous@exemple.fr" value={form.email} onChange={e => set('email', e.target.value)} error={errors.email} autoComplete="email" />
          <Input label="Mot de passe" type="password" placeholder="6 caractères minimum" value={form.password} onChange={e => set('password', e.target.value)} error={errors.password} autoComplete="new-password" />
          <Input label="Ville (optionnel)" placeholder="Paris" value={form.ville} onChange={e => set('ville', e.target.value)} autoComplete="address-level2" />

          <Button type="submit" size="lg" loading={loading} className="mt-2">
            Créer mon compte
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted">ou</span>
          <span className="flex-1 h-px bg-border" />
        </div>

        <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-border rounded text-sm font-medium text-ink hover:bg-surface transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuer avec Google
        </button>

        <p className="text-center text-sm text-muted mt-8">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="text-accent font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
