import { Link } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
import { BookPlaceholder, Badge } from '@/components/ui'
import { formatPrice, modeConfig, etatConfig } from '@/lib/utils'
import { getImageUrl } from '@/lib/supabase'

export function BookCard({ book, onFavorite, isFavorite }) {
  const mc = modeConfig[book.mode]
  const ec = etatConfig[book.etat]
  const img = book.images?.[0] ? getImageUrl(book.images[0]) : null
  const price = formatPrice(book.price, book.mode)

  return (
    <Link to={`/livre/${book.id}`} className="block bg-white rounded-lg overflow-hidden border border-border active:opacity-90 transition-opacity">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-surface overflow-hidden">
        {img
          ? <img src={img} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
          : <BookPlaceholder title={book.title} className="w-full h-full" />
        }
        {/* Mode badge */}
        <div className="absolute top-2 left-2">
          <Badge className={mc.color}>{mc.label}</Badge>
        </div>
        {/* Favorite */}
        {onFavorite && (
          <button
            onClick={e => { e.preventDefault(); onFavorite(book.id) }}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            aria-label="Ajouter aux favoris"
          >
            <Heart size={14} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-muted'} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-ink line-clamp-1 leading-snug">{book.title}</p>
        <p className="text-xs text-muted mt-0.5 line-clamp-1">{book.author}</p>

        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm font-bold ${book.mode === 'vente' ? 'text-ink' : 'text-accent'}`}>
            {price}
          </span>
          {book.etat && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${ec?.color} px-1.5 py-0.5 rounded`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ec?.dot}`} />
              {book.etat}
            </span>
          )}
        </div>

        {/* Location */}
        {(book.profiles?.ville || book.ville) && (
          <div className="flex items-center gap-1 mt-1.5 text-muted">
            <MapPin size={10} strokeWidth={2} />
            <span className="text-[11px]">{book.profiles?.ville || book.ville}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
