import { useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import {
  getAnsweredCount,
  getFirstUnansweredIndex,
  mockQuiz,
  type QuizAnswer,
  type QuizAnswers,
} from '@/pages/quiz/model/quiz'
import { ROUTES } from '@/shared/config/routes'
import '@/pages/quiz/QuizPage.css'

import { QuizNavigator } from '@/pages/quiz/ui/QuizNavigator'
import { QuizQuestionArea } from '@/pages/quiz/ui/QuizQuestionArea'
import { QuizSubmitConfirm } from '@/pages/quiz/ui/QuizSubmitConfirm'

export function QuizPage() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [notice, setNotice] = useState<string>()

  const quiz = mockQuiz
  const question = quiz.questions[currentIndex]
  const answeredCount = getAnsweredCount(quiz.questions, answers)
  const unansweredCount = quiz.questionCount - answeredCount
  const isLastQuestion = currentIndex === quiz.questionCount - 1
  const progress = ((currentIndex + 1) / quiz.questionCount) * 100

  function updateAnswer(answer: QuizAnswer) {
    setAnswers((current) => ({ ...current, [question.questionId]: answer }))
    setNotice(undefined)
  }

  function moveToQuestion(index: number) {
    setCurrentIndex(index)
    setNotice(undefined)
  }

  function requestSubmit() {
    const firstUnansweredIndex = getFirstUnansweredIndex(quiz.questions, answers)

    if (firstUnansweredIndex >= 0) {
      const currentAnsweredCount = getAnsweredCount(quiz.questions, answers)
      const currentUnansweredCount = quiz.questionCount - currentAnsweredCount

      setCurrentIndex(firstUnansweredIndex)
      setNotice(`아직 답하지 않은 문제가 ${currentUnansweredCount}개 있습니다.`)
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
          <h1 className="truncate text-heading font-bold text-text-primary sm:text-title">{quiz.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="퀴즈 태그">
            {quiz.tags.map((tag) => (
              <span className="quiz-tag" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="quiz-progress-summary">
          <strong>{currentIndex + 1}</strong>
          <span>/ {quiz.questionCount}</span>
          <small>문제 풀이 중</small>
        </div>
      </header>

      <div className="quiz-progress-row mt-6" aria-label={`문제 진행률 ${Math.round(progress)}%`}>
        <div className="quiz-progress-segments" aria-hidden="true">
          {quiz.questions.map((item, index) => (
            <span className={index <= currentIndex ? 'quiz-progress-segment-filled' : ''} key={item.questionId} />
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
          questions={quiz.questions}
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
        <QuizSubmitConfirm onCancel={() => setShowConfirmation(false)} onConfirm={confirmSubmit} />
      )}
    </div>
  )
}
