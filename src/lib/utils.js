export const formatPrice = (price, mode) => {
  if (mode === 'don') return 'Gratuit'
  if (mode === 'échange') return 'Échange'
  if (!price) return '—'
  return `${Number(price).toFixed(2).replace('.', ',')} €`
}

export const etatConfig = {
  'Neuf':      { color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
  'Très bon':  { color: 'text-green-700 bg-green-50',     dot: 'bg-green-500'   },
  'Bon':       { color: 'text-amber-700 bg-amber-50',     dot: 'bg-amber-500'   },
  'Correct':   { color: 'text-orange-700 bg-orange-50',   dot: 'bg-orange-500'  },
}

export const modeConfig = {
  vente:    { label: 'Vente',    color: 'text-accent bg-accent-light' },
  échange:  { label: 'Échange', color: 'text-blue-700 bg-blue-50'    },
  don:      { label: 'Don',     color: 'text-rose-700 bg-rose-50'    },
}

export const GENRES = ['Roman', 'SF', 'BD', 'Manga', 'Sciences humaines', 'Scolaire', 'Jeunesse', 'Développement personnel', 'Autre']
export const ETATS = ['Neuf', 'Très bon', 'Bon', 'Correct']
export const MODES = ['vente', 'échange', 'don']

export const getInitials = (name) =>
  name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
