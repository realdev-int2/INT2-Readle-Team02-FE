// @vitest-environment jsdom
import { StrictMode } from 'react'
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

  it('새로고침 시 sessionStorage에서 답안을 한 번만 복구하고 중복 제출을 방지한다', async () => {
    vi.useFakeTimers()
    vi.mocked(submitQuizAttempt).mockClear()
    const sessionStorageSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ answers: [] }))
    
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
      <MemoryRouter initialEntries={[{ pathname: '/quizzes/attempts/99/grading' }]}>
        <Routes>
          <Route path="/quizzes/attempts/:attemptId/grading" element={<GradingPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await act(async () => {
      vi.advanceTimersByTime(10000)
    })

    // lazy state initialization 덕분에 getItem은 최초 1회만 호출됨
    expect(sessionStorageSpy).toHaveBeenCalledTimes(1)
    // 제출 로직 역시 Effect가 한 번만 실행되므로 1회만 호출됨
    expect(submitQuizAttempt).toHaveBeenCalledTimes(1)
    
    sessionStorageSpy.mockRestore()
  })

  it('StrictMode 환경의 effect 재실행 시에도 제출은 1회만 발생하고 최종 완료 상태에 도달한다', async () => {
    vi.useFakeTimers()
    vi.mocked(submitQuizAttempt).mockClear()
    
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
      <StrictMode>
        <MemoryRouter initialEntries={[{ pathname: '/quizzes/attempts/99/grading', state: { submitRequest: { answers: [] } } }]}>
          <Routes>
            <Route path="/quizzes/attempts/:attemptId/grading" element={<GradingPage />} />
            <Route path="/result-reports/:reportId" element={<p>실제 결과 리포트</p>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>
    )

    await act(async () => {
      vi.advanceTimersByTime(10000)
    })

    // React 18 StrictMode에서는 mount -> unmount -> mount 순으로 effect가 재실행되지만, API 호출은 1번만 일어남을 검증
    expect(submitQuizAttempt).toHaveBeenCalledTimes(1)
    
    // 타이머와 effect 재실행 흐름이 정상적으로 이어져서 최종 성공 화면(결과 리포트 보기 링크)까지 도달함을 단언
    expect(screen.getByRole('link', { name: /결과 리포트 보기/ })).toHaveAttribute(
      'href',
      '/result-reports/701',
    )
  })
})
