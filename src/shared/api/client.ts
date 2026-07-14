import { ApiError, isApiErrorBody } from '@/shared/api/error'

export const API_PREFIX = '/api'

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
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

export async function apiRequest<T>(
  path: string,
  { body, headers, ...options }: ApiRequestOptions = {},
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
