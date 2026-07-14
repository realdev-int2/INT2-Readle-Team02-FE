import { Link } from 'react-router'
import readleSymbolUrl from '@/shared/assets/readle-symbol.png'
import readleWordmarkUrl from '@/shared/assets/readle-wordmark.png'
import { ROUTES } from '@/shared/config/routes'
import { PageContainer } from '@/shared/ui'
import { PrimaryNavigation } from '@/widgets/navigation/PrimaryNavigation'

interface AppHeaderProps {
  showNavigation?: boolean
}

export function AppHeader({ showNavigation = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-surface-canvas/95 backdrop-blur-md">
      <PageContainer className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 py-2 sm:grid-cols-[auto_1fr_auto] sm:gap-x-6 sm:py-0">
        <Link
          className="flex w-fit items-center gap-2 rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
          to={ROUTES.home}
        >
          <img
            alt=""
            aria-hidden="true"
            className="size-8 rounded-sm"
            height="172"
            src={readleSymbolUrl}
            width="172"
          />
          <img
            alt="Readle"
            className="h-6.5 w-auto sm:h-7"
            height="108"
            src={readleWordmarkUrl}
            width="420"
          />
        </Link>
        {showNavigation && (
          <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
            <PrimaryNavigation />
          </div>
        )}
        {showNavigation && (
          <div className="flex items-center gap-2">
            <Link
              aria-label="새 퀴즈 만들기"
              className="flex min-h-9 items-center gap-1.5 rounded-control bg-brand-500 px-3 text-label font-semibold text-text-on-brand shadow-button transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              to={ROUTES.home}
            >
              <span aria-hidden="true" className="text-section leading-none">
                +
              </span>
              <span className="hidden md:inline">새 퀴즈</span>
            </Link>
            <div
              aria-label="전성 프로필"
              className="grid min-h-9 place-items-center rounded-control px-1"
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full border border-brand-400/30 bg-brand-500/15 text-caption font-bold text-brand-400"
              >
                <svg className="size-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z" />
                </svg>
              </span>
            </div>
          </div>
        )}
      </PageContainer>
    </header>
  )
}
