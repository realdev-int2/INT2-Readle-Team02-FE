import { afterEach, describe, expect, it, vi } from 'vitest'
import { logout, refreshAccessToken } from '@/shared/api/auth'
import { clearAccessToken, setAccessToken } from '@/shared/api/client'

describe('refreshAccessToken', () => {
  afterEach(() => {
    clearAccessToken()
    vi.unstubAllGlobals()
  })

  it('XSRF-TOKEN cookie를 X-XSRF-TOKEN 헤더로 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { accessToken: 'access-token' } }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('document', { cookie: 'other=value; XSRF-TOKEN=csrf%2Btoken' })

    await refreshAccessToken()

    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('X-XSRF-TOKEN')).toBe(
      'csrf+token',
    )
  })

  it('logout은 XSRF cookie와 access token bearer를 함께 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=csrf%2Btoken' })
    setAccessToken('access-token')

    await logout()

    const headers = new Headers(fetchMock.mock.calls[0][1].headers)
    expect(headers.get('X-XSRF-TOKEN')).toBe('csrf+token')
    expect(headers.get('Authorization')).toBe('Bearer access-token')
  })
})
