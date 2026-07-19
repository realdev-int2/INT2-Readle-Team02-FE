import { apiRequest } from '@/shared/api/client'
import type { ApiResponse, AuthSession, Member } from '@/shared/api/types'

function getXsrfToken() {
  if (typeof document === 'undefined') {
    return undefined
  }

  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('XSRF-TOKEN='))

  if (!cookie) {
    return undefined
  }

  const value = cookie.slice('XSRF-TOKEN='.length)

  if (!value) {
    return undefined
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function getAuthSession() {
  return apiRequest<ApiResponse<AuthSession>>('/auth/session')
}

export function refreshAccessToken() {
  const xsrfToken = getXsrfToken()

  return apiRequest<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
    headers: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : undefined,
    method: 'POST',
  })
}

export function logout() {
  const xsrfToken = getXsrfToken()

  return apiRequest<void>('/auth/logout', {
    headers: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : undefined,
    method: 'POST',
  })
}

export function getCurrentMember() {
  return apiRequest<ApiResponse<Member>>('/users/me', { requiresAuth: true })
}
