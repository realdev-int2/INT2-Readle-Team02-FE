/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    vi.mocked(getResultReportDetail).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve(mockResultReport), 100))
    )
    renderPage()

    // 로딩 상태 검증
    expect(screen.getByText('결과 리포트를 불러오고 있습니다')).toBeInTheDocument()

    // 로딩이 끝나고 리포트 제목이 나타날 때까지 대기
    expect(await screen.findByText('Spring @Transactional 심층 이해')).toBeInTheDocument()
    const scoreRing = screen.getByLabelText('정답률 40%')
    expect(scoreRing).toBeInTheDocument()
    expect(scoreRing).toHaveTextContent('40%')
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

  it('객관식 문항 오답 시 정답 선택지(번호 및 내용)를 렌더링한다', async () => {
    const user = userEvent.setup()
    vi.mocked(getResultReportDetail).mockResolvedValueOnce(mockResultReport)
    renderPage()

    expect(await screen.findByText('Spring @Transactional 심층 이해')).toBeInTheDocument()

    const questionText = screen.getByText(
      '기존 트랜잭션의 존재 여부와 관계없이 항상 새로운 트랜잭션을 시작하는 전파 속성은 무엇인가요?',
    )
    const detailsElement = questionText.closest('details')
    expect(detailsElement).toBeInTheDocument()

    await user.click(questionText)
    expect(detailsElement).toHaveAttribute('open')

    expect(screen.getByText('정답 선택지')).toBeInTheDocument()
    expect(screen.getByText(/3번\. REQUIRES_NEW/)).toBeInTheDocument()
  })
})

describe('result report model', () => {
  it('API 계약에 맞게 객관식 오답 문항에만 정답 선택지가 제공된다', () => {
    const mcIncorrect = mockResultReport.results.find(
      (r) => r.questionType === 'multiple_choice' && !r.isCorrect,
    )
    expect(mcIncorrect?.correctChoiceNo).toBe(3)
    expect(mcIncorrect?.correctChoiceText).toBe('REQUIRES_NEW')

    const mcCorrect = mockResultReport.results.find(
      (r) => r.questionType === 'multiple_choice' && r.isCorrect,
    )
    expect(mcCorrect?.correctChoiceNo).toBeNull()
    expect(mcCorrect?.correctChoiceText).toBeNull()

    const codeBlankIncorrect = mockResultReport.results.find(
      (r) => r.questionType === 'code_blank' && !r.isCorrect,
    )
    expect(codeBlankIncorrect?.correctChoiceNo).toBeNull()
    expect(codeBlankIncorrect?.correctChoiceText).toBeNull()

    const shortAnswerIncorrect = mockResultReport.results.find(
      (r) => r.questionType === 'short_answer' && !r.isCorrect,
    )
    expect(shortAnswerIncorrect?.correctChoiceNo).toBeNull()
    expect(shortAnswerIncorrect?.correctChoiceText).toBeNull()
  })

  it('풀이 시간을 분과 초로 표시한다', () => {
    expect(formatDuration(428)).toBe('7분 08초')
  })
})
