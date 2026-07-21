import type { QuizAnswers } from '@/pages/quiz/model/quiz'

// ─── 백엔드 응답 타입 ────────────────────────────────────────────────────────

export type QuizQuestionType = 'multiple_choice' | 'short_answer' | 'code_blank'

export type AttemptStatus = 'in_progress' | 'grading' | 'submitted'

export interface QuizChoiceResponse {
  choiceId: number
  orderNo: number
  choiceText: string
}

export interface QuizQuestionResponse {
  questionId: number
  type: QuizQuestionType
  orderNo: number
  questionText: string
  codeSnippet: string | null
  choices: QuizChoiceResponse[] | null
}

/** POST /api/quizzes/{quizSetId}/attempts 응답 */
export interface QuizAttemptStartResponse {
  attemptId: number
  quizId: number
  status: AttemptStatus
  startedAt: string
}

/** GET /api/quizzes/attempts/{attemptId} 응답 */
export interface QuizDetailResponse {
  attemptId: number
  quizSetId: number
  status: AttemptStatus
  questions: QuizQuestionResponse[]
}

export interface QuizQuestionResult {
  questionId: number
  isCorrect: boolean
  aiFeedback: string | null
}

/** POST /api/quizzes/attempts/{attemptId}/submit 응답 */
export interface QuizSubmitResponse {
  reportId: number
  attemptId: number
  gradingStatus: 'completed'
  accuracyRate: number
  correctCount: number
  totalCount: number
  solveDurationSeconds: number
  completedAt: string
  results: QuizQuestionResult[]
}

// ─── 백엔드 요청 타입 ────────────────────────────────────────────────────────

export interface AnswerRequest {
  questionId: number
  submittedChoiceId?: number
  submittedAnswerText?: string
}

export interface QuizSubmitRequest {
  answers: AnswerRequest[]
}

// ─── 답안 포맷 변환 유틸 ─────────────────────────────────────────────────────

/**
 * 프론트엔드 QuizAnswers 상태를 백엔드 QuizSubmitRequest 포맷으로 변환합니다.
 *
 * - multiple_choice 문항: submittedChoiceId (number) 사용
 * - short_answer / code_blank 문항: submittedAnswerText (string) 사용
 */
export function formatAnswersForSubmit(
  questions: QuizQuestionResponse[],
  answers: QuizAnswers,
): QuizSubmitRequest {
  const formattedAnswers: AnswerRequest[] = questions.map((question) => {
    const answer = answers[question.questionId]

    if (question.type === 'multiple_choice') {
      return {
        questionId: question.questionId,
        submittedChoiceId: typeof answer === 'number' ? answer : undefined,
      }
    }

    return {
      questionId: question.questionId,
      submittedAnswerText: typeof answer === 'string' ? answer : undefined,
    }
  })

  return { answers: formattedAnswers }
}
