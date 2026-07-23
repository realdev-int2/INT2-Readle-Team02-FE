// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GradingPage } from '@/pages/grading/GradingPage'
import { submitQuizAttempt } from '@/pages/quiz/api/quiz'

vi.mock('@/pages/quiz/api/quiz')

describe('GradingPage', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('채점 진행 상태와 처리 단계를 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[{ pathname: '/quizzes/attempts/99/grading', state: { submitRequest: { answers: [] } } }]}>
        <Routes>
          <Route path="/quizzes/attempts/:attemptId/grading" element={<GradingPage />} />
        </Routes>
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

  it('준비가 끝나면 결과 확인 버튼이 노출된다', async () => {
    vi.useFakeTimers()
    
    vi.mocked(submitQuizAttempt).mockResolvedValueOnce({
      reportId: 701,
      attemptId: 99,
      gradingStatus: 'completed',
      accuracyRate: 100,
      correctCount: 2,
      totalCount: 2,
      solveDurationSeconds: 120,
      completedAt: new Date().toISOString(),
      results: []
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/quizzes/attempts/99/grading', state: { submitRequest: { answers: [] } } }]}>
        <Routes>
          <Route path="/quizzes/attempts/:attemptId/grading" element={<GradingPage />} />
          <Route path="/result-reports/:reportId" element={<p>실제 결과 리포트</p>} />
        </Routes>
      </MemoryRouter>,
    )

    // API 응답을 기다리고 비동기 작업을 처리하기 위해 flushPromises 역할을 수행
    await act(async () => {
      // 10초를 진행시켜서 모든 타이머 애니메이션을 완료
      vi.advanceTimersByTime(10000)
    })

    expect(screen.getByRole('link', { name: /결과 리포트 보기/ })).toHaveAttribute(
      'href',
      '/result-reports/701',
    )
  })
})
