import { apiRequest } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/types'
import type {
  QuizAttemptStartResponse,
  QuizDetailResponse,
  QuizSubmitRequest,
  QuizSubmitResponse,
  QuizCreateRequest,
  QuizCreateResponse,
} from '@/pages/quiz/api/types'

/**
 * 퀴즈 생성 — 검증 완료된 콘텐츠를 바탕으로 퀴즈를 생성합니다.
 * POST /api/quizzes
 */
export function createQuiz(request: QuizCreateRequest) {
  return apiRequest<ApiResponse<QuizCreateResponse>>('/quizzes', {
    method: 'POST',
    body: request,
    requiresAuth: true,
  })
}

/**
 * 퀴즈 풀이 시작 — 새로운 Attempt를 생성하고 attemptId를 반환받습니다.
 * POST /api/quizzes/{quizSetId}/attempts
 */
export function startQuizAttempt(quizSetId: number) {
  return apiRequest<ApiResponse<QuizAttemptStartResponse>>(`/quizzes/${quizSetId}/attempts`, {
    method: 'POST',
    requiresAuth: true,
  })
}

/**
 * 퀴즈 문제 상세 조회 — attemptId 기준으로 문제 목록과 보기를 가져옵니다.
 * GET /api/quizzes/attempts/{attemptId}
 */
export function fetchQuizAttemptDetail(attemptId: number) {
  return apiRequest<ApiResponse<QuizDetailResponse>>(`/quizzes/attempts/${attemptId}`, {
    requiresAuth: true,
  })
}

/**
 * 답안 제출 및 채점 — 작성한 답안을 서버로 전송하고 채점 결과를 동기로 받습니다.
 * POST /api/quizzes/attempts/{attemptId}/submit
 */
export function submitQuizAttempt(attemptId: number, request: QuizSubmitRequest) {
  return apiRequest<ApiResponse<QuizSubmitResponse>>(`/quizzes/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: request,
    requiresAuth: true,
  })
}
