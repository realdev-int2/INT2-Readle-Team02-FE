import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/app/providers/AuthContext'
import { ROUTES } from '@/shared/config/routes'
import { Loading } from '@/shared/ui'

export function RequireAuth() {
  const { isLoading, member, sessionExpired } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!member) {
    const returnTo = `${location.pathname}${location.search}`
    const loginUrl = `${ROUTES.login}?${new URLSearchParams({
      ...(sessionExpired ? { authError: 'session_expired' } : {}),
      returnTo,
    })}`

    return <Navigate replace to={loginUrl} />
  }

  return <Outlet />
}
