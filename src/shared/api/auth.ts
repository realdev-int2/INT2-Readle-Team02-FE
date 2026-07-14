import { apiRequest } from '@/shared/api/client'
import type { ApiResponse, AuthSession, Member } from '@/shared/api/types'

export function getAuthSession() {
  return apiRequest<ApiResponse<AuthSession>>('/auth/session')
}

export function getCurrentMember() {
  return apiRequest<ApiResponse<Member>>('/users/me')
}
