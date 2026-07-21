import type { ApiErrorBody, ApiErrorDetail } from '@/shared/api/types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetail[]

  constructor({
    status,
    code,
    message,
    details = [],
  }: {
    status: number
    code: string
    message: string
    details?: ApiErrorDetail[]
  }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function isSessionExpired(error: unknown) {
  return error instanceof ApiError && error.status === 401 && error.code === 'INVALID_REFRESH_TOKEN'
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== 'object' || !('error' in value)) {
    return false
  }

  const error = value.error

  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string' &&
    'details' in error &&
    Array.isArray(error.details)
  )
}
