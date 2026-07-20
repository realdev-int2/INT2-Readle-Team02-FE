import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  getAuthSession,
  getCurrentMember,
  logout as logoutRequest,
  refreshAccessToken,
} from '@/shared/api/auth'
import {
  clearAccessToken,
  registerAuthHandlers,
  setAccessToken,
} from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { Member } from '@/shared/api'
import { AuthContext } from '@/app/providers/AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

// eslint-disable-next-line react-refresh/only-export-components
export async function restoreAuth(isCancelled: () => boolean = () => false): Promise<Member | null> {
  try {
    const {
      data: { authenticated },
    } = await getAuthSession()

    if (!authenticated) {
      return null
    }

    const {
      data: { accessToken },
    } = await refreshAccessToken()

    if (isCancelled()) {
      return null
    }

    setAccessToken(accessToken)
    const { data: currentMember } = await getCurrentMember()

    return currentMember
  } catch {
    if (!isCancelled()) {
      clearAccessToken()
    }

    return null
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [member, setMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  const invalidateAuth = useCallback((reason?: 'session_expired') => {
    clearAccessToken()
    setMember(null)
    setSessionExpired(reason === 'session_expired')
  }, [])

  const consumeSessionExpired = useCallback(() => {
    setSessionExpired(false)
  }, [])

  const refreshAuth = useCallback(async () => {
    const {
      data: { accessToken },
    } = await refreshAccessToken()

    setAccessToken(accessToken)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
      invalidateAuth()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        invalidateAuth()
        return
      }

      throw error
    }
  }, [invalidateAuth])

  useEffect(() => {
    return registerAuthHandlers({ invalidate: invalidateAuth, refresh: refreshAuth })
  }, [invalidateAuth, refreshAuth])

  useEffect(() => {
    let cancelled = false

    void restoreAuth(() => cancelled).then((currentMember) => {
      if (!cancelled) {
        setMember(currentMember)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
      clearAccessToken()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ consumeSessionExpired, invalidateAuth, isLoading, logout, member, sessionExpired }}
    >
      {children}
    </AuthContext.Provider>
  )
}
