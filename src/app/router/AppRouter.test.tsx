import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRouter } from '@/app/router/AppRouter'

function renderRoute(path: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>,
  )
}

describe('AppRouter', () => {
  it.each([
    ['/learn', '홈 / 입력 대시보드'],
    ['/contents/preview', '콘텐츠 확인 · 수정'],
    ['/contents/101/preparing', '퀴즈 준비'],
    ['/quizzes/201', '퀴즈 풀이'],
    ['/quiz-attempts/301/grading', '답변 확인'],
    ['/result-reports/401', '결과 리포트'],
    ['/dashboard', '학습 현황 대시보드'],
    ['/history', '학습 히스토리'],
  ])('%s 경로에서 %s 페이지를 렌더링한다', (path, title) => {
    const html = renderRoute(path)

    expect(html).toContain(title)
    expect(html).toContain('aria-label="주요 메뉴"')
  })

  it('랜딩 경로에서 서비스 소개를 렌더링한다', () => {
    const html = renderRoute('/')

    expect(html).toContain('설명할 수 있는 지식으로.')
    expect(html).toContain('aria-label="랜딩 페이지 메뉴"')
    expect(html).not.toContain('aria-label="주요 메뉴"')
  })

  it('로그인 경로에서는 앱 헤더 없이 랜딩 위 로그인 모달을 표시한다', () => {
    const html = renderRoute('/login')

    expect(html).toContain('alt="Readle"')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('Google로 시작하기')
    expect(html).toContain('카카오로 시작하기')
    expect(html).not.toContain('aria-label="주요 메뉴"')
    expect(html).not.toContain('aria-label="새 퀴즈 만들기"')
    expect(html).not.toContain('aria-label="전성 프로필"')
  })

  it('현재 주요 메뉴를 aria-current로 표시한다', () => {
    const html = renderRoute('/dashboard')

    expect(html).toContain('aria-current="page"')
    expect(html).toContain('>학습 현황</a>')
  })

  it('히스토리는 직접 접근 경로로 유지하되 주요 메뉴에서는 제외한다', () => {
    const html = renderRoute('/history')

    expect(html).toContain('학습 히스토리')
    expect(html).not.toContain('>히스토리</a>')
  })

  it('일반 페이지 헤더에 새 퀴즈 CTA와 사용자 프로필 영역을 표시한다', () => {
    const html = renderRoute('/learn')

    expect(html).toContain('aria-label="새 퀴즈 만들기"')
    expect(html).toContain('>새 퀴즈</span>')
    expect(html).toContain('aria-label="전성 프로필"')
    expect(html).not.toContain('>전성</span>')
  })

  it('공통 헤더에 책 심볼과 Readle 워드마크를 표시한다', () => {
    const html = renderRoute('/learn')

    expect(html.match(/<img/g)).toHaveLength(2)
    expect(html).toContain('alt="Readle"')
  })

  it('정의되지 않은 경로에서 404 페이지를 렌더링한다', () => {
    const html = renderRoute('/unknown')

    expect(html).toContain('페이지를 찾을 수 없습니다.')
  })
})
