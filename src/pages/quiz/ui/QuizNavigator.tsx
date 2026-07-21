import { isAnswered, questionTypeLabel, type QuizAnswers, type QuizQuestion } from '@/pages/quiz/model/quiz'

export interface QuizNavigatorProps {
  questions: QuizQuestion[]
  answers: QuizAnswers
  currentIndex: number
  answeredCount: number
  moveToQuestion: (index: number) => void
}

export function QuizNavigator({
  questions,
  answers,
  currentIndex,
  answeredCount,
  moveToQuestion,
}: QuizNavigatorProps) {
  return (
    <aside className="quiz-navigator" aria-label="문제 바로가기">
      <div className="quiz-navigator-heading">
        <span>문제 목록</span>
        <strong>
          {answeredCount}/{questions.length} 완료
        </strong>
      </div>
      <ol className="quiz-question-list">
        {questions.map((item, index) => {
          const active = index === currentIndex
          const answered = isAnswered(answers[item.questionId])

          return (
            <li key={item.questionId}>
              <button
                aria-current={active ? 'step' : undefined}
                aria-label={`${item.orderNo}번 문제${answered ? ', 답변 완료' : ''}`}
                className={`quiz-question-link ${active ? 'quiz-question-link-active' : ''} ${
                  answered ? 'quiz-question-link-answered' : ''
                }`}
                onClick={() => moveToQuestion(index)}
                type="button"
              >
                <span>{String(item.orderNo).padStart(2, '0')}</span>
                <span>{questionTypeLabel[item.type]}</span>
                <span aria-hidden="true" className="quiz-question-link-state">
                  {answered ? '✓' : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
