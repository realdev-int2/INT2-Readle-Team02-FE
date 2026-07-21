import { useEffect, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router'
import {
  fetchQuizAttemptDetail,
  startQuizAttempt,
  submitQuizAttempt,
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
  if (q.type === 'multiple_choice') {
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
  }

  if (q.type === 'code_blank') {
    return {
      questionId: q.questionId,
      orderNo: q.orderNo,
      questionText: q.questionText,
      type: 'code_blank',
      codeSnippet: q.codeSnippet ?? '',
    }
  }

  return {
    questionId: q.questionId,
    orderNo: q.orderNo,
    questionText: q.questionText,
    type: 'short_answer',
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
  | { status: 'idle' }
  | { status: 'starting' }
  | { status: 'fetching'; attemptId: number }
  | { status: 'ready'; attemptId: number; detail: QuizDetailResponse }
  | { status: 'submitting'; attemptId: number; detail: QuizDetailResponse }
  | { status: 'error'; message: string }

export function QuizPage() {
  const navigate = useNavigate()
  const { quizId: quizIdParam } = useParams<{ quizId: string }>()
  const quizId = Number(quizIdParam)

  const [phase, setPhase] = useState<LoadPhase>({ status: 'idle' })
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [notice, setNotice] = useState<string>()
  const [showSubmitError, setShowSubmitError] = useState(false)
  // 재시도 트리거 — increment하면 effect가 재실행됨
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadQuiz() {
      setPhase({ status: 'starting' })

      try {
        const startResult = await startQuizAttempt(quizId)
        if (cancelled) return

        const attemptId = startResult.attemptId
        setPhase({ status: 'fetching', attemptId })

        const detail = await fetchQuizAttemptDetail(attemptId)
        if (cancelled) return

        setPhase({ status: 'ready', attemptId, detail })
      } catch {
        if (!cancelled) {
          setPhase({
            status: 'error',
            message: '퀴즈 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
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

  // ─── 로딩 / 에러 단계 ──────────────────────────────────────────────────────

  if (phase.status === 'idle' || phase.status === 'starting' || phase.status === 'fetching') {
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
    setShowConfirmation(false)
    setPhase({ status: 'submitting', attemptId, detail })
    setShowSubmitError(false)

    try {
      const submitRequest = formatAnswersForSubmit(detail.questions, answers)
      const result = await submitQuizAttempt(attemptId, submitRequest)
      void navigate(generatePath(ROUTES.grading, { attemptId: String(result.attemptId) }))
    } catch {
      setShowSubmitError(true)
      // 제출 실패 시 ready 상태로 복귀해 사용자가 다시 제출할 수 있도록 함
      setPhase({ status: 'ready', attemptId, detail })
    }
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
