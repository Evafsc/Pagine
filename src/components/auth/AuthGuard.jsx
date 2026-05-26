import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui'

export function AuthGuard({ children }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-6 h-6 text-accent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  return children
}
