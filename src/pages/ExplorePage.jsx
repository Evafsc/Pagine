import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { BookCard } from '@/components/books/BookCard'
import { FilterBar } from '@/components/books/FilterBar'
import { BookCardSkeleton } from '@/components/ui'
import { MOCK_BOOKS } from '@/lib/mockData'
import { BookOpen } from 'lucide-react'

const PAGE_SIZE = 12

export default function ExplorePage() {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ genre: '', mode: '', etat: '', sort: 'recent' })
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(new Set())
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef(null)
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')

  const fetchBooks = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 0 : page

    if (isDemo) {
      // Demo mode with mock data
      await new Promise(r => setTimeout(r, 400))
      let filtered = [...MOCK_BOOKS]
      if (query) filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase())
      )
      if (filters.genre) filtered = filtered.filter(b => b.genre === filters.genre)
      if (filters.mode) filtered = filtered.filter(b => b.mode === filters.mode)
      if (filters.etat) filtered = filtered.filter(b => b.etat === filters.etat)
      if (filters.sort === 'price_asc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
      if (filters.sort === 'price_desc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
      setBooks(reset ? filtered : prev => [...prev, ...filtered])
      setHasMore(false)
      setLoading(false)
      return
    }

    let q = supabase
      .from('books')
      .select('*, profiles(prenom, ville, avatar_url)')
      .eq('status', 'actif')
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

    if (query) q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
    if (filters.genre) q = q.eq('genre', filters.genre)
    if (filters.mode) q = q.eq('mode', filters.mode)
    if (filters.etat) q = q.eq('etat', filters.etat)
    if (filters.sort === 'price_asc') q = q.order('price', { ascending: true })
    else if (filters.sort === 'price_desc') q = q.order('price', { ascending: false })
    else q = q.order('created_at', { ascending: false })

    const { data } = await q
    if (data) {
      setBooks(prev => reset ? data : [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
      if (!reset) setPage(p => p + 1)
    }
    setLoading(false)
  }, [query, filters, page, isDemo])

  // Reset and fetch on filter change
  useEffect(() => {
    setPage(0)
    setBooks([])
    fetchBooks(true)
  }, [query, filters])

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchBooks()
    }, { threshold: 0.1 })
    if (loaderRef.current) obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, fetchBooks])

  // Load favorites
  useEffect(() => {
    if (!user || isDemo) return
    supabase.from('favorites').select('book_id').eq('user_id', user.id)
      .then(({ data }) => { if (data) setFavorites(new Set(data.map(f => f.book_id))) })
  }, [user])

  const toggleFavorite = async (bookId) => {
    if (!user) return
    if (favorites.has(bookId)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('book_id', bookId)
      setFavorites(prev => { const s = new Set(prev); s.delete(bookId); return s })
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, book_id: bookId })
      setFavorites(prev => new Set([...prev, bookId]))
    }
  }

  return (
    <div className="pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} className="text-accent" strokeWidth={2} />
            <span className="font-serif font-bold text-xl text-ink tracking-tight">Pagine</span>
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-muted pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un livre, un auteur…"
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-border rounded text-sm text-ink placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 text-muted hover:text-ink">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-4 pb-3">
          <FilterBar filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pt-4">
        {isDemo && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded px-3 py-2 mb-4">
            Mode démo — les données sont fictives. Configurez Supabase pour activer la vraie base.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onFavorite={user ? toggleFavorite : null}
              isFavorite={favorites.has(book.id)}
            />
          ))}
          {loading && Array.from({ length: 4 }).map((_, i) => <BookCardSkeleton key={i} />)}
        </div>

        {!loading && books.length === 0 && (
          <div className="text-center py-16 text-muted">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun livre trouvé</p>
            <p className="text-sm mt-1">Essayez d'autres filtres ou termes de recherche</p>
          </div>
        )}

        <div ref={loaderRef} className="h-4" />
      </div>
    </div>
  )
}
