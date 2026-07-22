import { useEffect, useRef, useState } from 'react'
import { Link, generatePath, useNavigate, useParams } from 'react-router'
import { useCreateQuiz } from '@/pages/learning-preparation/api/useCreateQuiz'
import { useValidationPolling } from '@/pages/learning-preparation/api/useValidationPolling'
import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/Button'
import '@/pages/learning-preparation/LearningPreparationPage.css'

const preparationSteps = [
  { code: 'EXTRACT', description: '제목과 본문 구조를 읽고 있습니다.', label: '콘텐츠 본문 확인' },
  { code: 'VALIDATE', description: '개발 학습에 적합한 콘텐츠인지 확인합니다.', label: '학습 콘텐츠 검증' },
  { code: 'CONNECT', description: '핵심 개념과 연관 태그를 연결합니다.', label: '지식 구조 연결' },
  { code: 'GENERATE', description: '학습 목표에 맞는 문제를 구성합니다.', label: '맞춤형 퀴즈 생성' },
] as const

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
  const navigate = useNavigate()
  const { contentId: contentIdParam } = useParams<{ contentId: string }>()
  const contentId = Number(contentIdParam)
  const [hasAdvancedToGenerate, setHasAdvancedToGenerate] = useState(false)
  const isRoutingRef = useRef(false)
  const hasTriggeredCreateRef = useRef(false)

  const { data: validationResponse, isError: isValidationError, refetch: retryValidation } = useValidationPolling(contentId)
  const validationStatus = validationResponse?.status

  const createQuizMutation = useCreateQuiz()

  // API 상태에 따라 렌더링 시점에 바로 activeStage 도출 (You might not need an effect)
  let activeStage = 1 // 1: VALIDATE(시작/진행 중)
  if (validationStatus === 'PASSED') {
    if (createQuizMutation.isSuccess) {
      activeStage = 4 // 모든 단계 완료
    } else {
      activeStage = hasAdvancedToGenerate ? 3 : 2 // CONNECT -> GENERATE 전환
    }
  }

  // PASSED 시 자동 퀴즈 생성 트리거 (Strict Mode 중복 호출 방지 ref 가드)
  useEffect(() => {
    if (
      validationStatus === 'PASSED' &&
      !hasTriggeredCreateRef.current &&
      !createQuizMutation.isPending &&
      !createQuizMutation.isSuccess &&
      !createQuizMutation.isError
    ) {
      hasTriggeredCreateRef.current = true
      createQuizMutation.mutate({ sourceValidationId: contentId })
    }
  }, [validationStatus, createQuizMutation, contentId])

  // 퀴즈 생성이 진행 중일 때, CONNECT(2) -> GENERATE(3)로 자연스럽게 넘어가는 시각적 지연(Fake Progress) 추가
  useEffect(() => {
    if (activeStage === 2 && createQuizMutation.isPending) {
      const timer = window.setTimeout(() => {
        setHasAdvancedToGenerate(true)
      }, 1000) // 1초 후 GENERATE 단계로 전환
      return () => window.clearTimeout(timer)
    }
  }, [activeStage, createQuizMutation.isPending])

  // 퀴즈 생성 성공 시 4단계 완료 처리 및 라우팅
  useEffect(() => {
    if (createQuizMutation.isSuccess && createQuizMutation.data && !isRoutingRef.current) {
      isRoutingRef.current = true
      const quizId = createQuizMutation.data.quizId
      const timer = window.setTimeout(() => {
        void navigate(generatePath(ROUTES.quiz, { quizId: String(quizId) }))
      }, 1000)

      return () => window.clearTimeout(timer)
    }
  }, [createQuizMutation.isSuccess, createQuizMutation.data, navigate])

  const complete = activeStage >= preparationSteps.length
  const progress = complete ? 100 : Math.round(((activeStage + 0.35) / preparationSteps.length) * 100)

  // 상태 분류: 검증 반려(REJECTED), 검증 실패(FAILED), 검증 API 조회 오류, 퀴즈 생성 실패를 분리
  const isRejected = validationStatus === 'REJECTED'
  const isFailed = validationStatus === 'FAILED'
  const isQuizCreateError = createQuizMutation.isError
  const bypassAvailable = validationResponse?.bypassAvailable ?? false

  const hasPipelineError = isRejected || isFailed || isValidationError || isQuizCreateError

  const errorMessage = isQuizCreateError
    ? '퀴즈 생성 중 오류가 발생했습니다.'
    : (validationResponse?.message ?? '콘텐츠 검증 중 문제가 발생했습니다.')

  const handleBypass = () => {
    if (!createQuizMutation.isPending) {
      createQuizMutation.mutate({ sourceValidationId: contentId })
    }
  }

  const handleRetryQuiz = () => {
    createQuizMutation.reset()
    createQuizMutation.mutate({ sourceValidationId: contentId })
  }

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
          <span className="preparation-mock-badge">LIVE PROCESS</span>
        </div>

        <div className="preparation-progress mt-8">
          <div className="flex items-center justify-between gap-4">
            <p aria-live="polite" className="text-caption font-semibold text-text-secondary">
              {complete
                ? '모든 준비가 완료되었습니다.'
                : hasPipelineError
                  ? '문제가 발생했습니다.'
                  : preparationSteps[activeStage].description}
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
              <span>{complete ? 'COMPILED' : hasPipelineError ? 'HALTED' : 'RUNNING'}</span>
            </div>
            <ol className="preparation-stage-list">
              {preparationSteps.map((step, index) => {
                const isComplete = index < activeStage
                const isActive = index === activeStage && !complete && !hasPipelineError
                const isErrorState = index === activeStage && hasPipelineError

                return (
                  <li
                    aria-current={isActive || isErrorState ? 'step' : undefined}
                    className={`preparation-stage ${isActive ? 'preparation-stage-active' : ''} ${isComplete ? 'preparation-stage-complete' : ''} ${isErrorState ? 'preparation-stage-error' : ''}`}
                    key={step.code}
                  >
                    <span className="preparation-stage-number">
                      {isComplete ? '✓' : isErrorState ? '⚠' : `0${index + 1}`}
                    </span>
                    <span className="min-w-0">
                      <span className="preparation-stage-code">{step.code}</span>
                      <strong className="preparation-stage-label">{step.label}</strong>
                      <span className="preparation-stage-description">{step.description}</span>
                    </span>
                    <span aria-hidden="true" className="preparation-stage-state">
                      {isComplete ? 'DONE' : isErrorState ? 'ERROR' : isActive ? 'RUNNING' : 'WAITING'}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="preparation-graph-panel" aria-labelledby="graph-title">
            <div className="preparation-panel-header">
              <span id="graph-title">{hasPipelineError ? 'PROCESS ERROR' : 'KNOWLEDGE MAP'}</span>
              <span>{hasPipelineError ? 'FAILED' : 'LIVE'}</span>
            </div>
            {isQuizCreateError ? (
              <div className="flex h-[17.5rem] flex-col items-center justify-center rounded-xl bg-surface-panel p-6 text-center shadow-[inset_0_0_0_1px_var(--color-border-default)]">
                <span className="text-4xl text-status-error" aria-hidden="true">⚠</span>
                <p className="mt-4 text-label font-medium text-text-primary">
                  퀴즈 생성 중 오류가 발생했습니다.
                </p>
                <div className="mt-6 w-full max-w-[200px]">
                  <Button
                    fullWidth
                    loading={createQuizMutation.isPending}
                    onClick={handleRetryQuiz}
                    variant="primary"
                  >
                    퀴즈 생성 재시도
                  </Button>
                </div>
              </div>
            ) : isValidationError ? (
              <div className="flex h-[17.5rem] flex-col items-center justify-center rounded-xl bg-surface-panel p-6 text-center shadow-[inset_0_0_0_1px_var(--color-border-default)]">
                <span className="text-4xl text-status-error" aria-hidden="true">⚠</span>
                <p className="mt-4 text-label font-medium text-text-primary">
                  검증 상태를 가져오지 못했습니다.
                </p>
                <div className="mt-6 w-full max-w-[200px]">
                  <Button
                    fullWidth
                    onClick={() => void retryValidation()}
                    variant="primary"
                  >
                    다시 시도
                  </Button>
                </div>
              </div>
            ) : isFailed ? (
              <div className="flex h-[17.5rem] flex-col items-center justify-center rounded-xl bg-surface-panel p-6 text-center shadow-[inset_0_0_0_1px_var(--color-border-default)]">
                <span className="text-4xl text-status-error" aria-hidden="true">⚠</span>
                <p className="mt-4 text-label font-medium text-text-primary">
                  {errorMessage}
                </p>
                <div className="mt-6 w-full max-w-[200px]">
                  <Button
                    fullWidth
                    onClick={() => void retryValidation()}
                    variant="primary"
                  >
                    다시 시도
                  </Button>
                </div>
              </div>
            ) : isRejected ? (
              <div className="flex h-[17.5rem] flex-col items-center justify-center rounded-xl bg-surface-panel p-6 text-center shadow-[inset_0_0_0_1px_var(--color-border-default)]">
                <span className="text-4xl text-status-error" aria-hidden="true">⚠</span>
                <p className="mt-4 text-label font-medium text-text-primary">
                  {errorMessage}
                </p>
                {bypassAvailable && (
                  <div className="mt-6 w-full max-w-[200px]">
                    <Button
                      fullWidth
                      loading={createQuizMutation.isPending}
                      onClick={handleBypass}
                      variant="danger"
                    >
                      무시하고 퀴즈 만들기
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <KnowledgeGraph complete={complete} />
                <div className="preparation-tags" aria-label="감지된 핵심 태그">
                  <span>#architecture</span>
                  <span>#backend</span>
                  <span>#transaction</span>
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="preparation-footer">
          <div>
            <p className="text-caption font-semibold text-text-secondary">
              {complete
                ? '생성 결과를 확인할 준비가 됐습니다.'
                : hasPipelineError
                  ? '진행이 중단되었습니다.'
                  : '잠시만 기다려 주세요.'}
            </p>
            <p className="mt-1 text-[0.6875rem] leading-5 text-text-muted">
              실제 API 연동 후 서버의 생성 상태와 동기화됩니다.
            </p>
          </div>
          <Link className="preparation-back-link" to={ROUTES.home}>
            입력 화면으로 돌아가기
          </Link>
        </footer>
      </section>
    </main>
  )
}
