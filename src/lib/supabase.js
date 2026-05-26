import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// Storage helpers
export const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const { data } = supabase.storage.from('book-images').getPublicUrl(path)
  return data.publicUrl
}

export const uploadImage = async (file, userId) => {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('book-images').upload(path, file)
  if (error) throw error
  return path
}
