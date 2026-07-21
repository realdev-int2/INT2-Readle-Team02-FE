// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, clearAccessToken } from '@/shared/api/client'
import {
  getAuthSession,
  getCurrentMember,
  logout as logoutRequest,
  refreshAccessToken,
} from '@/shared/api/auth'
import { ApiError } from '@/shared/api/error'
import { AuthProvider, restoreAuth } from '@/app/providers/AuthProvider'

const authContext = vi.hoisted(() => ({
  isLoading: true,
  logout: null as null | (() => Promise<void>),
  sessionExpired: false,
}))

vi.mock('@/shared/api/auth', () => ({
  getAuthSession: vi.fn(),
  getCurrentMember: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

vi.mock('@/app/providers/AuthContext', () => ({
  AuthContext: {
    Provider: ({
      children,
      value,
    }: {
      children: ReactNode
      value: { isLoading: boolean; logout: () => Promise<void>; sessionExpired?: boolean }
    }) => {
      authContext.isLoading = value.isLoading
      authContext.logout = value.logout
      authContext.sessionExpired = value.sessionExpired ?? false
      return children
    },
  },
}))

describe('restoreAuth', () => {
  afterEach(() => {
    clearAccessToken()
    vi.clearAllMocks()
    authContext.isLoading = true
    authContext.logout = null
    authContext.sessionExpired = false
  })

  it('인증 세션이면 refresh 후 현재 회원을 복구한다', async () => {
    const calls: string[] = []
    vi.mocked(getAuthSession).mockImplementation(async () => {
      calls.push('session')
      return { data: { authenticated: true, uuid: 'member-uuid' } }
    })
    vi.mocked(refreshAccessToken).mockImplementation(async () => {
      calls.push('refresh')
      return { data: { accessToken: 'access-token' } }
    })
    vi.mocked(getCurrentMember).mockImplementation(async () => {
      calls.push('member')
      return { data: { uuid: 'member-uuid', nickname: 'Readle 개발자', profileImageUrl: null } }
    })

    await expect(restoreAuth()).resolves.toEqual({
      uuid: 'member-uuid',
      nickname: 'Readle 개발자',
      profileImageUrl: null,
    })
    expect(calls).toEqual(['session', 'refresh', 'member'])
  })

  it('비인증 세션이면 refresh 없이 비로그인 상태를 반환한다', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({ data: { authenticated: false, uuid: null } })

    await expect(restoreAuth()).resolves.toBeNull()

    expect(refreshAccessToken).not.toHaveBeenCalled()
    expect(getCurrentMember).not.toHaveBeenCalled()
  })

  it('복구 중 요청이 실패하면 비로그인 상태를 반환한다', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      data: { authenticated: true, uuid: 'member-uuid' },
    })
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error('refresh failed'))

    await expect(restoreAuth()).resolves.toBeNull()
    expect(getCurrentMember).not.toHaveBeenCalled()
  })

  it('초기 refresh의 INVALID_REFRESH_TOKEN은 세션 만료 상태로 전환한다', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      data: { authenticated: true, uuid: 'member-uuid' },
    })
    vi.mocked(refreshAccessToken).mockRejectedValue(
      new ApiError({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'refresh token이 만료되었습니다.',
        status: 401,
      }),
    )
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <AuthProvider>
          <span />
        </AuthProvider>,
      )
    })

    expect(authContext.isLoading).toBe(false)
    expect(authContext.sessionExpired).toBe(true)

    act(() => root.unmount())
  })

  it('취소된 복구는 refresh 완료 후 access token을 설정하지 않는다', async () => {
    let cancelled = false
    let resolveRefresh!: (value: Awaited<ReturnType<typeof refreshAccessToken>>) => void
    let signalRefreshStarted!: () => void
    const refreshStarted = new Promise<void>((resolve) => {
      signalRefreshStarted = resolve
    })
    const pendingRefresh = new Promise<Awaited<ReturnType<typeof refreshAccessToken>>>((resolve) => {
      resolveRefresh = resolve
    })

    vi.mocked(getAuthSession).mockResolvedValue({
      data: { authenticated: true, uuid: 'member-uuid' },
    })
    vi.mocked(refreshAccessToken).mockImplementation(() => {
      signalRefreshStarted()
      return pendingRefresh
    })

    const restorePromise = restoreAuth(() => cancelled)
    await refreshStarted
    cancelled = true
    resolveRefresh({ data: { accessToken: 'stale-access-token' } })

    await expect(restorePromise).resolves.toBeNull()
    expect(getCurrentMember).not.toHaveBeenCalled()

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: {} }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/contents')

    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBeNull()
  })

  it('로그아웃 요청 전에 access token을 갱신하지 않는다', async () => {
    vi.mocked(logoutRequest).mockResolvedValue(undefined)
    vi.mocked(refreshAccessToken).mockResolvedValue({
      data: { accessToken: 'access-token' },
    })

    renderToStaticMarkup(
      <AuthProvider>
        <span />
      </AuthProvider>,
    )

    await authContext.logout?.()

    expect(logoutRequest).toHaveBeenCalledOnce()
    expect(refreshAccessToken).not.toHaveBeenCalled()
  })
})
