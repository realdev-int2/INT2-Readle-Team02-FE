import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import '@/pages/learning-preparation/LearningPreparationPage.css'

const preparationSteps = [
  { code: 'EXTRACT', description: '제목과 본문 구조를 읽고 있습니다.', label: '콘텐츠 본문 확인' },
  { code: 'VALIDATE', description: '개발 학습에 적합한 콘텐츠인지 확인합니다.', label: '학습 콘텐츠 검증' },
  { code: 'CONNECT', description: '핵심 개념과 연관 태그를 연결합니다.', label: '지식 구조 연결' },
  { code: 'GENERATE', description: '학습 목표에 맞는 문제를 구성합니다.', label: '맞춤형 퀴즈 생성' },
] as const

const stageDelay = 900

function KnowledgeGraph({ complete }: { complete: boolean }) {
  return (
    <div
      aria-label="콘텐츠의 핵심 개념이 퀴즈로 연결되는 지식 그래프"
      className={`preparation-graph ${complete ? 'preparation-graph-complete' : ''}`}
      role="img"
    >
      <span aria-hidden="true" className="preparation-graph-grid" />
      <span aria-hidden="true" className="preparation-graph-line preparation-graph-line-1" />
      <span aria-hidden="true" className="preparation-graph-line preparation-graph-line-2" />
      <span aria-hidden="true" className="preparation-graph-line preparation-graph-line-3" />
      <span aria-hidden="true" className="preparation-graph-line preparation-graph-line-4" />
      <span className="preparation-graph-node preparation-graph-node-core">READLE</span>
      <span className="preparation-graph-node preparation-graph-node-1">ARTICLE</span>
      <span className="preparation-graph-node preparation-graph-node-2">CONCEPT</span>
      <span className="preparation-graph-node preparation-graph-node-3">CONTEXT</span>
      <span className="preparation-graph-node preparation-graph-node-4">QUIZ</span>
    </div>
  )
}

export function LearningPreparationPage() {
  const [activeStage, setActiveStage] = useState(0)
  const complete = activeStage >= preparationSteps.length
  const progress = complete ? 100 : Math.round(((activeStage + 0.35) / preparationSteps.length) * 100)

  useEffect(() => {
    const timers = preparationSteps.map((_, index) =>
      window.setTimeout(() => setActiveStage(index + 1), stageDelay * (index + 1)),
    )

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return (
    <main className="preparation-page">
      <section className="mx-auto max-w-content py-10 sm:py-14 lg:py-16" aria-labelledby="preparation-title">
        <div className="preparation-heading">
          <div>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="preparation-live-dot" />
              <p className="font-mono text-[0.625rem] font-bold tracking-[0.16em] text-brand-400">
                READLE KNOWLEDGE COMPILER
              </p>
            </div>
            <h1 className="mt-3 text-title font-bold text-text-primary sm:text-[2.25rem]" id="preparation-title">
              {complete ? '퀴즈 생성 준비가 완료됐습니다' : '퀴즈를 만들고 있습니다'}
            </h1>
            <p className="mt-3 max-w-2xl text-label leading-6 text-text-muted">
              콘텐츠를 분석하고 핵심 개념을 연결해 맞춤형 문제를 구성합니다.
            </p>
          </div>
          <span className="preparation-mock-badge">MOCK PROCESS</span>
        </div>

        <div className="preparation-progress mt-8">
          <div className="flex items-center justify-between gap-4">
            <p aria-live="polite" className="text-caption font-semibold text-text-secondary">
              {complete ? '모든 준비가 완료되었습니다.' : preparationSteps[activeStage].description}
            </p>
            <strong className="font-mono text-label text-brand-400">{progress}%</strong>
          </div>
          <div
            aria-label="퀴즈 생성 진행률"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="preparation-progress-track mt-3"
            role="progressbar"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="preparation-workspace mt-5">
          <section className="preparation-stage-panel" aria-label="퀴즈 생성 단계">
            <div className="preparation-panel-header">
              <span>PROCESS PIPELINE</span>
              <span>{complete ? 'COMPILED' : 'RUNNING'}</span>
            </div>
            <ol className="preparation-stage-list">
              {preparationSteps.map((step, index) => {
                const isComplete = index < activeStage
                const isActive = index === activeStage && !complete

                return (
                  <li
                    aria-current={isActive ? 'step' : undefined}
                    className={`preparation-stage ${isActive ? 'preparation-stage-active' : ''} ${isComplete ? 'preparation-stage-complete' : ''}`}
                    key={step.code}
                  >
                    <span className="preparation-stage-number">{isComplete ? '✓' : `0${index + 1}`}</span>
                    <span className="min-w-0">
                      <span className="preparation-stage-code">{step.code}</span>
                      <strong className="preparation-stage-label">{step.label}</strong>
                      <span className="preparation-stage-description">{step.description}</span>
                    </span>
                    <span aria-hidden="true" className="preparation-stage-state">
                      {isComplete ? 'DONE' : isActive ? 'RUNNING' : 'WAITING'}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="preparation-graph-panel" aria-labelledby="graph-title">
            <div className="preparation-panel-header">
              <span id="graph-title">KNOWLEDGE MAP</span>
              <span>LIVE</span>
            </div>
            <KnowledgeGraph complete={complete} />
            <div className="preparation-tags" aria-label="감지된 핵심 태그">
              <span>#architecture</span>
              <span>#backend</span>
              <span>#transaction</span>
            </div>
          </section>
        </div>

        <footer className="preparation-footer">
          <div>
            <p className="text-caption font-semibold text-text-secondary">
              {complete ? '생성 결과를 확인할 준비가 됐습니다.' : '잠시만 기다려 주세요.'}
            </p>
            <p className="mt-1 text-[0.6875rem] leading-5 text-text-muted">
              실제 API 연동 후 서버의 생성 상태와 동기화됩니다.
            </p>
          </div>
          <Link className="preparation-back-link" to={ROUTES.home}>입력 화면으로 돌아가기</Link>
        </footer>
      </section>
    </main>
  )
}
