import { Link } from 'react-router'
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
        <Link
          className="w-fit rounded-control font-mono text-lg font-bold tracking-tight text-brand-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
          to={ROUTES.home}
        >
          Readle
        </Link>
        {showNavigation && <PrimaryNavigation />}
      </PageContainer>
    </header>
  )
}
