import { GENRES } from '@/lib/utils'

const MODES_OPTS = [
  { value: '', label: 'Tous modes' },
  { value: 'vente', label: 'Vente' },
  { value: 'échange', label: 'Échange' },
  { value: 'don', label: 'Don' },
]

const ETAT_OPTS = [
  { value: '', label: 'Tout état' },
  { value: 'Neuf', label: 'Neuf' },
  { value: 'Très bon', label: 'Très bon' },
  { value: 'Bon', label: 'Bon' },
  { value: 'Correct', label: 'Correct' },
]

const TRI_OPTS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix ↑' },
  { value: 'price_desc', label: 'Prix ↓' },
]

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150
        ${active
          ? 'bg-accent text-white border-accent'
          : 'bg-white text-ink border-border hover:border-accent hover:text-accent'
        }`}
    >
      {children}
    </button>
  )
}

export function FilterBar({ filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val })

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
      {/* Genre */}
      <Chip active={!filters.genre} onClick={() => set('genre', '')}>Tous</Chip>
      {GENRES.map(g => (
        <Chip key={g} active={filters.genre === g} onClick={() => set('genre', g)}>{g}</Chip>
      ))}

      {/* Divider */}
      <span className="w-px bg-border flex-shrink-0 my-1" />

      {/* Mode */}
      {MODES_OPTS.slice(1).map(o => (
        <Chip key={o.value} active={filters.mode === o.value} onClick={() => set('mode', o.value)}>{o.label}</Chip>
      ))}

      <span className="w-px bg-border flex-shrink-0 my-1" />

      {/* État */}
      {ETAT_OPTS.slice(1).map(o => (
        <Chip key={o.value} active={filters.etat === o.value} onClick={() => set('etat', o.value)}>{o.label}</Chip>
      ))}

      <span className="w-px bg-border flex-shrink-0 my-1" />

      {/* Tri */}
      {TRI_OPTS.map(o => (
        <Chip key={o.value} active={filters.sort === o.value} onClick={() => set('sort', o.value)}>{o.label}</Chip>
      ))}
    </div>
  )
}
