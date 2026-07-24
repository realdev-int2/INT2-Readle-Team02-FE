// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/app/providers/AuthContext'
import { LandingPage } from '@/pages/landing/LandingPage'
import type { Member } from '@/shared/api'

type TestLocation = Pick<Location, 'hash' | 'href' | 'origin' | 'pathname' | 'search'>

function renderLanding(
  initialLoginOpen = false,
  location: Partial<TestLocation> = {},
  member: Member | null = null,
) {
  const testLocation: TestLocation = {
    hash: '',
    href: 'https://readle.local/',
    origin: 'https://readle.local',
    pathname: '/',
    search: '',
    ...location,
  }

  testLocation.href = `${testLocation.origin}${testLocation.pathname}${testLocation.search}${testLocation.hash}`
  vi.stubGlobal('window', { location: testLocation })

  return renderToStaticMarkup(
    <AuthContext.Provider value={{ member, isLoading: false, invalidateAuth: () => {}, logout: async () => {} }}>
      <MemoryRouter>
        <LandingPage initialLoginOpen={initialLoginOpen} />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function expectOAuthReturnTo(html: string, returnTo: string) {
  const encodedReturnTo = encodeURIComponent(returnTo)

  expect(html).toContain(
    `href="/api/auth/google/start?returnTo=${encodedReturnTo}"`,
  )
  expect(html).toContain(
    `href="/api/auth/kakao/start?returnTo=${encodedReturnTo}"`,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  cleanup()
})

describe('LandingPage', () => {
  it('Readle의 핵심 가치와 학습 흐름을 소개한다', () => {
    const html = renderLanding()

    expect(html).toContain('설명할 수 있는')
    expect(html).toContain('지식으로.')
    expect(html).toContain('readle analyze tech.dev/transaction')
    expect(html).toContain('QUIZ_READY')
    expect(html).toContain('Readle 데모입니다')
    expect(html).toContain('북마크는 쌓이는데, 실력은 그대로인가요?')
    expect(html).toContain('입력부터 피드백까지, 하나의 학습 흐름')
    expect(html).toContain('URL 하나면 충분합니다')
  })

  it('로그인과 학습 시작 CTA를 제공하되 기본 상태에서는 모달을 숨긴다', () => {
    const html = renderLanding()

    expect(html).toContain('>로그인</button>')
    expect(html).toContain('학습 시작하기')
    expect(html).not.toContain('role="dialog"')
  })


  it('로그인한 회원인 경우 랜딩 페이지를 렌더링하지 않고 즉시 홈으로 리다이렉트(Navigate)한다', () => {
    const member: Member = { uuid: 'member-1', nickname: '테스트 사용자', profileImageUrl: null }
    const testLocation: TestLocation = { hash: '', href: 'https://readle.local/', origin: 'https://readle.local', pathname: '/', search: '' }
    vi.stubGlobal('window', { location: testLocation })

    const { container } = render(
      <AuthContext.Provider value={{ member, isLoading: false, invalidateAuth: () => {}, logout: async () => {} }}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/learn" element={<div data-testid="learn-page">Learn Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    )

    expect(screen.getByTestId('learn-page')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('설명할 수 있는')
  })

  it('Google과 카카오 OAuth 시작 링크를 /learn returnTo로 표시한다', () => {
    const html = renderLanding(true)

    expect(html).toContain('role="dialog"')
    expect(html).toContain('다시 만나 반갑습니다')
    expectOAuthReturnTo(html, '/learn')
    expect(html).not.toContain('Google 로그인 연동은 준비 중입니다.')
    expect(html).not.toContain('카카오 로그인 연동은 준비 중입니다.')
  })

  it('/login 경로에서 열린 모달에서도 Google과 카카오 OAuth 시작 링크를 /learn returnTo로 표시한다', () => {
    const html = renderLanding(true, { pathname: '/login' })

    expectOAuthReturnTo(html, '/learn')
  })

  it('현재 경로와 query만 OAuth returnTo로 인코딩한다', () => {
    const html = renderLanding(true, {
      pathname: '/learn',
      search: '?source=landing',
      hash: '#should-not-forward',
    })

    expectOAuthReturnTo(html, '/learn?source=landing')
    expect(html).not.toContain('should-not-forward')
  })

  it('유효한 login returnTo를 OAuth 시작 링크에 유지한다', () => {
    const html = renderLanding(true, {
      pathname: '/login',
      search: '?returnTo=/dashboard?tab=java',
    })

    expectOAuthReturnTo(html, '/dashboard?tab=java')
  })

  it.each(['//evil', '/login?returnTo=/dashboard'])(
    '외부 주소와 login loop returnTo는 root로 되돌린다: %s',
    (returnTo) => {
      const html = renderLanding(true, {
        pathname: '/login',
        search: `?returnTo=${encodeURIComponent(returnTo)}`,
      })

      expectOAuthReturnTo(html, '/')
    },
  )
})
