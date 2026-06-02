import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BookCard } from '@/components/books/BookCard'
import { FilterBar } from '@/components/books/FilterBar'
import { BookCardSkeleton } from '@/components/ui'

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ genre: '', mode: '', etat: '', sort: 'recent' })
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('books')
        .select('*, profiles(id, prenom, ville, role)')
        .eq('status', 'actif')
        .order('created_at', { ascending: false })

      if (query) q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      if (filters.genre) q = q.eq('genre', filters.genre)
      if (filters.mode) q = q.eq('mode', filters.mode)
      if (filters.etat) q = q.eq('etat', filters.etat)
      if (filters.sort === 'price_asc') q = q.order('price', { ascending: true })
      else if (filters.sort === 'price_desc') q = q.order('price', { ascending: false })

      const { data, error } = await q
      if (error) console.error('Supabase error:', error)
      setBooks(data || [])
    } catch (e) {
      console.error('Fetch error:', e)
      setBooks([])
    }
    setLoading(false)
  }, [query, filters])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#faf6f0', borderBottom: '1px solid #f0e6d3', padding: '16px 16px 12px' }}>

        {/* Logo SVG inline */}
        <div style={{ marginBottom: 12 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" style={{ height: 38, width: 'auto' }}>
            <rect x="5" y="9" width="62" height="82" rx="7" fill="#5a2010" opacity="0.12" transform="translate(3,3)"/>
            <path d="M5 13 L0 18 L0 85 L5 81 Z" fill="#6e2e18"/>
            <rect x="5" y="9" width="62" height="82" rx="7" fill="#a85432"/>
            <rect x="5" y="9" width="11" height="82" fill="#8a4128"/>
            <rect x="5" y="9" width="3" height="82" fill="#7a3820"/>
            <circle cx="10" cy="27" r="1.8" fill="#6e2e18" opacity="0.6"/>
            <circle cx="10" cy="50" r="1.8" fill="#6e2e18" opacity="0.6"/>
            <circle cx="10" cy="73" r="1.8" fill="#6e2e18" opacity="0.6"/>
            <line x1="19" y1="19" x2="60" y2="19" stroke="#e8c9a0" strokeWidth="1" opacity="0.5"/>
            <line x1="19" y1="81" x2="60" y2="81" stroke="#e8c9a0" strokeWidth="1" opacity="0.5"/>
            <text x="37" y="68" textAnchor="middle" fontFamily="Lora, Georgia, serif" fontSize="52" fontWeight="700" fontStyle="italic" fill="white">P</text>
            <text x="78" y="68" fontFamily="Lora, Georgia, serif" fontSize="58" fontWeight="700" fontStyle="italic" fill="#2c1810">agine</text>
          </svg>
        </div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} color="#7c6057" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un livre, un auteur…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: 36, paddingTop: 10, paddingBottom: 10, border: '1.5px solid #f0e6d3', borderRadius: 8, fontSize: 14, color: '#2c1810', background: 'white', outline: 'none', boxSizing: 'border-box' }}
          />
          {query && <X size={14} color="#7c6057" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setQuery('')} />}
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {books.map(book => <BookCard key={book.id} book={book} />)}
          {loading && Array.from({ length: 4 }).map((_, i) => <BookCardSkeleton key={i} />)}
        </div>
        {!loading && books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#7c6057' }}>
            <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: 500 }}>Aucun livre trouvé</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Essayez d'autres filtres ou termes de recherche</p>
          </div>
        )}
      </div>
    </div>
  )
}