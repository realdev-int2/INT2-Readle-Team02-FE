// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GradingPage } from '@/pages/grading/GradingPage'

describe('GradingPage', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('채점 진행 상태와 처리 단계를 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GradingPage />
      </MemoryRouter>,
    )

    expect(html).toContain('답안을 채점하고 있습니다')
    expect(html).toContain('채점 진행률')
    expect(html).toContain('객관식 채점')
    expect(html).toContain('주관식 AI 평가')
    expect(html).toContain('코드 답안 평가')
    expect(html).toContain('결과 리포트 준비')
    expect(html).not.toContain('/api/')
  })

  it('준비가 끝나면 URL의 실제 reportId로 결과 리포트에 이동한다', () => {
    vi.useFakeTimers()

    render(
      <MemoryRouter initialEntries={['/result-reports/701/preparing']}>
        <Routes>
          <Route path="/result-reports/:reportId/preparing" element={<GradingPage />} />
          <Route path="/result-reports/:reportId" element={<p>실제 결과 리포트</p>} />
        </Routes>
      </MemoryRouter>,
    )

    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByRole('link', { name: /결과 리포트 보기/ })).toHaveAttribute(
      'href',
      '/result-reports/701',
    )

    act(() => vi.advanceTimersByTime(600))
    expect(screen.getByText('실제 결과 리포트')).toBeInTheDocument()
  })
})
