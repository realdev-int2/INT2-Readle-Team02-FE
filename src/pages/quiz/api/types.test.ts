import { describe, expect, it } from 'vitest'
import { formatAnswersForSubmit } from '@/pages/quiz/api/types'
import type { QuizQuestionResponse } from '@/pages/quiz/api/types'

// ─── 픽스처 ──────────────────────────────────────────────────────────────────

const multipleChoiceQuestion: QuizQuestionResponse = {
  questionId: 301,
  type: 'multiple_choice',
  orderNo: 1,
  questionText: '객관식 문항',
  codeSnippet: null,
  choices: [
    { choiceId: 401, orderNo: 1, choiceText: 'A' },
    { choiceId: 402, orderNo: 2, choiceText: 'B' },
  ],
}

const shortAnswerQuestion: QuizQuestionResponse = {
  questionId: 302,
  type: 'short_answer',
  orderNo: 2,
  questionText: '주관식 문항',
  codeSnippet: null,
  choices: null,
}

const codeBlankQuestion: QuizQuestionResponse = {
  questionId: 303,
  type: 'code_blank',
  orderNo: 3,
  questionText: '코드 빈칸 문항',
  codeSnippet: 'if (x === ____) {}',
  choices: null,
}

// ─── 테스트 ──────────────────────────────────────────────────────────────────

describe('formatAnswersForSubmit', () => {
  it('객관식 답안은 submittedChoiceId로 변환된다', () => {
    const result = formatAnswersForSubmit([multipleChoiceQuestion], {
      301: 401,
    })

    expect(result.answers).toHaveLength(1)
    expect(result.answers[0]).toEqual({
      questionId: 301,
      submittedChoiceId: 401,
    })
    expect(result.answers[0]).not.toHaveProperty('submittedAnswerText')
  })

  it('주관식 답안은 submittedAnswerText로 변환된다', () => {
    const result = formatAnswersForSubmit([shortAnswerQuestion], {
      302: 'Spring AOP 프록시 때문입니다.',
    })

    expect(result.answers[0]).toEqual({
      questionId: 302,
      submittedAnswerText: 'Spring AOP 프록시 때문입니다.',
    })
    expect(result.answers[0]).not.toHaveProperty('submittedChoiceId')
  })

  it('코드 빈칸 답안은 submittedAnswerText로 변환된다', () => {
    const result = formatAnswersForSubmit([codeBlankQuestion], {
      303: 'readOnly',
    })

    expect(result.answers[0]).toEqual({
      questionId: 303,
      submittedAnswerText: 'readOnly',
    })
  })

  it('혼합 문항 타입을 올바른 포맷으로 일괄 변환한다', () => {
    const result = formatAnswersForSubmit(
      [multipleChoiceQuestion, shortAnswerQuestion, codeBlankQuestion],
      {
        301: 402,
        302: 'REQUIRES_NEW 전파 속성입니다.',
        303: 'readOnly',
      },
    )

    expect(result.answers).toHaveLength(3)
    expect(result.answers[0]).toEqual({ questionId: 301, submittedChoiceId: 402 })
    expect(result.answers[1]).toEqual({
      questionId: 302,
      submittedAnswerText: 'REQUIRES_NEW 전파 속성입니다.',
    })
    expect(result.answers[2]).toEqual({ questionId: 303, submittedAnswerText: 'readOnly' })
  })

  it('객관식 답안이 미응답(undefined)이면 submittedChoiceId가 undefined다', () => {
    const result = formatAnswersForSubmit([multipleChoiceQuestion], {})

    expect(result.answers[0].submittedChoiceId).toBeUndefined()
  })

  it('주관식 답안이 미응답(undefined)이면 submittedAnswerText가 undefined다', () => {
    const result = formatAnswersForSubmit([shortAnswerQuestion], {})

    expect(result.answers[0].submittedAnswerText).toBeUndefined()
  })

  it('빈 문항 목록이 들어오면 빈 answers 배열을 반환한다', () => {
    const result = formatAnswersForSubmit([], {})

    expect(result.answers).toHaveLength(0)
  })
})
