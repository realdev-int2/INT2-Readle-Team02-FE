import { useEffect, useRef, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import {
  getAnsweredCount,
  getFirstUnansweredIndex,
  isAnswered,
  mockQuiz,
  questionTypeLabel,
  type QuizAnswer,
  type QuizAnswers,
  type QuizQuestion,
} from '@/pages/quiz/model/quiz'
import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui'
import '@/pages/quiz/QuizPage.css'

function MultipleChoiceAnswer({
  answer,
  onChange,
  question,
}: {
  answer: QuizAnswer | undefined
  onChange: (answer: QuizAnswer) => void
  question: QuizQuestion
}) {
  return (
    <fieldset className="quiz-choice-list">
      <legend className="sr-only">답안 선택</legend>
      {question.choices?.map((choice) => {
        const checked = answer === choice.choiceId

        return (
          <label className={`quiz-choice ${checked ? 'quiz-choice-selected' : ''}`} key={choice.choiceId}>
            <input
              checked={checked}
              name={`question-${question.questionId}`}
              onChange={() => onChange(choice.choiceId)}
              type="radio"
              value={choice.choiceId}
            />
            <span aria-hidden="true" className="quiz-choice-index">
              {String.fromCharCode(64 + choice.orderNo)}
            </span>
            <span className="quiz-choice-text">{choice.choiceText}</span>
            <span aria-hidden="true" className="quiz-choice-check">✓</span>
          </label>
        )
      })}
    </fieldset>
  )
}

function TextAnswer({
  answer,
  onChange,
  question,
}: {
  answer: QuizAnswer | undefined
  onChange: (answer: QuizAnswer) => void
  question: QuizQuestion
}) {
  const value = typeof answer === 'string' ? answer : ''
  const isCodeBlank = question.type === 'code_blank'

  if (isCodeBlank) {
    return (
      <div>
        <div className="quiz-code-editor">
          <div className="quiz-code-block" aria-label="빈칸이 포함된 코드" role="region">
            {question.codeSnippet?.split('\n').map((line, index) => (
              <span className="quiz-code-line" key={`${line}-${index}`}>
                <span aria-hidden="true" className="quiz-code-line-number">{index + 1}</span>
                <code>{line}</code>
              </span>
            ))}
          </div>
          <div className="quiz-ide-answer">
            <span aria-hidden="true" className="quiz-ide-prompt">›</span>
            <label className="sr-only" htmlFor={`answer-${question.questionId}`}>코드 빈칸 답안</label>
            <input
              autoComplete="off"
              className="quiz-code-input"
              id={`answer-${question.questionId}`}
              maxLength={100}
              onChange={(event) => onChange(event.target.value)}
              placeholder="빈칸에 들어갈 코드를 입력하세요"
              spellCheck={false}
              value={value}
            />
          </div>
        </div>
        <div className="quiz-answer-helper">
          <span>대소문자와 공백을 확인해 주세요.</span>
          <span className="font-mono">{value.length}/100</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="sr-only" htmlFor={`answer-${question.questionId}`}>주관식 답안</label>
      <textarea
        className="quiz-short-answer"
        id={`answer-${question.questionId}`}
        maxLength={100}
        onChange={(event) => onChange(event.target.value)}
        placeholder="핵심 개념을 중심으로 답변해 주세요"
        value={value}
      />
      <div className="quiz-answer-helper">
        <span>100자 이내로 간결하게 작성해 주세요.</span>
        <span className="font-mono">{value.length}/100</span>
      </div>
    </div>
  )
}

function SubmitConfirmation({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement
    const focusableElements = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const firstFocusable = focusableElements?.[0]
    const lastFocusable = focusableElements?.[focusableElements.length - 1]

    firstFocusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
        return
      }

      if (event.key !== 'Tab' || !dialog || !firstFocusable || !lastFocusable) {
        return
      }

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? lastFocusable : firstFocusable).focus()
      } else if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus()
      }
    }
  }, [onCancel])

  return (
    <div className="quiz-dialog-backdrop" role="presentation">
      <section
        aria-describedby="quiz-submit-description"
        aria-labelledby="quiz-submit-title"
        aria-modal="true"
        className="quiz-submit-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <span aria-hidden="true" className="quiz-submit-dialog-icon">✓</span>
        <h2 className="mt-4 text-heading font-bold text-text-primary" id="quiz-submit-title">답안을 제출하시겠습니까?</h2>
        <p className="mt-2 text-label leading-6 text-text-muted" id="quiz-submit-description">
          제출 후에는 답안을 수정할 수 없으며 바로 채점이 시작됩니다.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button onClick={onCancel} variant="secondary">계속 풀기</Button>
          <Button onClick={onConfirm}>제출하기</Button>
        </div>
      </section>
    </div>
  )
}

