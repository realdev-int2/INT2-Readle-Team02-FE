import { useEffect, useRef } from 'react'
import readleSymbolUrl from '@/shared/assets/readle-symbol.png'
import readleWordmarkUrl from '@/shared/assets/readle-wordmark.png'
import { SocialLoginButton } from '@/pages/login/ui/SocialLoginButton'
import { ROUTES } from '@/shared/config/routes'

interface LoginModalProps {
  onClose: () => void
  open: boolean
}

function sanitizeReturnTo(value: string | null) {
  if (
    !value ||
    typeof window === 'undefined' ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return ROUTES.landing
  }

  try {
    const url = new URL(value, window.location.origin)

    if (url.origin !== window.location.origin || url.pathname === ROUTES.login) {
      return ROUTES.landing
    }

    return `${url.pathname}${url.search}`
  } catch {
    return ROUTES.landing
  }
}

export function LoginModal({ onClose, open }: LoginModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )

      if (!focusableElements?.length) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  const returnTo =
    typeof window === 'undefined'
      ? ROUTES.landing
      : sanitizeReturnTo(
          new URLSearchParams(window.location.search).get('returnTo') ??
            window.location.pathname + window.location.search,
        )

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-surface-canvas/80 px-4 py-8 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        aria-describedby="login-description"
        aria-labelledby="login-title"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-[1.5rem] border border-border-glass bg-surface-panel p-6 shadow-[0_2rem_8rem_rgb(0_0_0/0.55)] sm:p-8"
        ref={dialogRef}
        role="dialog"
      >
        <button
          aria-label="로그인 창 닫기"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-xl text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="mb-7 text-center">
          <div aria-hidden="true" className="flex items-center justify-center gap-2.5">
            <img alt="" className="size-11 rounded-md" src={readleSymbolUrl} />
            <img alt="" className="h-9 w-auto" src={readleWordmarkUrl} />
          </div>
          <h2 className="mt-6 text-heading font-bold tracking-tight" id="login-title">
            다시 만나 반갑습니다
          </h2>
          <p className="mt-2 text-label text-text-secondary" id="login-description">
            소셜 계정으로 간편하게 학습을 시작하세요.
          </p>
        </div>

        <div className="grid gap-3">
          <SocialLoginButton
            href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}
            provider="google"
          />
          <SocialLoginButton
            href={`/api/auth/kakao/start?returnTo=${encodeURIComponent(returnTo)}`}
            provider="kakao"
          />
        </div>

        <p className="mt-2 text-center text-[0.6875rem] leading-relaxed text-text-muted">
          계속하면 Readle의 이용약관 및 개인정보 처리방침에 동의한 것으로 간주합니다.
        </p>
      </section>
    </div>
  )
}
