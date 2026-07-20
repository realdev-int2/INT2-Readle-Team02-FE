import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/AuthContext'
import readleSymbolUrl from '@/shared/assets/readle-symbol.png'
import readleWordmarkUrl from '@/shared/assets/readle-wordmark.png'
import { ROUTES } from '@/shared/config/routes'
import { PageContainer, ProfileAvatar } from '@/shared/ui'
import { LoginModal } from '@/pages/landing/ui/LoginModal'
import { sanitizeReturnTo } from '@/pages/landing/model/sanitizeReturnTo'
import '@/pages/landing/LandingPage.css'

interface LandingPageProps {
  initialLoginOpen?: boolean
}

const features = [
  {
    code: '01',
    title: 'URL 하나면 충분합니다',
    description:
      '기술 블로그 링크를 붙여넣거나 텍스트를 입력하세요. 복잡한 프롬프트 없이 바로 학습을 시작합니다.',
  },
  {
    code: '02',
    title: '개발 콘텐츠에 맞춘 문제',
    description:
      'AI가 콘텐츠 적합성과 유형을 분석해 객관식, 주관식, 코드 빈칸 문제를 맥락에 맞게 구성합니다.',
  },
  {
    code: '03',
    title: '틀린 이유까지 배우는 피드백',
    description:
      '정답 여부만 보여주지 않습니다. 놓친 개념과 다시 확인할 원문 구간을 함께 안내합니다.',
  },
  {
    code: '04',
    title: '쌓일수록 선명해지는 학습 기록',
    description:
      '완료한 퀴즈와 태그별 기록을 모아 무엇을 이해했고 어디를 보완할지 한눈에 확인합니다.',
  },
] as const

const steps = [
  {
    number: '01',
    title: '콘텐츠를 넣으세요',
    description: '기술 아티클 URL 또는 학습할 텍스트를 입력합니다.',
  },
  {
    number: '02',
    title: 'AI가 퀴즈로 바꿉니다',
    description: '콘텐츠를 검증하고 핵심 개념을 1~5개의 문제로 구성합니다.',
  },
  {
    number: '03',
    title: '풀고, 이해도를 확인하세요',
    description: '즉시 채점과 오답 피드백으로 읽은 내용을 내 지식으로 만듭니다.',
  },
] as const

const codeFragments = [
  'const knowledge = await read(article)',
  'quiz.generate({ count: 5 })',
  'if (understood) return explain()',
  'type Question = MultipleChoice | Code',
  'feedback.from(context)',
  'await validate(developerContent)',
  'score: 4 / 5',
  'concepts.map(toQuestion)',
] as const

function BrandLogo() {
  return (
    <span className="flex items-center gap-2">
      <img alt="" aria-hidden="true" className="size-8 rounded-sm" src={readleSymbolUrl} />
      <img alt="Readle" className="h-7 w-auto" src={readleWordmarkUrl} />
    </span>
  )
}

