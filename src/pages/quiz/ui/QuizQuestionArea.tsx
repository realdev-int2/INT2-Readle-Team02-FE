import { isAnswered, questionTypeLabel, type QuizAnswer, type QuizQuestion } from '@/pages/quiz/model/quiz'
import { Button } from '@/shared/ui'

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
            <span aria-hidden="true" className="quiz-choice-check">
              ✓
            </span>
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
                <span aria-hidden="true" className="quiz-code-line-number">
                  {index + 1}
                </span>
                <code>{line}</code>
              </span>
            ))}
          </div>
          <div className="quiz-ide-answer">
            <span aria-hidden="true" className="quiz-ide-prompt">
              ›
            </span>
            <label className="sr-only" htmlFor={`answer-${question.questionId}`}>
              코드 빈칸 답안
            </label>
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
      <label className="sr-only" htmlFor={`answer-${question.questionId}`}>
        주관식 답안
      </label>
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

export interface QuizQuestionAreaProps {
  question: QuizQuestion
  answer: QuizAnswer | undefined
  updateAnswer: (answer: QuizAnswer) => void
  notice: string | undefined
  isLastQuestion: boolean
  unansweredCount: number
  currentIndex: number
  moveToQuestion: (index: number) => void
  requestSubmit: () => void
}

export function QuizQuestionArea({
  question,
  answer,
  updateAnswer,
  notice,
  isLastQuestion,
  unansweredCount,
  currentIndex,
  moveToQuestion,
  requestSubmit,
}: QuizQuestionAreaProps) {
  const isCodeQuestion = question.type === 'code_blank'

  return (
    <section
      className={`quiz-question-card ${isCodeQuestion ? 'quiz-question-card-ide' : 'quiz-question-card-browser'}`}
      aria-labelledby="quiz-question-title"
    >
      {isCodeQuestion ? (
        <div className="quiz-ide-window-bar" aria-hidden="true">
          <span className="quiz-ide-tab">
            <span>{'{ }'}</span> ArticleService.java
          </span>
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
        <h2 className="quiz-question-title" id="quiz-question-title">
          {question.questionText}
        </h2>
        <div className="quiz-answer-area">
          {question.type === 'multiple_choice' ? (
            <MultipleChoiceAnswer answer={answer} onChange={updateAnswer} question={question} />
          ) : (
            <TextAnswer answer={answer} onChange={updateAnswer} question={question} />
          )}
        </div>

        {notice && (
          <p className="quiz-notice" role="alert">
            {notice} 첫 번째 미응답 문제로 이동했습니다.
          </p>
        )}

        <footer className="quiz-question-footer">
          <Button disabled={currentIndex === 0} onClick={() => moveToQuestion(currentIndex - 1)} variant="secondary">
            <span aria-hidden="true">←</span> 이전 문제
          </Button>
          <div className="quiz-question-footer-status">
            <span>{isAnswered(answer) ? '이 문제에 답했습니다.' : '답안을 입력해 주세요.'}</span>
            {isLastQuestion && unansweredCount > 0 && <small>미응답 {unansweredCount}개</small>}
          </div>
          {isLastQuestion ? (
            <Button onClick={requestSubmit}>답안 제출하기</Button>
          ) : (
            <Button onClick={() => moveToQuestion(currentIndex + 1)}>
              다음 문제 <span aria-hidden="true">→</span>
            </Button>
          )}
        </footer>
      </div>
    </section>
  )
}
