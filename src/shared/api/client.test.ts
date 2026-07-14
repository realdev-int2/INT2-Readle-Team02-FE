import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '@/shared/api/client'

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
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
})
