import { Link } from 'react-router'
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
      <PageContainer className="flex min-h-14 flex-col justify-center gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex items-center justify-between gap-6">
          <Link
            className="w-fit rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
            to={ROUTES.home}
          >
            <img
              alt="Readle"
              className="h-7 w-auto sm:h-8"
              height="108"
              src={readleWordmarkUrl}
              width="420"
            />
          </Link>
          {showNavigation && <PrimaryNavigation />}
        </div>
        {showNavigation && (
          <div
            aria-label="사용자 프로필"
            className="flex items-center gap-2 self-end rounded-control px-3 py-2 text-label text-text-muted sm:self-auto"
          >
            <svg
              aria-hidden="true"
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <span>프로필</span>
          </div>
        )}
      </PageContainer>
    </header>
  )
}
