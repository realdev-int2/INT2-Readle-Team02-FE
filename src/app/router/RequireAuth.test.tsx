import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/app/providers/AuthContext'
import { RequireAuth } from '@/app/router/RequireAuth'
import type { Member } from '@/shared/api'

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()

  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <span data-navigation={to} />,
  }
})

const member: Member = { nickname: '전성', profileImageUrl: null, uuid: 'member-1' }

function renderRequireAuth(
  path: string,
  auth: { isLoading: boolean; member: Member | null },
) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider
        value={{
          invalidateAuth: () => {},
          isLoading: auth.isLoading,
          logout: async () => {},
          member: auth.member,
        }}
      >
        <Routes>
          <Route element={<RequireAuth />}>
            <Route element={<span>private content</span>} path="/learn" />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('loading state does not render private outlet content', () => {
    const html = renderRequireAuth('/learn', { isLoading: true, member: null })

    expect(html).toContain('role="status"')
    expect(html).not.toContain('private content')
  })

  it('redirects unauthenticated users to login with the current path and query', () => {
    const html = renderRequireAuth('/learn?source=landing', {
      isLoading: false,
      member: null,
    })

    expect(html).toContain(
      'data-navigation="/login?returnTo=%2Flearn%3Fsource%3Dlanding"',
    )
  })

  it('renders the outlet for an authenticated user', () => {
    const html = renderRequireAuth('/learn', { isLoading: false, member })

    expect(html).toContain('private content')
  })
})
