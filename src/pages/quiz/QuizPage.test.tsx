import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { QuizPage } from '@/pages/quiz/QuizPage'
import {
  getAnsweredCount,
  getFirstUnansweredIndex,
  isAnswered,
  mockQuiz,
} from '@/pages/quiz/model/quiz'

describe('QuizPage', () => {
  it('첫 번째 퀴즈 문제와 풀이 진행 UI를 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>,
    )

    expect(html).toContain('Spring @Transactional 심층 이해')
    expect(html).toContain('ACTIVE RECALL SESSION')
    expect(html).toContain('QUESTION 01')
    expect(html).toContain('객관식')
    expect(html).toContain('문제 목록')
    expect(html).toContain('다음 문제')
    expect(html).not.toContain('correct_answer')
    expect(html).not.toContain('/api/')
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