function CodeStream() {
  return (
    <div aria-hidden="true" className="landing-code-stream">
      {codeFragments.map((fragment) => (
        <span className="landing-code-particle" key={fragment}>
          {fragment}
        </span>
      ))}
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="landing-preview relative mx-auto w-full max-w-xl lg:mx-0">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-brand-500/10 blur-3xl" />
      <div className="landing-demo overflow-hidden rounded-[1.5rem] border border-border-glass bg-surface-glass shadow-[0_2rem_7rem_rgb(0_0_0/0.48)] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-border-glass px-4 py-3.5 sm:px-5">
          <span className="size-2 rounded-full bg-status-error/80" />
          <span className="size-2 rounded-full bg-[#FBBF24]/80" />
          <span className="size-2 rounded-full bg-status-success/80" />
          <span className="ml-2 font-mono text-[0.625rem] text-text-muted">readle.engine</span>
          <span className="ml-auto rounded-full border border-brand-400/20 bg-brand-500/10 px-2.5 py-1 text-[0.5625rem] font-bold tracking-wider text-brand-400">
            LIVE DEMO
          </span>
        </div>

        <p className="sr-only">
          기술 아티클 URL을 분석하고 핵심 개념을 추출해 퀴즈를 생성하는 Readle 데모입니다.
        </p>

        <div className="landing-demo-grid">
          <div className="landing-terminal" aria-hidden="true">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[0.625rem] font-bold tracking-[0.16em] text-text-muted">
                ANALYSIS CONSOLE
              </span>
              <span className="landing-terminal-status flex items-center gap-1.5 font-mono text-[0.5625rem] text-status-success">
                <span className="size-1.5 rounded-full bg-status-success" /> ACTIVE
              </span>
            </div>

            <div className="landing-command-line font-mono text-[0.6875rem] leading-5 text-text-secondary sm:text-xs">
              <span className="mr-2 text-brand-400">$</span>
              <span className="landing-command">readle analyze tech.dev/transaction</span>
              <span className="landing-cursor" />
            </div>

            <div className="landing-logs mt-5 space-y-2 font-mono text-[0.625rem] leading-5 sm:text-[0.6875rem]">
              <p className="landing-log"><span>01</span> extracting content...</p>
              <p className="landing-log"><span>02</span> validating developer context... <b>PASS</b></p>
              <p className="landing-log"><span>03</span> concepts: transaction, propagation</p>
              <p className="landing-log"><span>04</span> generating quiz 1/5...</p>
              <p className="landing-log landing-log-ready"><span>✓</span> QUIZ_READY</p>
            </div>
          </div>

          <article className="landing-rendered-quiz relative border-t border-border-glass bg-surface-panel p-5 sm:p-6 lg:border-t-0 lg:border-l">
            <div className="landing-scan-line" aria-hidden="true" />
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[0.5625rem] font-bold tracking-[0.14em] text-brand-400">
                RENDER / QUIZ_01
              </span>
              <span className="rounded-full border border-border-glass px-2 py-1 text-[0.5625rem] text-text-muted">
                객관식
              </span>
            </div>
            <h3 className="mt-5 text-sm font-semibold leading-6 text-text-primary sm:text-[0.9375rem]">
              트랜잭션 전파 속성이 필요한 이유는 무엇일까요?
            </h3>
            <div className="mt-4 grid gap-2.5">
              {[
                '작업 단위 사이의 실행 경계를 제어하기 위해',
                '모든 쿼리를 비동기로 실행하기 위해',
              ].map((answer, index) => (
                <div
                  className={`landing-answer flex items-center gap-3 rounded-control border px-3 py-2.5 text-[0.6875rem] leading-5 ${
                    index === 0
                      ? 'border-brand-400/50 bg-brand-500/10 text-text-primary shadow-focus'
                      : 'border-border-default text-text-muted'
                  }`}
                  key={answer}
                >
                  <span
                    className={`grid size-5 place-items-center rounded-full border text-[0.625rem] ${
                      index === 0 ? 'border-brand-400 text-brand-400' : 'border-border-strong'
                    }`}
                  >
                    {index + 1}
                  </span>
                  {answer}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border-glass pt-3">
              <span className="text-[0.625rem] text-text-muted">핵심 개념 이해도</span>
              <strong className="font-mono text-xs text-status-success">80%</strong>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

export function LandingPage({ initialLoginOpen = false }: LandingPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { consumeSessionExpired, member, logout } = useAuth()
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const [loginOpen, setLoginOpen] = useState(initialLoginOpen)
  const [authError] = useState(() => new URLSearchParams(location.search).get('authError'))
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const profileLabel = member ? `${member.nickname} 프로필` : '프로필'

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!params.has('authError')) {
      return
    }

    params.delete('authError')
    if (params.has('returnTo')) {
      params.set('returnTo', sanitizeReturnTo(params.get('returnTo')))
    }
    void navigate(
      {
        hash: location.hash,
        pathname: location.pathname,
        search: params.size ? `?${params}` : '',
      },
      { replace: true },
    )
  }, [location.hash, location.pathname, location.search, navigate])

  useEffect(() => {
    if (authError === 'session_expired') {
      consumeSessionExpired?.()
    }
  }, [authError, consumeSessionExpired])

  function openLogin(event: MouseEvent<HTMLElement>) {
    returnFocusRef.current = event.currentTarget
    setLoginOpen(true)
  }

  const closeLogin = useCallback(() => {
    setLoginOpen(false)

    if (initialLoginOpen) {
      void navigate(ROUTES.landing, { replace: true })
    }

    window.requestAnimationFrame(() => returnFocusRef.current?.focus())
  }, [initialLoginOpen, navigate])

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)
    setLogoutError('')

    try {
      await logout()
    } catch {
      setLogoutError('로그아웃에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="landing-page text-text-primary">
      <div className="landing-hero-glow" />
      <header className="sticky top-0 z-50 border-b border-border-glass bg-surface-canvas/72 backdrop-blur-xl">
        <PageContainer className="flex min-h-16 items-center justify-between gap-6">
          <Link
            aria-label="Readle 랜딩 홈"
            className="rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
            to={ROUTES.landing}
          >
            <BrandLogo />
          </Link>
          <nav aria-label="랜딩 페이지 메뉴" className="hidden items-center gap-7 md:flex">
            <a className="text-label text-text-muted transition-colors hover:text-text-primary" href="#why-readle">
              서비스 소개
            </a>
            <a className="text-label text-text-muted transition-colors hover:text-text-primary" href="#how-it-works">
              학습 방식
            </a>
            <a className="text-label text-text-muted transition-colors hover:text-text-primary" href="#features">
              핵심 기능
            </a>
          </nav>
          {member ? (
            <div className="flex items-center gap-2">
              <ProfileAvatar
                imageUrl={member.profileImageUrl}
                label={profileLabel}
                nickname={member.nickname}
              />
              <button
                aria-busy={isLoggingOut}
                aria-describedby={logoutError ? 'landing-logout-error' : undefined}
                className="min-h-9 rounded-control px-2 text-caption font-semibold text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                type="button"
              >
                {isLoggingOut ? '로그아웃 중' : '로그아웃'}
              </button>
              {logoutError && (
                <p className="text-caption text-status-error" id="landing-logout-error" role="alert">
                  {logoutError}
                </p>
              )}
            </div>
          ) : (
            <button
              className="rounded-control border border-border-strong bg-surface-panel px-4 py-2 text-label font-semibold text-text-primary transition-all hover:border-brand-400/60 hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              onClick={openLogin}
              type="button"
            >
              로그인
            </button>
          )}
        </PageContainer>
      </header>

      <main>
        <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
          <CodeStream />
          <PageContainer className="relative z-10 grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-3 py-1.5 text-caption font-semibold text-brand-400 lg:mx-0">
                <span className="size-1.5 rounded-full bg-brand-400 shadow-accent" />
                AI ACTIVE LEARNING FOR DEVELOPERS
              </p>
              <h1 className="mt-7 text-[2.55rem] font-bold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[4.25rem]">
                읽어본 기술 글을
                <span className="mt-2 block bg-linear-to-r from-brand-400 via-[#8AA8FF] to-[#A78BFA] bg-clip-text text-transparent">
                  설명할 수 있는 지식으로.
                </span>
              </h1>
              <p className="mx-auto mt-7 max-w-xl text-body leading-7 text-text-secondary sm:text-section sm:leading-8 lg:mx-0">
                기술 아티클 URL이나 텍스트를 넣으면 AI가 핵심을 분석해 맞춤형 퀴즈를 만듭니다.
                읽고 끝내지 말고, 풀고 피드백받으며 진짜 내 것으로 만드세요.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-linear-to-r from-brand-400 to-brand-600 px-6 text-label font-bold text-white shadow-button transition-all hover:-translate-y-0.5 hover:shadow-button-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
                  onClick={openLogin}
                  type="button"
                >
                  학습 시작하기
                  <span aria-hidden="true">→</span>
                </button>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-control border border-border-strong bg-surface-panel/60 px-6 text-label font-semibold text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
                  href="#how-it-works"
                >
                  어떻게 학습하나요?
                </a>
              </div>
              <p className="mt-5 text-caption text-text-muted">
                복잡한 프롬프트 없이 URL 하나로 시작합니다.
              </p>
            </div>
            <ProductPreview />
          </PageContainer>
        </section>

        <section className="border-y border-border-glass bg-surface-panel/30 py-7">
          <PageContainer className="grid gap-5 text-center sm:grid-cols-3 sm:divide-x sm:divide-border-glass">
            {[
              ['URL · TEXT', '최소한의 입력'],
              ['1–5 QUIZZES', '콘텐츠 맞춤 문제'],
              ['3 TYPES', '객관식 · 주관식 · 코드'],
            ].map(([value, label]) => (
              <div className="px-5" key={value}>
                <p className="font-mono text-label font-bold tracking-wider text-brand-400">{value}</p>
                <p className="mt-1 text-caption text-text-muted">{label}</p>
              </div>
            ))}
          </PageContainer>
        </section>

        <section className="py-24 sm:py-32" id="why-readle">
          <PageContainer>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-label font-bold text-brand-400">WHY READLE</p>
              <h2 className="mt-4 text-title font-bold tracking-tight sm:text-4xl">
                북마크는 쌓이는데, 실력은 그대로인가요?
              </h2>
              <p className="mt-5 text-body leading-7 text-text-secondary">
                “읽어본 적 있다”와 “설명할 수 있다” 사이에는 큰 차이가 있습니다. Readle은 저장에서
                멈춘 기술 콘텐츠를 능동적인 학습 경험으로 연결합니다.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                ['SAVE', '저장한 글을 다시 열지 않습니다.', '북마크의 안도감은 지식으로 남지 않습니다.'],
                ['PROMPT', '매번 AI 프롬프트를 작성합니다.', '일회성 대화는 학습 기록으로 이어지지 않습니다.'],
                ['RECALL', '이해했는지 확인하기 어렵습니다.', '읽기만으로는 부족한 개념을 발견하기 어렵습니다.'],
              ].map(([label, title, description]) => (
                <article
                  className="rounded-card border border-border-glass bg-surface-glass p-6 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 hover:border-border-glass-hover"
                  key={label}
                >
                  <span className="font-mono text-caption font-bold text-brand-400">{label}</span>
                  <h3 className="mt-5 text-section font-bold">{title}</h3>
                  <p className="mt-3 text-label leading-6 text-text-muted">{description}</p>
                </article>
              ))}
            </div>
          </PageContainer>
        </section>

        <section className="border-y border-border-glass bg-surface-panel/25 py-24 sm:py-32" id="how-it-works">
          <PageContainer>
            <div className="max-w-2xl">
              <p className="text-label font-bold text-brand-400">HOW IT WORKS</p>
              <h2 className="mt-4 text-title font-bold tracking-tight sm:text-4xl">
                입력부터 피드백까지, 하나의 학습 흐름
              </h2>
              <p className="mt-4 text-body leading-7 text-text-secondary">
                복잡한 설정 없이 세 단계로 기술 콘텐츠를 내 지식으로 전환합니다.
              </p>
            </div>

            <ol className="mt-14 grid gap-5 lg:grid-cols-3">
              {steps.map((step) => (
                <li
                  className="group relative overflow-hidden rounded-card border border-border-default bg-surface-canvas/60 p-7 transition-colors hover:border-brand-400/35"
                  key={step.number}
                >
                  <span className="font-mono text-5xl font-bold text-brand-500/18 transition-colors group-hover:text-brand-500/30">
                    {step.number}
                  </span>
                  <h3 className="mt-7 text-section font-bold">{step.title}</h3>
                  <p className="mt-3 text-label leading-6 text-text-secondary">{step.description}</p>
                </li>
              ))}
            </ol>
          </PageContainer>
        </section>

        <section className="py-24 sm:py-32" id="features">
          <PageContainer>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-label font-bold text-brand-400">BUILT FOR ACTIVE LEARNING</p>
              <h2 className="mt-4 text-title font-bold tracking-tight sm:text-4xl">
                개발 지식에 맞춘 학습 도구
              </h2>
              <p className="mt-4 text-body leading-7 text-text-secondary">
                단순 문제 생성기가 아니라 입력, 검증, 풀이, 피드백, 기록이 이어지는 개발자 전용
                학습 플랫폼입니다.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {features.map((feature) => (
                <article
                  className="rounded-card border border-border-glass bg-linear-to-br from-surface-elevated/70 to-surface-panel/30 p-7 transition-all duration-300 hover:border-brand-400/30 hover:shadow-card"
                  key={feature.code}
                >
                  <span className="grid size-10 place-items-center rounded-control border border-brand-400/20 bg-brand-500/10 font-mono text-caption font-bold text-brand-400">
                    {feature.code}
                  </span>
                  <h3 className="mt-6 text-section font-bold">{feature.title}</h3>
                  <p className="mt-3 max-w-xl text-label leading-6 text-text-secondary">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </PageContainer>
        </section>

        <section className="pb-24 sm:pb-32">
          <PageContainer>
            <div className="relative overflow-hidden rounded-[2rem] border border-brand-400/25 bg-linear-to-br from-brand-500/18 via-surface-panel to-[#5B4BDB]/12 px-6 py-14 text-center shadow-[0_2rem_8rem_rgb(31_65_154/0.18)] sm:px-12 sm:py-20">
              <div className="absolute left-1/2 top-0 -z-10 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/20 blur-3xl" />
              <p className="text-label font-bold text-brand-400">READ · SOLVE · UNDERSTAND</p>
              <h2 className="mx-auto mt-5 max-w-3xl text-title font-bold tracking-tight sm:text-4xl">
                오늘 읽은 기술 글, 오늘 바로 내 실력으로 바꿔보세요.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-body leading-7 text-text-secondary">
                URL 하나만 준비하면 됩니다. 나머지 학습 흐름은 Readle이 연결합니다.
              </p>
              <button
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-control bg-white px-6 text-label font-bold text-text-inverse transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                onClick={openLogin}
                type="button"
              >
                지금 시작하기
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </PageContainer>
        </section>
      </main>

      <footer className="border-t border-border-glass py-8">
        <PageContainer className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <BrandLogo />
          <p className="text-caption text-text-muted">
            읽었다를 이해했다로 바꾸는 개발자 학습 플랫폼
          </p>
          <p className="text-caption text-text-muted">© 2026 Readle</p>
        </PageContainer>
      </footer>

      <LoginModal authError={authError} onClose={closeLogin} open={loginOpen} />
    </div>
  )
}
