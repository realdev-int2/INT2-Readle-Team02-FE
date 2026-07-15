import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/pages/landing/LandingPage'

function renderLanding(initialLoginOpen = false) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <LandingPage initialLoginOpen={initialLoginOpen} />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('Readle의 핵심 가치와 학습 흐름을 소개한다', () => {
    const html = renderLanding()

    expect(html).toContain('설명할 수 있는 지식으로.')
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

  it('/login 딥링크 상태에서 Google과 카카오 로그인 모달을 표시한다', () => {
    const html = renderLanding(true)

    expect(html).toContain('role="dialog"')
    expect(html).toContain('다시 만나 반갑습니다')
    expect(html).toContain('Google로 시작하기')
    expect(html).toContain('카카오로 시작하기')
  })

  it('실제 OAuth 주소나 API 호출 계약을 포함하지 않는다', () => {
    const html = renderLanding(true)

    expect(html).not.toContain('/api/')
    expect(html).not.toContain('oauth')
    expect(html).toContain('aria-live="polite"')
  })
})
