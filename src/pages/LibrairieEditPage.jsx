import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui'

export default function LibrairieEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanniere, setUploadingBanniere] = useState(false)
  const [form, setForm] = useState({
    nom: '', adresse: '', ville: '', description: '',
    site_web: '', telephone: '', horaires: '',
    logo_url: '', banniere_url: ''
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('librairies')
        .select('*')
        .eq('id', id)
        .single()

      if (!data || data.user_id !== user?.id) {
        navigate(`/librairie/${id}`)
        return
      }

      setForm({
        nom: data.nom || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        description: data.description || '',
        site_web: data.site_web || '',
        telephone: data.telephone || '',
        horaires: data.horaires || '',
        logo_url: data.logo_url || '',
        banniere_url: data.banniere_url || '',
      })
      setLoading(false)
    }
    load()
  }, [id, user])

  const uploadImage = async (file, type) => {
    const ext = file.name.split('.').pop()
    const path = `librairies/${id}/${type}_${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('librairies')
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('librairies').getPublicUrl(path)
    return data.publicUrl
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const url = await uploadImage(file, 'logo')
      setForm(f => ({ ...f, logo_url: url }))
    } catch (err) {
      alert('Erreur upload logo')
    }
    setUploadingLogo(false)
  }

  const handleBanniereUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingBanniere(true)
    try {
      const url = await uploadImage(file, 'banniere')
      setForm(f => ({ ...f, banniere_url: url }))
    } catch (err) {
      alert('Erreur upload bannière')
    }
    setUploadingBanniere(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('librairies')
      .update(form)
      .eq('id', id)
    setSaving(false)
    if (error) { alert('Erreur lors de la sauvegarde'); return }
    navigate(`/librairie/${id}`)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="w-5 h-5 text-accent" />
    </div>
  )

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/librairie/${id}`} className="p-1"><ArrowLeft size={20} className="text-ink" /></Link>
          <p className="font-semibold text-ink">Modifier ma vitrine</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-accent text-white px-3 py-1.5 rounded-xl text-sm font-medium disabled:opacity-50">
          {saving ? <Spinner className="w-4 h-4" /> : <Save size={15} />}
          Sauvegarder
        </button>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* Bannière */}
        <div>
          <p className="text-sm font-semibold text-ink mb-2">Bannière</p>
          <div className="relative h-32 bg-accent-light rounded-2xl overflow-hidden">
            {form.banniere_url
              ? <img src={form.banniere_url} alt="bannière" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-muted text-sm">Aucune bannière</div>
            }
            <label className="absolute bottom-2 right-2 bg-white rounded-xl px-3 py-1.5 text-xs font-medium text-ink shadow flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
              {uploadingBanniere ? <Spinner className="w-3 h-3" /> : <Upload size={12} />}
              {uploadingBanniere ? 'Upload...' : 'Changer'}
              <input type="file" accept="image/*" className="hidden" onChange={handleBanniereUpload} />
            </label>
          </div>
        </div>

        {/* Logo */}
        <div>
          <p className="text-sm font-semibold text-ink mb-2">Logo</p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center overflow-hidden flex-shrink-0">
              {form.logo_url
                ? <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" />
                : <span className="text-2xl">📚</span>
              }
            </div>
            <label className="flex items-center gap-2 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-ink cursor-pointer hover:border-accent hover:text-accent transition-colors">
              {uploadingLogo ? <Spinner className="w-4 h-4" /> : <Upload size={15} />}
              {uploadingLogo ? 'Upload...' : 'Uploader un logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>

        {/* Champs texte */}
        {[
          { key: 'nom', label: 'Nom de la librairie', placeholder: 'Ex: Librairie des Abbesses' },
          { key: 'adresse', label: 'Adresse', placeholder: 'Ex: 12 rue de Rivoli' },
          { key: 'ville', label: 'Ville', placeholder: 'Ex: Paris' },
          { key: 'telephone', label: 'Téléphone', placeholder: 'Ex: 01 23 45 67 89' },
          { key: 'site_web', label: 'Site web', placeholder: 'Ex: https://malibrairie.fr' },
          { key: 'horaires', label: 'Horaires', placeholder: 'Ex: Lun-Sam 10h-19h, fermé dimanche' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-sm font-semibold text-ink mb-1.5 block">{label}</label>
            <input
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>
        ))}

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-ink mb-1.5 block">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Décrivez votre librairie, vos spécialités, votre ambiance..."
            rows={4}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none"
          />
        </div>

      </div>
    </div>
  )
}