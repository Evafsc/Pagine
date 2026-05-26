import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Input } from '@/components/ui'
import { BookOpen } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fetchProfile = useAuthStore(s => s.fetchProfile)
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.password) e.password = 'Mot de passe requis'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setServerError('Email ou mot de passe incorrect.'); setLoading(false); return }
    if (data.user) await fetchProfile(data.user.id)
    setLoading(false)
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex items-center justify-between px-5 pt-12 pb-8">
        <Link to="/" className="flex items-center gap-2 text-ink font-serif font-bold text-xl tracking-tight">
          <BookOpen size={24} className="text-accent" strokeWidth={2} />
          Pagine
        </Link>
      </div>

      <div className="flex-1 px-5 max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-ink mb-1">Bon retour !</h1>
        <p className="text-muted text-sm mb-8">Connectez-vous pour accéder à votre compte.</p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3 mb-5">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="vous@exemple.fr"
            value={form.email} onChange={e => set('email', e.target.value)}
            error={errors.email} autoComplete="email" />
          <Input label="Mot de passe" type="password" placeholder="••••••••"
            value={form.password} onChange={e => set('password', e.target.value)}
            error={errors.password} autoComplete="current-password" />
          <div className="flex justify-end">
            <Link to="/mot-de-passe-oublie" className="text-xs text-accent hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <Button type="submit" size="lg" loading={loading} className="mt-2">
            Se connecter
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-accent font-medium hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}