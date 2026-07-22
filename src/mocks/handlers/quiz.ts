import { http, HttpResponse } from 'msw'
import type { QuizDetailResponse, QuizAttemptStartResponse, QuizSubmitResponse } from '@/pages/quiz/api/types'

export const MOCK_QUIZ_SET_ID = 1
export const MOCK_ATTEMPT_ID = 1001
export const MOCK_REPORT_ID = 5001

export const mockQuizDetail: QuizDetailResponse = {
  attemptId: MOCK_ATTEMPT_ID,
  quizSetId: MOCK_QUIZ_SET_ID,
  status: 'in_progress',
  questions: [
    {
      questionId: 301,
      type: 'multiple_choice',
      orderNo: 1,
      questionText: 'Spring의 @Transactional이 적용된 메서드에서 런타임 예외가 발생하면 기본적으로 어떤 동작을 하나요?',
      codeSnippet: null,
      choices: [
        { choiceId: 401, orderNo: 1, choiceText: '트랜잭션을 커밋하고 예외를 다시 던진다.' },
        { choiceId: 402, orderNo: 2, choiceText: '트랜잭션을 롤백하고 예외를 다시 던진다.' },
        { choiceId: 403, orderNo: 3, choiceText: '예외를 무시하고 메서드를 정상 종료한다.' },
        { choiceId: 404, orderNo: 4, choiceText: '새로운 트랜잭션을 시작해 작업을 재시도한다.' },
      ],
    },
    {
      questionId: 302,
      type: 'short_answer',
      orderNo: 2,
      questionText: '같은 클래스 내부에서 @Transactional 메서드를 직접 호출할 때 트랜잭션이 적용되지 않는 이유를 설명해 주세요.',
      codeSnippet: null,
      choices: null,
    },
    {
      questionId: 303,
      type: 'code_blank',
      orderNo: 3,
      questionText: '읽기 전용 트랜잭션으로 설정하려면 빈칸에 들어갈 속성을 입력해 주세요.',
      codeSnippet: '@Transactional(________ = true)\npublic List<Article> findAll() {\n  return articleRepository.findAll();\n}',
      choices: null,
    },
  ],
}

export const mockSubmitResponse: QuizSubmitResponse = {
  reportId: MOCK_REPORT_ID,
  attemptId: MOCK_ATTEMPT_ID,
  gradingStatus: 'completed',
  accuracyRate: 66.67,
  correctCount: 2,
  totalCount: 3,
  solveDurationSeconds: 182,
  completedAt: '2026-07-21T06:00:00Z',
  results: [
    { questionId: 301, isCorrect: true, aiFeedback: null },
    { questionId: 302, isCorrect: false, aiFeedback: '프록시 기반 AOP 때문에 자기 자신 호출 시 트랜잭션이 동작하지 않습니다.' },
    { questionId: 303, isCorrect: true, aiFeedback: null },
  ],
}

export const quizHandlers = [
  // POST /api/quizzes — 퀴즈 생성
  http.post('*/api/quizzes', async () => {
    return HttpResponse.json({
      data: {
        quizId: MOCK_QUIZ_SET_ID,
        status: 'created',
        questionCount: 3,
        createdAt: new Date().toISOString(),
      },
    })
  }),

  // POST /api/quizzes/{quizSetId}/attempts — 퀴즈 시작
  http.post('*/api/quizzes/:quizSetId/attempts', ({ params }) => {
    const quizSetId = Number(params.quizSetId)

    if (quizSetId === 9999) {
      return HttpResponse.json(
        { error: { code: 'QUIZ_NOT_FOUND', message: '퀴즈를 찾을 수 없습니다.', details: [] } },
        { status: 404 },
      )
    }

    const response: QuizAttemptStartResponse = {
      attemptId: MOCK_ATTEMPT_ID,
      quizId: quizSetId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    }

    return HttpResponse.json({ data: response })
  }),

  // GET /api/quizzes/attempts/{attemptId} — 문제 상세 조회
  http.get('*/api/quizzes/attempts/:attemptId', ({ params }) => {
    const attemptId = Number(params.attemptId)

    if (attemptId !== MOCK_ATTEMPT_ID) {
      return HttpResponse.json(
        { error: { code: 'ATTEMPT_NOT_FOUND', message: '풀이 정보를 찾을 수 없습니다.', details: [] } },
        { status: 404 },
      )
    }

    return HttpResponse.json({ data: mockQuizDetail })
  }),

  // POST /api/quizzes/attempts/{attemptId}/submit — 답안 제출
  http.post('*/api/quizzes/attempts/:attemptId/submit', ({ params }) => {
    const attemptId = Number(params.attemptId)

    if (attemptId !== MOCK_ATTEMPT_ID) {
      return HttpResponse.json(
        { error: { code: 'ATTEMPT_NOT_FOUND', message: '풀이 정보를 찾을 수 없습니다.', details: [] } },
        { status: 404 },
      )
    }

    return HttpResponse.json({ data: mockSubmitResponse })
  }),
]
