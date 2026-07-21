import { createContext, useContext } from 'react'
import type { Member } from '@/shared/api'

export interface AuthContextValue {
  member: Member | null
  isLoading: boolean
  sessionExpired?: boolean
  consumeSessionExpired?: () => void
  invalidateAuth: (reason?: 'session_expired') => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  isLoading: true,
  invalidateAuth: () => {},
  logout: async () => {},
  member: null,
})

export function useAuth() {
  return useContext(AuthContext)
}
