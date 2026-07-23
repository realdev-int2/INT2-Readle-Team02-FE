import type { CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  formatCompletedAt,
  formatDuration,
  mockResultReport,
  type QuestionResult,
} from '@/pages/result-report/model/resultReport'
import { questionTypeLabel } from '@/pages/quiz/model/quiz'
import { ROUTES } from '@/shared/config/routes'
import { ErrorMessage, Loading } from '@/shared/ui'
import '@/pages/result-report/ResultReportPage.css'

type ReportMockState = 'ready' | 'loading' | 'not-ready' | 'not-found' | 'forbidden'

function parseReportMockState(value: string | null): ReportMockState {
  switch (value) {
    case 'loading':
    case 'not-ready':
    case 'not-found':
    case 'forbidden':
      return value
    default:
      return 'ready'
  }
}

function QuestionResultItem({ result }: { result: QuestionResult }) {
  return (
    <details className={`result-question ${result.isCorrect ? 'result-question-correct' : 'result-question-incorrect'}`}>
      <summary>
        <span aria-hidden="true" className="result-question-status">{result.isCorrect ? '✓' : '!'}</span>
        <span className="result-question-summary">
          <span className="result-question-meta">
            QUESTION {String(result.orderNo).padStart(2, '0')} · {questionTypeLabel[result.questionType as keyof typeof questionTypeLabel] ?? result.questionType}
          </span>
          <strong>{result.questionText}</strong>
        </span>
        <span className="result-question-verdict">{result.isCorrect ? '정답' : '오답'}</span>
        <span aria-hidden="true" className="result-question-chevron">⌄</span>
      </summary>

      <div className="result-question-detail">
        <section aria-labelledby={`answer-title-${result.questionId}`} className="result-answer-panel">
          <h3 id={`answer-title-${result.questionId}`}>내가 제출한 답안</h3>
          {result.questionType === 'code_blank'
            ? <code>{result.submittedAnswer}</code>
            : <p>{result.submittedAnswer}</p>}
        </section>

        {!result.isCorrect && result.aiFeedback && (
          <section aria-labelledby={`feedback-title-${result.questionId}`} className="result-feedback-panel">
            <div className="result-feedback-heading">
              <span aria-hidden="true">AI</span>
              <h3 id={`feedback-title-${result.questionId}`}>다시 짚어볼 부분</h3>
            </div>
            <p>{result.aiFeedback}</p>
          </section>
        )}
      </div>
    </details>
  )
}

function ReportLoadingState() {
  return (
    <section aria-live="polite" className="result-state-card">
      <Loading label="결과 리포트를 불러오는 중" size="lg" />
      <h1>결과 리포트를 불러오고 있습니다</h1>
      <p>학습 결과와 문제별 피드백을 정리하고 있습니다.</p>
    </section>
  )
}

function ReportErrorState({ state }: { state: Exclude<ReportMockState, 'ready' | 'loading'> }) {
  const content = {
    'not-ready': {
      code: 'REPORT_NOT_READY',
      title: '결과 리포트를 준비하고 있습니다',
      description: '채점 결과를 정리하고 있습니다. 잠시 후 다시 확인해 주세요.',
    },
    'not-found': {
      code: 'REPORT_NOT_FOUND',
      title: '결과 리포트를 찾을 수 없습니다',
      description: '삭제되었거나 존재하지 않는 학습 결과입니다.',
    },
    forbidden: {
      code: 'FORBIDDEN',
      title: '결과 리포트에 접근할 수 없습니다',
      description: '본인의 학습 결과만 확인할 수 있습니다.',
    },
  }[state]

  return (
    <section className="result-state-card">
      <ErrorMessage>{content.code}</ErrorMessage>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <Link className="result-state-link" to={ROUTES.dashboard}>학습 현황으로 이동</Link>
    </section>
  )
}

export function ResultReportPage() {
  const [searchParams] = useSearchParams()
  const mockState = parseReportMockState(searchParams.get('mock'))

  if (mockState === 'loading') return <ReportLoadingState />
  if (mockState !== 'ready') return <ReportErrorState state={mockState} />

  const report = mockResultReport
  const incorrectCount = report.totalCount - report.correctCount
  const scoreStyle = { '--result-score': `${report.accuracyRate * 3.6}deg` } as CSSProperties

  return (
    <div className="result-page py-8 sm:py-12 lg:py-16">
      <header className="result-hero">
        <div className="result-heading-copy">
          <span className="result-kicker">결과 리포트</span>
          <h1>{report.title}</h1>
          <p>잘 이해한 개념과 다시 살펴볼 부분을 확인해 보세요.</p>
          <div aria-label="퀴즈 태그" className="result-tags">
            {report.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
        </div>

        <div aria-label={`정답률 ${report.accuracyRate}%`} className="result-score-ring" style={scoreStyle}>
          <div>
            <strong>{report.accuracyRate}</strong>
            <span>%</span>
            <small>정답률</small>
          </div>
        </div>
      </header>

      <section aria-label="학습 결과 요약" className="result-summary-bar">
        <article>
          <span>정답</span>
          <strong>{report.correctCount} / {report.totalCount}</strong>
        </article>
        <article>
          <span>풀이 시간</span>
          <strong>{formatDuration(report.solveDurationSeconds)}</strong>
        </article>
        <article>
          <span>완료 시각</span>
          <strong>{formatCompletedAt(report.completedAt)}</strong>
        </article>
      </section>

      <section aria-labelledby="result-list-title" className="result-list">
        <div className="result-list-heading">
          <div>
            <h2 id="result-list-title">문제별 풀이 결과</h2>
            <p>문제를 선택하면 제출한 답안과 오답 피드백을 확인할 수 있습니다.</p>
          </div>
          <span>오답 {incorrectCount}문제</span>
        </div>

        <div className="result-question-list">
          {report.results.map((result) => (
            <QuestionResultItem key={result.questionId} result={result} />
          ))}
        </div>
      </section>

      <footer className="result-actions">
        <Link className="result-action-primary" to={ROUTES.dashboard}>학습 현황 보기</Link>
        <Link className="result-action-secondary" to={ROUTES.home}>새 퀴즈 만들기</Link>
      </footer>
    </div>
  )
}
