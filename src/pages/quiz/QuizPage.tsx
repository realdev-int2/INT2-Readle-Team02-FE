import { useEffect, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import {
  fetchQuizAttemptDetail,
  startQuizAttempt,
} from '@/pages/quiz/api/quiz'
import { formatAnswersForSubmit } from '@/pages/quiz/api/types'
import type { QuizDetailResponse } from '@/pages/quiz/api/types'
import {
  getAnsweredCount,
  getFirstUnansweredIndex,
  type QuizAnswer,
  type QuizAnswers,
  type QuizQuestion,
} from '@/pages/quiz/model/quiz'
import { ROUTES } from '@/shared/config/routes'
import '@/pages/quiz/QuizPage.css'

import { QuizNavigator } from '@/pages/quiz/ui/QuizNavigator'
import { QuizQuestionArea } from '@/pages/quiz/ui/QuizQuestionArea'
import { QuizSubmitConfirm } from '@/pages/quiz/ui/QuizSubmitConfirm'

// ─── API 응답 → 내부 모델 변환 ────────────────────────────────────────────────

function toQuizQuestion(q: QuizDetailResponse['questions'][number]): QuizQuestion {
  switch (q.type) {
    case 'multiple_choice':
      return {
        questionId: q.questionId,
        orderNo: q.orderNo,
        questionText: q.questionText,
        type: 'multiple_choice',
        choices: (q.choices ?? []).map((c) => ({
          choiceId: c.choiceId,
          orderNo: c.orderNo,
          choiceText: c.choiceText,
        })),
      }
    case 'code_blank':
      return {
        questionId: q.questionId,
        orderNo: q.orderNo,
        questionText: q.questionText,
        type: 'code_blank',
        codeSnippet: q.codeSnippet ?? '',
      }
    case 'short_answer':
      return {
        questionId: q.questionId,
        orderNo: q.orderNo,
        questionText: q.questionText,
        type: 'short_answer',
      }
    default: {
      // 새로운 문제 타입이 추가될 경우 컴파일 에러로 누락을 감지
      const _exhaustive: never = q.type
      throw new Error(`알 수 없는 문제 타입: ${String(_exhaustive)}`)
    }
  }
}

// ─── 로딩 / 에러 UI ──────────────────────────────────────────────────────────

function QuizLoadingScreen() {
  return (
    <div className="quiz-page quiz-page--loading py-8 sm:py-10 lg:py-12" role="status" aria-live="polite">
      <div className="quiz-skeleton-header">
        <div className="quiz-skeleton-title" />
        <div className="quiz-skeleton-tags" />
      </div>
      <div className="quiz-skeleton-body mt-8">
        <div className="quiz-skeleton-card" />
      </div>
      <p className="sr-only">퀴즈를 불러오는 중입니다…</p>
    </div>
  )
}

interface QuizErrorScreenProps {
  message: string
  onRetry: () => void
}

function QuizErrorScreen({ message, onRetry }: QuizErrorScreenProps) {
  return (
    <div className="quiz-page quiz-page--error py-8 sm:py-10 lg:py-12" role="alert">
      <div className="quiz-error-box">
        <span className="quiz-error-icon" aria-hidden="true">⚠</span>
        <h1 className="quiz-error-title">퀴즈를 불러올 수 없습니다</h1>
        <p className="quiz-error-message">{message}</p>
        <button
          className="quiz-error-retry"
          onClick={onRetry}
          type="button"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}

// ─── 제출 에러 토스트 ─────────────────────────────────────────────────────────

interface SubmitErrorToastProps {
  onDismiss: () => void
}

function SubmitErrorToast({ onDismiss }: SubmitErrorToastProps) {
  return (
    <div className="quiz-submit-error" role="alert">
      <p>제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button onClick={onDismiss} type="button" aria-label="오류 메시지 닫기">✕</button>
    </div>
  )
}

// ─── QuizPage ────────────────────────────────────────────────────────────────

type LoadPhase =
  | { status: 'loading' }
  | { status: 'ready'; attemptId: number; detail: QuizDetailResponse }
  | { status: 'submitting'; attemptId: number; detail: QuizDetailResponse }
  | { status: 'error'; message: string }

export function QuizPage() {
  const navigate = useNavigate()
  const { quizId: quizIdParam } = useParams<{ quizId: string }>()
  const quizId = Number(quizIdParam)

  const [phase, setPhase] = useState<LoadPhase>({ status: 'loading' })
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [showSubmitError, setShowSubmitError] = useState(false)
  // 재시도 트리거 — increment하면 effect가 재실행됨
  const [retryCount, setRetryCount] = useState(0)

  // fetchQuizAttemptDetail 실패 시 attemptId 보존 — 재시도 시 startQuizAttempt를 건너뛰엄
  const pendingAttemptRef = useRef<{ quizId: number; attemptId: number } | null>(null)

  // quizId 변경 시 이전 퀴즈 로컬 상태 전체 초기화 (렌더링 단계에서 처리)
  // quizId가 유효하지 않을 때는 비교 자체를 건너뜀 (NaN !== NaN으로 무한 루프 방지)
  const [prevQuizId, setPrevQuizId] = useState(quizId)
  if (Number.isFinite(quizId) && quizId > 0 && quizId !== prevQuizId) {
    setPrevQuizId(quizId)
    setAnswers({})
    setCurrentIndex(0)
    setShowConfirmation(false)
    setNotice(undefined)
    setShowSubmitError(false)
    setPhase({ status: 'loading' })
  }

  useEffect(() => {
    let cancelled = false

    async function loadQuiz() {
      const existing = pendingAttemptRef.current
      pendingAttemptRef.current = null

      let attemptId: number

      if (existing != null && existing.quizId === quizId) {
        // 문제 조회 실패 후 재시도 — 기존 attemptId 재사용, start 단계 건너뜀
        attemptId = existing.attemptId
      } else {
        setPhase({ status: 'loading' })

        try {
          const startResult = await startQuizAttempt(quizId)
          if (cancelled) return

          attemptId = startResult.attemptId
        } catch {
          if (!cancelled) {
            setPhase({
              status: 'error',
              message: '퀴즈를 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.',
            })
          }
          return
        }
      }

      try {
        const detail = await fetchQuizAttemptDetail(attemptId)
        if (cancelled) return

        setPhase({ status: 'ready', attemptId, detail })
      } catch {
        if (!cancelled) {
          // 다음 재시도 시 start를 건너뛰고 fetch부터 재개
          pendingAttemptRef.current = { quizId, attemptId }
          setPhase({
            status: 'error',
            message: '문제를 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.',
          })
        }
      }
    }

    void loadQuiz()

    // quizId 변경 또는 컴포넌트 언마운트 시 이전 요청 결과를 무시
    return () => {
      cancelled = true
    }
  }, [quizId, retryCount])

  // ─── 유효하지 않은 quizId 조기 반환 (hooks 이후에 위치) ────────────────────────

  if (!Number.isFinite(quizId) || quizId <= 0) {
    return (
      <div className="quiz-page quiz-page--error py-8 sm:py-10 lg:py-12" role="alert">
        <div className="quiz-error-box">
          <span className="quiz-error-icon" aria-hidden="true">⚠</span>
          <h1 className="quiz-error-title">잘못된 퀴즈 접근입니다</h1>
          <p className="quiz-error-message">올바른 경로로 다시 접속해 주세요.</p>
        </div>
      </div>
    )
  }

  // ─── 로딩 / 에러 단계 ──────────────────────────────────────────────────────

  if (phase.status === 'loading') {
    return <QuizLoadingScreen />
  }

  if (phase.status === 'error') {
    return (
      <QuizErrorScreen
        message={phase.message}
        onRetry={() => setRetryCount((c) => c + 1)}
      />
    )
  }

  // ─── 퀴즈 풀이 단계 ────────────────────────────────────────────────────────

  const { attemptId, detail } = phase
  const questions: QuizQuestion[] = detail.questions.map(toQuizQuestion)
  const questionCount = questions.length

  // 서버가 빈 문항 배열을 반환한 경우 (AI 생성 실패 등)
  if (questionCount === 0) {
    return (
      <div className="quiz-page quiz-page--error py-8 sm:py-10 lg:py-12" role="alert">
        <div className="quiz-error-box">
          <span className="quiz-error-icon" aria-hidden="true">📭</span>
          <h1 className="quiz-error-title">생성된 문제가 없습니다</h1>
          <p className="quiz-error-message">
            콘텐츠에서 퀴즈 문제를 만들 수 없었습니다. 다른 콘텐츠로 다시 시도해 주세요.
          </p>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  const answeredCount = getAnsweredCount(questions, answers)
  const unansweredCount = questionCount - answeredCount
  const isLastQuestion = currentIndex === questionCount - 1
  const progress = ((currentIndex + 1) / questionCount) * 100
  const isSubmitting = phase.status === 'submitting'

  function updateAnswer(answer: QuizAnswer) {
    setAnswers((current) => ({ ...current, [question.questionId]: answer }))
    setNotice(undefined)
  }

  function moveToQuestion(index: number) {
    setCurrentIndex(index)
    setNotice(undefined)
  }

  function requestSubmit() {
    const firstUnansweredIndex = getFirstUnansweredIndex(questions, answers)

    if (firstUnansweredIndex >= 0) {
      const currentUnansweredCount = questionCount - getAnsweredCount(questions, answers)
      setCurrentIndex(firstUnansweredIndex)
      setNotice(`아직 답하지 않은 문제가 ${currentUnansweredCount}개 있습니다. 첫 번째 미응답 문제로 이동했습니다.`)
      return
    }

    setShowConfirmation(true)
  }

  async function confirmSubmit() {
    // 중복 요청 차단
    if (phase.status === 'submitting') return
    setShowConfirmation(false)
    setPhase({ status: 'submitting', attemptId, detail })
    setShowSubmitError(false)

    const submitRequest = formatAnswersForSubmit(detail.questions, answers)
    
    // 채점 중 새로고침 대비를 위해 sessionStorage에 저장 (실패 시 무시)
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(`quiz_submit_${attemptId}`, JSON.stringify(submitRequest))
      }
    } catch {
      // Storage is full or browser privacy mode blocks access
    }
    
    // GradingPage로 즉시 이동하며 퀴즈 제출 요청 데이터를 라우터 state로 전달
    void navigate(generatePath(ROUTES.grading, { attemptId: String(attemptId) }), {
      state: { submitRequest },
      replace: true // 퀴즈 페이지를 히스토리에서 대체
    })
  }

  return (
    <div className="quiz-page py-8 sm:py-10 lg:py-12">
      <header className="quiz-header">
        <div className="min-w-0">
          <h1 className="truncate text-heading font-bold text-text-primary sm:text-title">
            퀴즈 풀기
          </h1>
        </div>
        <div className="quiz-progress-summary">
          <strong>{currentIndex + 1}</strong>
          <span>/ {questionCount}</span>
          <small>문제 풀이 중</small>
        </div>
      </header>

      <div className="quiz-progress-row mt-6" aria-label={`문제 진행률 ${Math.round(progress)}%`}>
        <div className="quiz-progress-segments" aria-hidden="true">
          {questions.map((item, index) => (
            <span
              className={index <= currentIndex ? 'quiz-progress-segment-filled' : ''}
              key={item.questionId}
            />
          ))}
        </div>
        <strong className="quiz-progress-percent">{Math.round(progress)}%</strong>
      </div>

      <div className="quiz-workspace mt-6">
        <QuizNavigator
          answers={answers}
          answeredCount={answeredCount}
          currentIndex={currentIndex}
          moveToQuestion={moveToQuestion}
          questions={questions}
        />

        <QuizQuestionArea
          answer={answers[question.questionId]}
          currentIndex={currentIndex}
          isLastQuestion={isLastQuestion}
          moveToQuestion={moveToQuestion}
          notice={notice}
          question={question}
          requestSubmit={requestSubmit}
          unansweredCount={unansweredCount}
          updateAnswer={updateAnswer}
        />
      </div>

      {showConfirmation && (
        <QuizSubmitConfirm
          onCancel={() => setShowConfirmation(false)}
          onConfirm={() => void confirmSubmit()}
        />
      )}

      {isSubmitting && (
        <div className="quiz-submit-overlay" role="status" aria-live="polite">
          <span className="sr-only">답안을 제출하고 있습니다…</span>
        </div>
      )}

      {showSubmitError && (
        <SubmitErrorToast onDismiss={() => setShowSubmitError(false)} />
      )}
    </div>
  )
}
