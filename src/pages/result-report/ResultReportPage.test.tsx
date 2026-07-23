/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, afterEach, vi } from 'vitest'
import { ResultReportPage } from '@/pages/result-report/ResultReportPage'
import { formatDuration, mockResultReport } from '@/pages/result-report/model/resultReport'
import { getResultReportDetail } from '@/shared/api/report'
import { ApiError } from '@/shared/api/error'

vi.mock('@/shared/api/report')

afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})

function renderPage(reportId = 'mock-report') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/result-reports/${reportId}`]}>
        <Routes>
          <Route path="/result-reports/:reportId" element={<ResultReportPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ResultReportPage', () => {
  it('학습 결과 요약과 문제별 오답 피드백을 렌더링한다', async () => {
    vi.mocked(getResultReportDetail).mockResolvedValueOnce(mockResultReport)
    renderPage()

    // 로딩이 끝나고 리포트 제목이 나타날 때까지 대기
    expect(await screen.findByText('Spring @Transactional 심층 이해')).toBeInTheDocument()
    // "60%" 텍스트가 여러 DOM으로 쪼개져 렌더링되므로, 정규식을 사용하여 매칭
    expect(screen.getByText(/60/)).toBeInTheDocument()
    expect(screen.getByText(/%/)).toBeInTheDocument()
    expect(screen.getByText('문제별 풀이 결과')).toBeInTheDocument()
  })

  it('404 에러 상태를 렌더링한다', async () => {
    vi.mocked(getResultReportDetail).mockRejectedValueOnce(
      new ApiError({ status: 404, code: 'NOT_FOUND', message: 'Not Found' }),
    )
    renderPage('404')
    expect(await screen.findByText('결과 리포트를 찾을 수 없습니다')).toBeInTheDocument()
  })

  it('403 에러 상태를 렌더링한다', async () => {
    vi.mocked(getResultReportDetail).mockRejectedValueOnce(
      new ApiError({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' }),
    )
    renderPage('403')
    expect(await screen.findByText('결과 리포트에 접근할 수 없습니다')).toBeInTheDocument()
  })

  it('unknown-error 에러 상태를 렌더링한다', async () => {
    vi.mocked(getResultReportDetail).mockRejectedValueOnce(new Error('Unknown Error'))
    renderPage('unknown-error')
    expect(await screen.findByText('일시적인 오류가 발생했습니다')).toBeInTheDocument()
  })
})

describe('result report model', () => {
  it('API 계약에 맞게 정답에는 피드백이 없고 오답에만 피드백이 있다', () => {
    expect(mockResultReport.results.filter((result) => result.isCorrect))
      .toEqual(expect.arrayContaining([expect.objectContaining({ aiFeedback: null })]))
    expect(mockResultReport.results.filter((result) => !result.isCorrect).every((result) => Boolean(result.aiFeedback)))
      .toBe(true)
  })

  it('풀이 시간을 분과 초로 표시한다', () => {
    expect(formatDuration(428)).toBe('7분 08초')
  })
})