export function QuizPage() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [notice, setNotice] = useState<string>()

  const question = mockQuiz.questions[currentIndex]
  const answeredCount = getAnsweredCount(mockQuiz.questions, answers)
  const unansweredCount = mockQuiz.questionCount - answeredCount
  const isLastQuestion = currentIndex === mockQuiz.questionCount - 1
  const isCodeQuestion = question.type === 'code_blank'
  const progress = ((currentIndex + 1) / mockQuiz.questionCount) * 100

  function updateAnswer(answer: QuizAnswer) {
    setAnswers((current) => ({ ...current, [question.questionId]: answer }))
    setNotice(undefined)
  }

  function moveToQuestion(index: number) {
    setCurrentIndex(index)
    setNotice(undefined)
  }

  function requestSubmit() {
    const firstUnansweredIndex = getFirstUnansweredIndex(mockQuiz.questions, answers)

    if (firstUnansweredIndex >= 0) {
      setCurrentIndex(firstUnansweredIndex)
      setNotice(`아직 답하지 않은 문제가 ${unansweredCount}개 있습니다.`)
      return
    }

    setShowConfirmation(true)
  }

  function confirmSubmit() {
    setShowConfirmation(false)
    void navigate(generatePath(ROUTES.grading, { attemptId: 'mock-attempt' }))
  }

  return (
    <div className="quiz-page py-8 sm:py-10 lg:py-12">
      <header className="quiz-header">
        <div className="min-w-0">
          <h1 className="truncate text-heading font-bold text-text-primary sm:text-title">{mockQuiz.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="퀴즈 태그">
            {mockQuiz.tags.map((tag) => <span className="quiz-tag" key={tag}>#{tag}</span>)}
          </div>
        </div>
        <div className="quiz-progress-summary">
          <strong>{currentIndex + 1}</strong>
          <span>/ {mockQuiz.questionCount}</span>
          <small>문제 풀이 중</small>
        </div>
      </header>

      <div className="quiz-progress-row mt-6" aria-label={`문제 진행률 ${Math.round(progress)}%`}>
        <div className="quiz-progress-segments" aria-hidden="true">
          {mockQuiz.questions.map((item, index) => (
            <span className={index <= currentIndex ? 'quiz-progress-segment-filled' : ''} key={item.questionId} />
          ))}
        </div>
        <strong className="quiz-progress-percent">{Math.round(progress)}%</strong>
      </div>

      <div className="quiz-workspace mt-6">
        <aside className="quiz-navigator" aria-label="문제 바로가기">
          <div className="quiz-navigator-heading">
            <span>문제 목록</span>
            <strong>{answeredCount}/{mockQuiz.questionCount} 완료</strong>
          </div>
          <ol className="quiz-question-list">
            {mockQuiz.questions.map((item, index) => {
              const active = index === currentIndex
              const answered = isAnswered(answers[item.questionId])

              return (
                <li key={item.questionId}>
                  <button
                    aria-current={active ? 'step' : undefined}
                    aria-label={`${item.orderNo}번 문제${answered ? ', 답변 완료' : ''}`}
                    className={`quiz-question-link ${active ? 'quiz-question-link-active' : ''} ${answered ? 'quiz-question-link-answered' : ''}`}
                    onClick={() => moveToQuestion(index)}
                    type="button"
                  >
                    <span>{String(item.orderNo).padStart(2, '0')}</span>
                    <span>{questionTypeLabel[item.type]}</span>
                    <span aria-hidden="true" className="quiz-question-link-state">{answered ? '✓' : ''}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>

        <section
          className={`quiz-question-card ${isCodeQuestion ? 'quiz-question-card-ide' : 'quiz-question-card-browser'}`}
          aria-labelledby="quiz-question-title"
        >
          {isCodeQuestion ? (
            <div className="quiz-ide-window-bar" aria-hidden="true">
              <span className="quiz-ide-tab"><span>{'{ }'}</span> ArticleService.java</span>
            </div>
          ) : (
            <div className="quiz-browser-bar" aria-hidden="true">
              <div className="quiz-browser-controls">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div className="quiz-question-body">
            <div className="quiz-question-meta">
              <span>QUESTION {String(question.orderNo).padStart(2, '0')}</span>
              <span>{questionTypeLabel[question.type]}</span>
            </div>
            <h2 className="quiz-question-title" id="quiz-question-title">{question.questionText}</h2>
            <div className="quiz-answer-area">
              {question.type === 'multiple_choice' ? (
                <MultipleChoiceAnswer answer={answers[question.questionId]} onChange={updateAnswer} question={question} />
              ) : (
                <TextAnswer answer={answers[question.questionId]} onChange={updateAnswer} question={question} />
              )}
            </div>

            {notice && <p className="quiz-notice" role="alert">{notice} 첫 번째 미응답 문제로 이동했습니다.</p>}

            <footer className="quiz-question-footer">
              <Button disabled={currentIndex === 0} onClick={() => moveToQuestion(currentIndex - 1)} variant="secondary">
                <span aria-hidden="true">←</span> 이전 문제
              </Button>
              <div className="quiz-question-footer-status">
                <span>{isAnswered(answers[question.questionId]) ? '이 문제에 답했습니다.' : '답안을 입력해 주세요.'}</span>
                {isLastQuestion && unansweredCount > 0 && <small>미응답 {unansweredCount}개</small>}
              </div>
              {isLastQuestion ? (
                <Button onClick={requestSubmit}>답안 제출하기</Button>
              ) : (
                <Button onClick={() => moveToQuestion(currentIndex + 1)}>다음 문제 <span aria-hidden="true">→</span></Button>
              )}
            </footer>
          </div>
        </section>
      </div>

      {showConfirmation && <SubmitConfirmation onCancel={() => setShowConfirmation(false)} onConfirm={confirmSubmit} />}
    </div>
  )
}
