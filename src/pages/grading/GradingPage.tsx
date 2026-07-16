import { useEffect, useState, type CSSProperties } from 'react'
import { generatePath, Link, useSearchParams } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui'
import '@/pages/grading/GradingPage.css'

type GradingStatus = 'running' | 'success' | 'error'

const gradingSteps = [
  { description: '제출한 5개 답안의 형식을 확인합니다.', label: '답안 확인' },
  { description: '선택한 답안을 기준으로 자동 채점합니다.', label: '객관식 채점' },
  { description: '답변의 의미와 핵심 개념을 분석합니다.', label: '주관식 AI 평가' },
  { description: '코드 문맥과 빈칸 답안을 함께 확인합니다.', label: '코드 답안 평가' },
  { description: '문제별 결과와 피드백을 정리합니다.', label: '결과 리포트 준비' },
] as const

export function GradingPage() {
  const [searchParams] = useSearchParams()
  const [activeStage, setActiveStage] = useState(0)
  const [attemptNumber, setAttemptNumber] = useState(0)
  const [status, setStatus] = useState<GradingStatus>('running')

  const shouldFailFirstAttempt = searchParams.get('mock') === 'failed'
  const progress = status === 'success' ? 100 : Math.round(((activeStage + 1) / gradingSteps.length) * 100)
  const resultPath = generatePath(ROUTES.resultReport, { reportId: 'mock-report' })

  useEffect(() => {
    const timers: number[] = []
    const willFail = shouldFailFirstAttempt && attemptNumber === 0

    gradingSteps.slice(1, willFail ? 3 : undefined).forEach((_, index) => {
      timers.push(window.setTimeout(() => setActiveStage(index + 1), 800 * (index + 1)))
    })

    timers.push(
      window.setTimeout(
        () => setStatus(willFail ? 'error' : 'success'),
        willFail ? 2400 : 4000,
      ),
    )

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [attemptNumber, shouldFailFirstAttempt])

  function retryGrading() {
    setActiveStage(0)
    setStatus('running')
    setAttemptNumber((current) => current + 1)
  }

  const title = status === 'success'
    ? '채점이 완료되었습니다'
    : status === 'error'
      ? '채점 중 문제가 발생했습니다'
      : '답안을 채점하고 있습니다'

  return (
    <div className={`grading-page grading-page-${status}`}>
      <section className="mx-auto max-w-5xl py-12 sm:py-16 lg:py-20" aria-labelledby="grading-title">
        <header className="grading-heading">
          <div>
            <h1 className="text-title font-bold text-text-primary sm:text-[2.25rem]" id="grading-title">{title}</h1>
            <p className="mt-3 max-w-2xl text-label leading-6 text-text-muted">
              {status === 'error'
                ? '제출한 답안은 그대로 보존되어 있습니다. 다시 시도해 주세요.'
                : status === 'success'
                  ? '모든 답안의 평가와 결과 정리가 끝났습니다.'
                  : '답변의 의미와 코드 문맥을 확인하고 있습니다. 잠시만 기다려 주세요.'}
            </p>
          </div>
          <span className="grading-status-badge" aria-live="polite">
            {status === 'success' ? 'COMPLETED' : status === 'error' ? 'FAILED' : 'GRADING'}
          </span>
        </header>

        <div className="grading-panel mt-8">
          <div className="grading-progress-column">
            <div
              aria-label="채점 진행률"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress}
              className="grading-progress-ring"
              role="progressbar"
              style={{ '--grading-progress': `${progress * 3.6}deg` } as CSSProperties}
            >
              <div className="grading-progress-ring-inner">
                <strong>{progress}%</strong>
                <span>{status === 'success' ? '완료' : status === 'error' ? '중단됨' : '처리 중'}</span>
              </div>
            </div>
            <p aria-live="polite" className="grading-current-message">
              {status === 'success'
                ? '결과 리포트가 준비되었습니다.'
                : status === 'error'
                  ? '일시적인 오류로 채점을 완료하지 못했습니다.'
                  : gradingSteps[activeStage].description}
            </p>
          </div>

          <ol className="grading-step-list" aria-label="채점 처리 단계">
            {gradingSteps.map((step, index) => {
              const complete = status === 'success' || index < activeStage
              const active = status === 'running' && index === activeStage
              const failed = status === 'error' && index === activeStage

              return (
                <li
                  aria-current={active ? 'step' : undefined}
                  className={`grading-step ${active ? 'grading-step-active' : ''} ${complete ? 'grading-step-complete' : ''} ${failed ? 'grading-step-error' : ''}`}
                  key={step.label}
                >
                  <span aria-hidden="true" className="grading-step-marker">
                    {complete ? '✓' : failed ? '!' : String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <strong>{step.label}</strong>
                    <span>{step.description}</span>
                  </span>
                  <small>{complete ? '완료' : failed ? '실패' : active ? '진행 중' : '대기'}</small>
                </li>
              )
            })}
          </ol>
        </div>

        <footer className="grading-footer">
          {status === 'running' && <p>채점이 완료될 때까지 현재 화면을 유지해 주세요.</p>}
          {status === 'error' && (
            <>
              <div>
                <strong>답안은 안전하게 보존되어 있습니다.</strong>
                <p>같은 제출 건으로 채점을 다시 요청합니다.</p>
              </div>
              <Button onClick={retryGrading}>다시 시도하기</Button>
            </>
          )}
          {status === 'success' && (
            <>
              <div>
                <strong>학습 결과를 확인해 보세요.</strong>
                <p>문제별 결과와 오답 피드백을 확인할 수 있습니다.</p>
              </div>
              <Link className="grading-result-link" to={resultPath}>결과 리포트 보기 <span aria-hidden="true">→</span></Link>
            </>
          )}
        </footer>
      </section>
    </div>
  )
}
