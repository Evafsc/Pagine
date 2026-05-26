import { getInitials } from '@/lib/utils'

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none rounded'
  const variants = {
    primary: 'bg-accent text-white hover:bg-opacity-90 active:scale-[0.98]',
    secondary: 'border border-border text-ink bg-white hover:bg-surface active:scale-[0.98]',
    ghost: 'text-muted hover:text-ink hover:bg-surface',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base w-full',
  }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <input
        className={`w-full px-3.5 py-2.5 bg-white border rounded text-sm text-ink placeholder:text-muted
          transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent
          ${error ? 'border-red-400' : 'border-border'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <textarea
        className={`w-full px-3.5 py-2.5 bg-white border rounded text-sm text-ink placeholder:text-muted
          transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent resize-none
          ${error ? 'border-red-400' : 'border-border'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <select
        className={`w-full px-3.5 py-2.5 bg-white border rounded text-sm text-ink
          transition-colors duration-150 focus:border-accent focus:ring-1 focus:ring-accent
          ${error ? 'border-red-400' : 'border-border'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' }
  const cls = `${sizes[size]} rounded-full bg-accent-light text-accent font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden`
  return src
    ? <img src={src} alt={name} className={`${cls} object-cover`} />
    : <div className={cls}>{getInitials(name)}</div>
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ className = 'w-5 h-5' }) {
  return (
    <svg className={`animate-spin text-current ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  )
}

// ── BookPlaceholder (no image fallback) ───────────────────────────────────────
export function BookPlaceholder({ title, className = '' }) {
  const colors = [
    'from-emerald-100 to-emerald-200 text-emerald-700',
    'from-blue-100 to-blue-200 text-blue-700',
    'from-amber-100 to-amber-200 text-amber-700',
    'from-rose-100 to-rose-200 text-rose-700',
    'from-purple-100 to-purple-200 text-purple-700',
    'from-teal-100 to-teal-200 text-teal-700',
  ]
  const idx = title ? title.charCodeAt(0) % colors.length : 0
  return (
    <div className={`flex items-end justify-start bg-gradient-to-br ${colors[idx]} p-3 ${className}`}>
      <span className="text-xs font-medium leading-tight line-clamp-2 opacity-80">{title}</span>
    </div>
  )
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ value, count, size = 'sm' }) {
  const stars = Math.round(value * 2) / 2
  const cls = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <span className={`flex items-center gap-1 ${cls}`}>
      <span className="text-amber-400">
        {[1,2,3,4,5].map(i => (
          <span key={i}>{i <= stars ? '★' : '☆'}</span>
        ))}
      </span>
      <span className="text-muted text-xs">{value?.toFixed(1)}{count !== undefined && ` (${count})`}</span>
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-border">
      <Skeleton className="w-full aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
