import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'
import { BookOpen, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email requis'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col px-5 pt-12">
      <Link to="/connexion" className="flex items-center gap-1.5 text-muted text-sm mb-10 hover:text-ink transition-colors w-fit">
        <ArrowLeft size={16} />
        Retour
      </Link>

      <div className="max-w-sm mx-auto w-full">
        <div className="flex items-center gap-2 text-ink font-serif font-bold text-xl mb-8">
          <BookOpen size={24} className="text-accent" />
          Pagine
        </div>

        {sent ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-accent mx-auto mb-4" />
            <h1 className="text-xl font-bold text-ink mb-2">Email envoyé !</h1>
            <p className="text-muted text-sm">
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez vos spams si besoin.
            </p>
            <Link to="/connexion" className="mt-6 inline-block text-accent text-sm font-medium hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ink mb-1">Mot de passe oublié</h1>
            <p className="text-muted text-sm mb-8">Entrez votre email pour recevoir un lien de réinitialisation.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email" type="email" placeholder="vous@exemple.fr"
                value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                error={error}
              />
              <Button type="submit" size="lg" loading={loading}>
                Envoyer le lien
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
