import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { QuizPage } from '@/pages/quiz/QuizPage'
import {
  getAnsweredCount,
  getFirstUnansweredIndex,
  isAnswered,
} from '@/pages/quiz/model/quiz'
import { mockQuiz } from '@/pages/quiz/model/quiz'

// QuizPage는 API를 호출하므로, 초기 렌더(loading 상태)를 기준으로 테스트합니다.
// 실제 API 연동 통합 테스트는 MSW 핸들러(quiz.ts)를 통해 별도로 작성합니다.

function renderQuizPage(quizId = '1') {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[`/quizzes/${quizId}`]}>
      <Routes>
        <Route path="/quizzes/:quizId" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('QuizPage', () => {
  it('API 로딩 중에는 스켈레톤 로딩 화면을 렌더링한다', () => {
    const html = renderQuizPage()

    // 로딩 상태 — 스켈레톤 UI 요소가 있어야 함
    expect(html).toContain('quiz-page--loading')
    expect(html).toContain('quiz-skeleton-title')
    // mockQuiz 더미 데이터가 더 이상 노출되지 않아야 함
    expect(html).not.toContain('Spring @Transactional 심층 이해')
    // API 경로가 HTML에 노출되지 않아야 함
    expect(html).not.toContain('/api/')
    // 정답이 노출되지 않아야 함
    expect(html).not.toContain('correct_answer')
  })

  it('접근성: 로딩 중 aria-live polite 영역과 스크린 리더용 텍스트가 존재한다', () => {
    const html = renderQuizPage()

    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('퀴즈를 불러오는 중입니다')
  })

  it('유효하지 않은 quizId(문자열)면 에러 화면을 즉시 렌더링한다', () => {
    const html = renderQuizPage('abc')

    expect(html).toContain('잘못된 퀴즈 접근입니다')
    expect(html).toContain('quiz-page--error')
    expect(html).not.toContain('quiz-page--loading')
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
