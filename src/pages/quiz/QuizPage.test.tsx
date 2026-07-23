// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QuizPage } from '@/pages/quiz/QuizPage'
import { fetchQuizAttemptDetail, startQuizAttempt, submitQuizAttempt } from '@/pages/quiz/api/quiz'
import {
  getAnsweredCount,
  getFirstUnansweredIndex,
  isAnswered,
} from '@/pages/quiz/model/quiz'
import { mockQuiz } from '@/pages/quiz/model/quiz'

vi.mock('@/pages/quiz/api/quiz')

function renderQuizPage(quizId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/quizzes/${quizId}`]}>
      <Routes>
        <Route path="/quizzes/:quizId" element={<QuizPage />} />
        <Route path="/result-reports/:reportId/preparing" element={<p>채점 중...</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('QuizPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('API 로딩 중에는 스켈레톤 로딩 화면을 렌더링한다', () => {
    // API 프로미스를 pending 상태로 두어 로딩 렌더링 검증
    vi.mocked(startQuizAttempt).mockReturnValue(new Promise(() => {}))
    renderQuizPage()

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('퀴즈를 불러오는 중입니다…')).toBeInTheDocument()
  })

  it('유효하지 않은 quizId(문자열)면 에러 화면을 즉시 렌더링한다', () => {
    renderQuizPage('abc')

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('잘못된 퀴즈 접근입니다')).toBeInTheDocument()
  })

  it('퀴즈 문제를 모두 풀고 제출하면 결과 준비(Grading) 화면으로 라우팅된다', async () => {
    const user = userEvent.setup()
    vi.mocked(startQuizAttempt).mockResolvedValue({
      attemptId: 99,
      quizId: 1,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    })
    
    // 객관식 1개, 단답형 1개로만 간소화된 응답 모킹
    vi.mocked(fetchQuizAttemptDetail).mockResolvedValue({
      attemptId: 99,
      quizSetId: 1,
      status: 'in_progress',
      questions: [
        {
          questionId: 301,
          type: 'multiple_choice',
          orderNo: 1,
          questionText: 'Test MCQ',
          codeSnippet: null,
          choices: [
            { choiceId: 401, orderNo: 1, choiceText: 'Choice 1' },
            { choiceId: 402, orderNo: 2, choiceText: 'Choice 2' }
          ]
        },
        {
          questionId: 302,
          type: 'short_answer',
          orderNo: 2,
          questionText: 'Test Short Answer',
          codeSnippet: null,
          choices: null
        }
      ]
    })
    vi.mocked(submitQuizAttempt).mockResolvedValue({
      reportId: 777,
      attemptId: 99,
      gradingStatus: 'completed',
      accuracyRate: 100,
      correctCount: 2,
      totalCount: 2,
      solveDurationSeconds: 120,
      completedAt: new Date().toISOString(),
      results: [
        { questionId: 301, isCorrect: true, aiFeedback: null },
        { questionId: 302, isCorrect: true, aiFeedback: null }
      ]
    })

    renderQuizPage()

    // 1번 문제 (객관식) 풀이
    const choice = await screen.findByText('Choice 1')
    await user.click(choice)
    await user.click(screen.getByRole('button', { name: /다음 문제/ }))

    // 2번 문제 (주관식) 풀이
    const input = await screen.findByPlaceholderText(/답변해 주세요/)
    await user.type(input, 'Test Answer')
    
    // 제출
    await user.click(screen.getByRole('button', { name: /제출하기/ }))
    
    // 모달 확인
    const confirmButton = await screen.findByRole('button', { name: '제출하기' })
    await user.click(confirmButton)

    // 리포트 777에 해당하는 채점 화면(preparing)으로 이동했는지 검증
    expect(await screen.findByText('채점 중...')).toBeInTheDocument()
    expect(submitQuizAttempt).toHaveBeenCalledWith(99, expect.any(Object))
  })
})


describe('quiz model', () => {
  it('공백 답안은 완료로 처리하지 않는다', () => {
    expect(isAnswered(undefined)).toBe(false)
    expect(isAnswered('   ')).toBe(false)
    expect(isAnswered('트랜잭션 프록시')).toBe(true)
    expect(isAnswered(401)).toBe(true)
  })

  it('완료한 문제 수와 첫 번째 미응답 문제를 계산한다', () => {
    const answers = {
      301: 402,
      302: '프록시를 거치지 않기 때문입니다.',
      303: ' ',
    }

    expect(getAnsweredCount(mockQuiz.questions, answers)).toBe(2)
    expect(getFirstUnansweredIndex(mockQuiz.questions, answers)).toBe(2)
  })
})
