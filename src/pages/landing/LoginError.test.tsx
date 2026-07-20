// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/app/providers/AuthContext'
import { LandingPage } from '@/pages/landing/LandingPage'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function renderLogin(path: string, consumeSessionExpired?: () => void) {
  window.history.replaceState({}, '', path)

  const container = document.createElement('div')
  const root = createRoot(container)

  await act(async () => {
    root.render(
      <AuthContext.Provider value={{ consumeSessionExpired, isLoading: false, invalidateAuth: () => {}, logout: async () => {}, member: null }}>
        <BrowserRouter>
          <LandingPage initialLoginOpen />
        </BrowserRouter>
      </AuthContext.Provider>,
    )
  })

  await act(async () => {})

  return { container, root }
}

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('login auth errors', () => {
  it.each([
    ['oauth_cancelled', '로그인이 취소되었습니다. 다시 시도해 주세요.'],
    ['oauth_failed', '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'],
    ['session_expired', '로그인 상태가 만료되었습니다. 다시 로그인해 주세요.'],
  ])('displays the known %s error and removes only authError from the URL', async (authError, message) => {
    const { container, root } = await renderLogin(
      `/login?returnTo=${encodeURIComponent('/dashboard?tab=java')}&authError=${authError}`,
    )

    try {
      expect(container.textContent).toContain(message)
      expect(window.location.search).toBe('?returnTo=%2Fdashboard%3Ftab%3Djava')
    } finally {
      act(() => root.unmount())
    }
  })

  it('displays the fixed oauth_failed copy for an unknown provider error', async () => {
    const { container, root } = await renderLogin('/login?returnTo=%2Fdashboard&authError=google%3Ainvalid_scope')

    try {
      expect(container.textContent).not.toContain('google:invalid_scope')
      expect(container.textContent).toContain('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      expect(window.location.search).toBe('?returnTo=%2Fdashboard')
    } finally {
      act(() => root.unmount())
    }
  })

  it('sanitizes returnTo while removing authError', async () => {
    const { root } = await renderLogin('/login?returnTo=%2F%2Fevil.example&authError=oauth_failed')

    try {
      expect(window.location.search).toBe('?returnTo=%2F')
    } finally {
      act(() => root.unmount())
    }
  })

  it('consumes sessionExpired after redirecting to login', async () => {
    const consumeSessionExpired = vi.fn()
    const { root } = await renderLogin('/login?returnTo=%2Fdashboard&authError=session_expired', consumeSessionExpired)

    try {
      expect(consumeSessionExpired).toHaveBeenCalledOnce()
    } finally {
      act(() => root.unmount())
    }
  })
})
