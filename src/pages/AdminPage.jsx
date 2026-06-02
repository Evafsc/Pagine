import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui'
import { Users, BookOpen, MessageCircle, TrendingUp, ArrowLeft, ShieldAlert, Store, Check, X } from 'lucide-react'

const ADMIN_EMAIL = 'evadoria09@gmail.com'
const ADMIN_ID = '2197b10d-9423-45be-823e-5773b3903359'

function BarChart({ data, color = '#a85432' }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-20 mt-3">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-sm transition-all duration-300"
            style={{ height: `${Math.max((d.count / max) * 72, d.count > 0 ? 4 : 0)}px`, background: color, opacity: 0.85 }} />
          <span className="text-[9px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, chart }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-xs font-medium text-muted uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-ink mt-2">{value ?? '—'}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
      {chart && <BarChart data={chart} color={color} />}
    </div>
  )
}

function LibrairieRequests() {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase
      .from('librairies')
      .select('*')
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: false })
    setDemandes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const approuver = async (id, user_id) => {
    await supabase.from('librairies').update({ statut: 'approuve' }).eq('id', id)
    await supabase.from('profiles').update({ role: 'librairie' }).eq('id', user_id)

    // Notification par message
    const { data: conv } = await supabase
      .from('conversations')
      .insert({ buyer_id: user_id, seller_id: ADMIN_ID, book_id: null })
      .select()
      .single()

    if (conv) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id: ADMIN_ID,
        content: '🎉 Félicitations ! Votre librairie a été approuvée sur Pagine. Vous pouvez maintenant personnaliser votre vitrine et publier vos annonces.'
      })
    }

    load()
  }

  const refuser = async (id, user_id) => {
    await supabase.from('librairies').update({ statut: 'refuse' }).eq('id', id)
    await supabase.from('profiles').update({ role: 'particulier' }).eq('id', user_id)
    load()
  }

  if (loading) return <div className="text-center py-4 text-muted text-sm">Chargement...</div>

  return (
    <div className="bg-white rounded-lg border border-border p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Store size={16} className="text-accent" />
        <h2 className="text-sm font-semibold text-ink">Demandes librairies</h2>
        {demandes.length > 0 && (
          <span className="ml-auto text-xs bg-accent text-white px-2 py-0.5 rounded-full">{demandes.length}</span>
        )}
      </div>

      {demandes.length === 0 && (
        <p className="text-xs text-muted text-center py-2">Aucune demande en attente</p>
      )}

      {demandes.map(d => (
        <div key={d.id} className="border border-border rounded-xl p-3 mb-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-ink">{d.nom}</p>
              <p className="text-xs text-muted">{d.ville}{d.adresse ? ` — ${d.adresse}` : ''}</p>
            </div>
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">En attente</span>
          </div>

          {d.siret && (
            <div className="mb-2">
              <p className="text-xs text-muted">SIRET</p>
              <a href={`https://www.societe.com/cgi-bin/recherche?rncs=${d.siret}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-accent font-medium underline">{d.siret} — Vérifier sur societe.com →</a>
            </div>
          )}

          {d.description && (
            <p className="text-xs text-muted mb-2 italic">"{d.description}"</p>
          )}

          {d.site_web && (
            <a href={d.site_web} target="_blank" rel="noopener noreferrer"
              className="text-xs text-accent underline block mb-2">{d.site_web}</a>
          )}

          <p className="text-xs text-muted mb-3">
            Demande reçue le {new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="flex gap-2">
            <button onClick={() => approuver(d.id, d.user_id)}
              className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white rounded-lg py-2 text-xs font-medium">
              <Check size={13} /> Approuver
            </button>
            <button onClick={() => refuser(d.id, d.user_id)}
              className="flex-1 flex items-center justify-center gap-1 bg-red-400 text-white rounded-lg py-2 text-xs font-medium">
              <X size={13} /> Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentBooks, setRecentBooks] = useState([])
  const isAdmin = user?.email === ADMIN_EMAIL
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { date: d.toISOString().split('T')[0], label: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2) }
  })

  const bucketByDay = (rows, dateField) =>
    last7Days.map(({ date, label }) => ({ label, count: rows.filter(r => r[dateField]?.startsWith(date)).length }))

  useEffect(() => {
    if (!isAdmin && !isDemo) return
    const load = async () => {
      if (isDemo) {
        setStats({ users: 3, books: 5, messages: 12, active_books: 4, vente: 3, echange: 1, don: 1 })
        setLoading(false)
        return
      }
      const [
        { count: users }, { count: books }, { count: messages }, { count: active_books },
        { data: recentU }, { data: recentB }, { data: allBooks }, { data: allMessages }, { data: allUsers },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }).eq('status', 'actif'),
        supabase.from('profiles').select('prenom, ville, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('books').select('title, author, mode, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('books').select('mode, created_at').gte('created_at', last7Days[0].date),
        supabase.from('messages').select('created_at').gte('created_at', last7Days[0].date),
        supabase.from('profiles').select('created_at').gte('created_at', last7Days[0].date),
      ])
      setStats({
        users, books, messages, active_books,
        vente: allBooks?.filter(b => b.mode === 'vente').length || 0,
        echange: allBooks?.filter(b => b.mode === 'échange').length || 0,
        don: allBooks?.filter(b => b.mode === 'don').length || 0,
        usersByDay: bucketByDay(allUsers || [], 'created_at'),
        booksByDay: bucketByDay(allBooks || [], 'created_at'),
        msgsByDay: bucketByDay(allMessages || [], 'created_at'),
      })
      setRecentUsers(recentU || [])
      setRecentBooks(recentB || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <ShieldAlert size={40} className="text-muted mb-3" />
      <p className="font-semibold text-ink mb-2">Connectez-vous d'abord</p>
      <button onClick={() => navigate('/connexion')} className="mt-4 px-4 py-2 bg-accent text-white rounded text-sm font-medium">Se connecter</button>
    </div>
  )

  if (!isAdmin && !isDemo) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <ShieldAlert size={40} className="text-red-400 mb-3" />
      <p className="font-semibold text-ink mb-2">Accès refusé</p>
      <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-accent text-white rounded text-sm font-medium">Retour</button>
    </div>
  )

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner className="w-6 h-6 text-accent" /></div>

  return (
    <div className="pb-8 px-4 pt-5 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="p-1.5 rounded hover:bg-surface transition-colors">
          <ArrowLeft size={18} className="text-muted" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-ink">Dashboard Pagine</h1>
          <p className="text-xs text-muted">Vue d'ensemble en temps réel</p>
        </div>
      </div>

      <LibrairieRequests />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard icon={Users} label="Utilisateurs" value={stats?.users} sub="comptes créés" color="#a85432" chart={stats?.usersByDay} />
        <StatCard icon={BookOpen} label="Annonces" value={stats?.books} sub={`${stats?.active_books} actives`} color="#2d6a4f" chart={stats?.booksByDay} />
        <StatCard icon={MessageCircle} label="Messages" value={stats?.messages} sub="échangés" color="#1565c0" chart={stats?.msgsByDay} />
        <StatCard icon={TrendingUp} label="Livres/user" value={stats?.users ? `${Math.round((stats.books / stats.users) * 10) / 10}` : '—'} sub="en moyenne" color="#7c3aed" />
      </div>

      <div className="bg-white rounded-lg border border-border p-4 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-3">Répartition des annonces</h2>
        {[['Vente', stats?.vente, '#a85432'], ['Échange', stats?.echange, '#1565c0'], ['Don', stats?.don, '#c62828']].map(([label, count, color]) => {
          const pct = stats?.books ? Math.round((count / stats.books) * 100) : 0
          return (
            <div key={label} className="mb-2.5">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">{label}</span>
                <span className="font-medium text-ink">{count} <span className="text-muted font-normal">({pct}%)</span></span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          )
        })}
      </div>

      {recentUsers.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-4 mb-4">
          <h2 className="text-sm font-semibold text-ink mb-3">Derniers inscrits</h2>
          {recentUsers.map((u, i) => (
            <div key={i} className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-xs font-semibold text-accent">{u.prenom?.[0]?.toUpperCase()}</div>
                <div>
                  <p className="text-sm font-medium text-ink">{u.prenom}</p>
                  {u.ville && <p className="text-xs text-muted">{u.ville}</p>}
                </div>
              </div>
              <span className="text-xs text-muted">{new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>
          ))}
        </div>
      )}

      {recentBooks.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold text-ink mb-3">Dernières annonces</h2>
          {recentBooks.map((b, i) => (
            <div key={i} className="flex items-center justify-between mb-2.5">
              <div>
                <p className="text-sm font-medium text-ink line-clamp-1">{b.title}</p>
                <p className="text-xs text-muted">{b.author}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${b.mode === 'vente' ? 'bg-accent-light text-accent' : b.mode === 'échange' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>{b.mode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}