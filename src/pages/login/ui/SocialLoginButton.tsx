type SocialLoginProvider = 'google' | 'kakao'

interface SocialLoginButtonProps {
  onSelect: (provider: SocialLoginProvider) => void
  provider: SocialLoginProvider
}

const providerLabel: Record<SocialLoginProvider, string> = {
  google: 'Google로 시작하기',
  kakao: '카카오로 시작하기',
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-4.5 shrink-0" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09A6.5 6.5 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4.5 shrink-0"
      fill="#191919"
      viewBox="0 0 24 24"
    >
      <path d="M12 3c-4.97 0-9 3.36-9 7.5 0 2.64 1.68 4.95 4.2 6.27l-.9 3.33c-.09.27.18.51.42.36l4.14-2.73c.37.03.75.06 1.14.06 4.97 0 9-3.36 9-7.5S16.97 3 12 3Z" />
    </svg>
  )
}

export function SocialLoginButton({ onSelect, provider }: SocialLoginButtonProps) {
  const isKakao = provider === 'kakao'

  return (
    <button
      className={`flex min-h-control w-full items-center justify-center gap-3 rounded-control border px-control-x py-control-y text-label font-semibold transition-all duration-150 active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
        isKakao
          ? 'border-transparent bg-[#FEE500] text-[#191919] hover:bg-[#F5DC00]'
          : 'border-border-default bg-surface-canvas text-text-primary hover:border-brand-400/40 hover:bg-surface-elevated'
      }`}
      onClick={() => onSelect(provider)}
      type="button"
    >
      {isKakao ? <KakaoIcon /> : <GoogleIcon />}
      {providerLabel[provider]}
    </button>
  )
}

export type { SocialLoginProvider }
