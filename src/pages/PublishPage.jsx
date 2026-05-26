import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, X, CheckCircle, ChevronRight } from 'lucide-react'
import { supabase, uploadImage } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button, Input, Textarea, Select } from '@/components/ui'
import { GENRES, ETATS } from '@/lib/utils'

const MODES = [
  { value: 'vente', label: 'Vente', desc: 'Fixer un prix' },
  { value: 'échange', label: 'Échange', desc: 'Troquer contre un autre livre' },
  { value: 'don', label: 'Don gratuit', desc: 'Offrir à la communauté' },
]

export default function PublishPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileRef = useRef()
  const [photos, setPhotos] = useState([])
  const [form, setForm] = useState({ title: '', author: '', genre: 'Roman', etat: 'Très bon', mode: 'vente', price: '', description: '', isbn: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const addPhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - photos.length)
    const previews = files.map(f => ({ file: f, url: URL.createObjectURL(f) }))
    setPhotos(prev => [...prev, ...previews].slice(0, 4))
  }

  const removePhoto = (i) => setPhotos(prev => prev.filter((_, idx) => idx !== i))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Titre requis'
    if (!form.author.trim()) e.author = 'Auteur requis'
    if (form.mode === 'vente' && !form.price) e.price = 'Prix requis pour une vente'
    if (form.mode === 'vente' && form.price && isNaN(Number(form.price.replace(',', '.')))) e.price = 'Prix invalide'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')
    if (isDemo) {
      await new Promise(r => setTimeout(r, 1200))
      setDone({ id: 'demo-' + Date.now() })
      setLoading(false)
      return
    }
    try {
      const imageUrls = await Promise.all(photos.map(p => uploadImage(p.file, user.id)))
      const { data, error } = await supabase.from('books').insert({
        seller_id: user.id,
        title: form.title.trim(),
        author: form.author.trim(),
        genre: form.genre,
        etat: form.etat,
        mode: form.mode,
        price: form.mode === 'vente' ? Number(form.price.replace(',', '.')) : null,
        description: form.description.trim() || null,
        isbn: form.isbn.trim() || null,
        images: imageUrls,
      }).select().single()
      if (error) throw error
      setDone(data)
    } catch (err) {
      setErrors({ _: err.message })
    }
    setLoading(false)
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <CheckCircle size={56} className="text-accent mb-4" />
      <h1 className="text-2xl font-bold text-ink mb-2">Annonce publiée !</h1>
      <p className="text-muted text-sm mb-8">Votre livre est maintenant visible par tous les lecteurs de Pagine.</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {done.id !== 'demo-' + Date.now() && (
          <Button onClick={() => navigate(`/livre/${done.id}`)}>
            Voir l'annonce <ChevronRight size={16} />
          </Button>
        )}
        <Button variant="secondary" onClick={() => { setDone(null); setForm({ title: '', author: '', genre: 'Roman', etat: 'Très bon', mode: 'vente', price: '', description: '', isbn: '' }); setPhotos([]) }}>
          Publier un autre livre
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </div>
    </div>
  )

  return (
    <div className="pb-safe px-4 pt-5">
      <h1 className="text-xl font-bold text-ink mb-5">Publier un livre</h1>

      {errors._ && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-3 mb-5">{errors._}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos */}
        <div>
          <p className="text-sm font-medium text-ink mb-2">Photos <span className="text-muted font-normal">(jusqu'à 4)</span></p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-border">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted hover:border-accent hover:text-accent transition-colors">
                <Camera size={22} />
                <span className="text-xs">Ajouter</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
          </div>
        </div>

        {/* Infos */}
        <div className="space-y-4">
          <Input label="Titre *" placeholder="Ex. L'Alchimiste" value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} />
          <Input label="Auteur *" placeholder="Ex. Paulo Coelho" value={form.author} onChange={e => set('author', e.target.value)} error={errors.author} />
          <Select label="Catégorie" value={form.genre} onChange={e => set('genre', e.target.value)}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </Select>
          <Input label="ISBN (optionnel)" placeholder="Ex. 9782070612888" value={form.isbn} onChange={e => set('isbn', e.target.value)} inputMode="numeric" />
        </div>

        {/* État */}
        <div>
          <p className="text-sm font-medium text-ink mb-2">État *</p>
          <div className="grid grid-cols-4 gap-2">
            {ETATS.map(e => (
              <button key={e} type="button" onClick={() => set('etat', e)}
                className={`py-2.5 rounded text-xs font-medium border transition-colors
                  ${form.etat === e ? 'bg-accent text-white border-accent' : 'bg-white text-ink border-border hover:border-accent'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div>
          <p className="text-sm font-medium text-ink mb-2">Mode de cession *</p>
          <div className="space-y-2">
            {MODES.map(m => (
              <button key={m.value} type="button" onClick={() => set('mode', m.value)}
                className={`w-full flex items-center gap-3 p-3.5 rounded border text-left transition-colors
                  ${form.mode === m.value ? 'border-accent bg-accent-light' : 'border-border bg-white hover:border-accent'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${form.mode === m.value ? 'border-accent' : 'border-muted'}`}>
                  {form.mode === m.value && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{m.label}</p>
                  <p className="text-xs text-muted">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        {form.mode === 'vente' && (
          <Input
            label="Prix (€) *" type="number" placeholder="Ex. 5" min="0" step="0.50"
            value={form.price} onChange={e => set('price', e.target.value)} error={errors.price}
            inputMode="decimal"
          />
        )}

        {/* Description */}
        <Textarea
          label="Description" placeholder="Décrivez l'état du livre, les annotations éventuelles, pourquoi vous le vendez…"
          value={form.description} onChange={e => set('description', e.target.value)}
          rows={4}
        />

        <Button type="submit" size="lg" loading={loading}>
          {loading ? 'Publication en cours…' : 'Publier l\'annonce'}
        </Button>
      </form>
    </div>
  )
}
