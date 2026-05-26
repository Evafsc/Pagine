import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { BottomNav } from '@/components/layout/BottomNav'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Spinner } from '@/components/ui'

// Pages
import ExplorePage      from '@/pages/ExplorePage'
import BookDetailPage   from '@/pages/BookDetailPage'
import PublishPage      from '@/pages/PublishPage'
import MessagesPage     from '@/pages/MessagesPage'
import ProfilePage      from '@/pages/ProfilePage'
import LoginPage        from '@/pages/auth/LoginPage'
import RegisterPage     from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'

// Pages that hide the bottom nav
const NO_NAV = ['/connexion', '/inscription', '/mot-de-passe-oublie']

function Layout() {
  const location = useLocation()
  const showNav = !NO_NAV.includes(location.pathname)

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-surface">
      <Routes>
        {/* Public */}
        <Route path="/"               element={<ExplorePage />} />
        <Route path="/livre/:id"      element={<BookDetailPage />} />
        <Route path="/profil/:id"     element={<ProfilePage />} />
        <Route path="/connexion"      element={<LoginPage />} />
        <Route path="/inscription"    element={<RegisterPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />

        {/* Protected */}
        <Route path="/publier"   element={<AuthGuard><PublishPage /></AuthGuard>} />
        <Route path="/messages"  element={<AuthGuard><MessagesPage /></AuthGuard>} />
        <Route path="/profil"    element={<AuthGuard><ProfilePage /></AuthGuard>} />

        {/* 404 */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
            <p className="text-5xl font-bold text-ink mb-2">404</p>
            <p className="text-muted mb-6">Page introuvable</p>
            <a href="/" className="text-accent font-medium hover:underline">Retour à l'accueil</a>
          </div>
        } />
      </Routes>

      {showNav && <BottomNav />}
    </div>
  )
}

function AppInit() {
  const { init, loading } = useAuthStore()

  useEffect(() => { init() }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <Spinner className="w-6 h-6 text-accent" />
    </div>
  )

  return <Layout />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
    </BrowserRouter>
  )
}
