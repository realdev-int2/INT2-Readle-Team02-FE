import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apiRequest,
  clearAccessToken,
  registerAuthHandlers,
  setAccessToken,
} from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

describe('apiRequest', () => {
  let unregisterAuthHandlers: (() => void) | undefined

  afterEach(() => {
    unregisterAuthHandlers?.()
    unregisterAuthHandlers = undefined
    clearAccessToken()
    vi.unstubAllGlobals()
  })

  it('설정된 access token을 Authorization에 붙이고 clear 이후에는 붙이지 않는다', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        Promise.resolve(
          new Response(JSON.stringify({ data: {} }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }),
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    setAccessToken('access-token')
    await apiRequest('/contents')

    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe(
      'Bearer access-token',
    )

    clearAccessToken()
    await apiRequest('/contents')

    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('Authorization')).toBeNull()
  })

  it('명시한 Authorization 헤더는 access token으로 덮어쓰지 않는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: {} }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    setAccessToken('access-token')

    await apiRequest('/contents', { headers: { Authorization: 'Bearer explicit-token' } })

    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe(
      'Bearer explicit-token',
    )
  })

  it('모든 요청에 /api prefix를 붙이고 성공 응답을 반환한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { contentId: 101 } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiRequest<{ data: { contentId: number } }>('/contents')

    expect(result.data.contentId).toBe(101)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contents',
      expect.objectContaining({ credentials: 'same-origin' }),
    )
  })

  it('서버의 공통 오류 응답을 ApiError로 변환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_INPUT',
              message: '요청 값을 확인해 주세요.',
              details: [],
            },
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
          },
        ),
      ),
    )

    await expect(apiRequest('/contents')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      message: '요청 값을 확인해 주세요.',
      status: 400,
    })
  })

  it('JSON 오류 형식이 아니면 안전한 기본 오류를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('Bad Gateway', {
          headers: { 'Content-Type': 'text/plain' },
          status: 502,
        }),
      ),
    )

    await expect(apiRequest('/contents')).rejects.toMatchObject({
      code: 'UNKNOWN_ERROR',
      status: 502,
    })
  })

  it('JSON 응답 파싱에 실패하면 INVALID_RESPONSE를 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{invalid json', {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }),
      ),
    )

    await expect(apiRequest('/contents')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      status: 200,
    })
  })

  it('네트워크 요청 실패를 NETWORK_ERROR로 변환한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiRequest('/contents')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    })
  })

  it('보호된 요청의 첫 401은 한 번 refresh하고 한 번 재시도한다', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined)
    unregisterAuthHandlers = registerAuthHandlers({ invalidate: vi.fn(), refresh })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { code: 'UNAUTHORIZED', details: [], message: '로그인이 필요합니다.' } },
          401,
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { contentId: 101 } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/contents', { requiresAuth: true })).resolves.toEqual({
      data: { contentId: 101 },
    })

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('동시 보호 요청은 하나의 refresh를 공유한다', async () => {
    let resolveRefresh: () => void = () => {}
    let signalRefreshStarted: () => void = () => {}
    const refreshStarted = new Promise<void>((resolve) => {
      signalRefreshStarted = resolve
    })
    const refresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve
          signalRefreshStarted()
        }),
    )
    unregisterAuthHandlers = registerAuthHandlers({ invalidate: vi.fn(), refresh })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse(
            { error: { code: 'UNAUTHORIZED', details: [], message: '로그인이 필요합니다.' } },
            401,
          ),
        )
        .mockResolvedValueOnce(
          jsonResponse(
            { error: { code: 'UNAUTHORIZED', details: [], message: '로그인이 필요합니다.' } },
            401,
          ),
        )
        .mockResolvedValueOnce(jsonResponse({ data: { id: 1 } }))
        .mockResolvedValueOnce(jsonResponse({ data: { id: 2 } })),
    )

    const requests = [
      apiRequest('/contents/1', { requiresAuth: true }),
      apiRequest('/contents/2', { requiresAuth: true }),
    ]
    await refreshStarted
    resolveRefresh()

    await expect(Promise.all(requests)).resolves.toEqual([
      { data: { id: 1 } },
      { data: { id: 2 } },
    ])
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('보호된 요청의 다른 refresh 실패는 인증 상태를 유지하고 오류를 전파한다', async () => {
    const invalidate = vi.fn()
    const refreshError = new ApiError({
      code: 'OTHER_REFRESH_ERROR',
      message: '다른 refresh 오류',
      status: 401,
    })
    unregisterAuthHandlers = registerAuthHandlers({
      invalidate,
      refresh: vi.fn().mockRejectedValue(refreshError),
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: 'UNAUTHORIZED', details: [], message: '로그인이 필요합니다.' } },
          401,
        ),
      ),
    )

    await expect(apiRequest('/contents', { requiresAuth: true })).rejects.toBe(refreshError)

    expect(invalidate).not.toHaveBeenCalled()
  })

  it('보호된 요청의 401 뒤 INVALID_REFRESH_TOKEN refresh 실패만 session_expired로 무효화한다', async () => {
    const invalidate = vi.fn()
    unregisterAuthHandlers = registerAuthHandlers({
      invalidate,
      refresh: vi.fn().mockRejectedValue(
        new ApiError({
          code: 'INVALID_REFRESH_TOKEN',
          message: 'refresh token이 만료되었습니다.',
          status: 401,
        }),
      ),
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: 'UNAUTHORIZED', details: [], message: '로그인이 필요합니다.' } },
          401,
        ),
      ),
    )

    await expect(apiRequest('/contents', { requiresAuth: true })).rejects.toMatchObject({
      status: 401,
    })

    expect(invalidate).toHaveBeenCalledWith('session_expired')
  })

  it.each([
    new ApiError({ code: 'INVALID_REFRESH_TOKEN', message: 'CSRF 실패', status: 403 }),
    new ApiError({ code: 'OTHER_REFRESH_ERROR', message: '다른 refresh 오류', status: 401 }),
    new ApiError({ code: 'UNKNOWN_ERROR', message: '서버 오류', status: 500 }),
    new ApiError({ code: 'INVALID_RESPONSE', message: '응답 형식 오류', status: 200 }),
    new TypeError('Failed to fetch'),
  ])('다른 refresh 실패는 인증 상태를 유지한다: %s', async (refreshError) => {
    const invalidate = vi.fn()
    unregisterAuthHandlers = registerAuthHandlers({
      invalidate,
      refresh: vi.fn().mockRejectedValue(refreshError),
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: 'UNAUTHORIZED', details: [], message: '로그인이 필요합니다.' } },
          401,
        ),
      ),
    )

    await expect(apiRequest('/contents', { requiresAuth: true })).rejects.toBe(refreshError)

    expect(invalidate).not.toHaveBeenCalled()
  })

  it('재시도한 보호 요청의 401은 인증 상태를 유지하고 전파한다', async () => {
    const invalidate = vi.fn()
    unregisterAuthHandlers = registerAuthHandlers({
      invalidate,
      refresh: vi.fn().mockResolvedValue(undefined),
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse(
            { error: { code: 'UNAUTHORIZED', details: [], message: '로그인이 필요합니다.' } },
            401,
          ),
        )
        .mockResolvedValueOnce(
          jsonResponse(
            { error: { code: 'UNAUTHORIZED', details: [], message: '로그인이 필요합니다.' } },
            401,
          ),
        ),
    )

    await expect(apiRequest('/contents', { requiresAuth: true })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    })

    expect(invalidate).not.toHaveBeenCalled()
  })

  it.each(['/auth/session', '/auth/refresh', '/auth/logout'])(
    '%s 요청은 401이어도 자동 refresh하지 않는다',
    async (path) => {
      const refresh = vi.fn().mockResolvedValue(undefined)
      const invalidate = vi.fn()
      unregisterAuthHandlers = registerAuthHandlers({ invalidate, refresh })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          jsonResponse(
            {
              error: {
                code: 'UNAUTHORIZED',
                details: [],
                message: '로그인이 필요합니다.',
              },
            },
            401,
          ),
        ),
      )

      await expect(apiRequest(path, { requiresAuth: true })).rejects.toMatchObject({
        status: 401,
      })

      expect(refresh).not.toHaveBeenCalled()
      expect(invalidate).not.toHaveBeenCalled()
    },
  )
})
