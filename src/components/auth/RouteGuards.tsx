import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AuthLoading() {
  return <main className="grid min-h-screen place-items-center bg-[#fffdfa] text-orange-500 dark:bg-[#08111f]"><div className="size-8 animate-spin rounded-full border-2 border-orange-500/20 border-t-orange-500" /></main>
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <AuthLoading />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <AuthLoading />
  return user ? <Navigate to="/app" replace /> : <Outlet />
}
