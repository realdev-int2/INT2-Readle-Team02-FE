import { ApiError, isApiErrorBody } from '@/shared/api/error'

export const API_PREFIX = '/api'

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  requiresAuth?: boolean
}

let accessToken: string | null = null
let authHandlers: AuthHandlers | null = null
let refreshPromise: Promise<boolean> | null = null

interface AuthHandlers {
  refresh: () => Promise<void>
  invalidate: () => void
}

export function setAccessToken(token: string) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

export function registerAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers

  return () => {
    if (authHandlers === handlers) {
      authHandlers = null
    }
  }
}

function createApiUrl(path: string) {
  if (!path.startsWith('/')) {
    throw new Error(`API path는 '/'로 시작해야 합니다: ${path}`)
  }

  return `${API_PREFIX}${path}`
}

function createRequestBody(body: unknown) {
  if (body === undefined || body instanceof FormData) {
    return body
  }

  return JSON.stringify(body)
}

function createHeaders(body: unknown, headers?: HeadersInit) {
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !(body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (accessToken && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  requestHeaders.set('Accept', 'application/json')

  return requestHeaders
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('Content-Type')

  if (!contentType?.includes('application/json')) {
    return undefined
  }

  try {
    return await response.json()
  } catch {
    throw new ApiError({
      status: response.status,
      code: 'INVALID_RESPONSE',
      message: '서버 응답을 해석하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }
}

function isAuthRetryExcluded(path: string) {
  return path === '/auth/session' || path === '/auth/refresh' || path === '/auth/logout'
}

async function refreshForProtectedRequest() {
  if (!authHandlers) {
    return false
  }

  if (!refreshPromise) {
    const handlers = authHandlers

    refreshPromise = handlers
      .refresh()
      .then(() => true)
      .catch(() => {
        handlers.invalidate()
        return false
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function apiRequest<T>(
  path: string,
  requestOptions: ApiRequestOptions = {},
): Promise<T> {
  return sendApiRequest(path, requestOptions)
}

async function sendApiRequest<T>(
  path: string,
  { body, headers, requiresAuth = false, ...options }: ApiRequestOptions,
  retried = false,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(createApiUrl(path), {
      ...options,
      body: createRequestBody(body),
      credentials: 'same-origin',
      headers: createHeaders(body, headers),
    })
  } catch {
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: '네트워크 연결을 확인한 후 다시 시도해 주세요.',
    })
  }

  const shouldRefresh = requiresAuth && !isAuthRetryExcluded(path)

  if (response.status === 401 && shouldRefresh) {
    if (!retried && (await refreshForProtectedRequest())) {
      return sendApiRequest(path, { body, headers, requiresAuth, ...options }, true)
    }

    if (retried) {
      authHandlers?.invalidate()
    }
  }

  const responseBody = await parseResponseBody(response)

  if (!response.ok) {
    if (isApiErrorBody(responseBody)) {
      throw new ApiError({ status: response.status, ...responseBody.error })
    }

    throw new ApiError({
      status: response.status,
      code: 'UNKNOWN_ERROR',
      message: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    })
  }

  return responseBody as T
}
