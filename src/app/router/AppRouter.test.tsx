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
    ['/', '홈 / 입력 대시보드'],
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

  it('로그인 경로에서는 공통 헤더를 유지하고 주요 메뉴를 숨긴다', () => {
    const html = renderRoute('/login')

    expect(html).toContain('>Readle</a>')
    expect(html).toContain('>로그인</h1>')
    expect(html).not.toContain('aria-label="주요 메뉴"')
  })

  it('현재 주요 메뉴를 aria-current로 표시한다', () => {
    const html = renderRoute('/dashboard')

    expect(html).toContain('aria-current="page"')
    expect(html).toContain('>학습 현황</a>')
  })

  it('정의되지 않은 경로에서 404 페이지를 렌더링한다', () => {
    const html = renderRoute('/unknown')

    expect(html).toContain('페이지를 찾을 수 없습니다.')
  })
})
