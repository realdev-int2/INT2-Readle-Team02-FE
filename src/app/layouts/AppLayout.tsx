import { Outlet } from 'react-router'
import { PageContainer } from '@/shared/ui'
import { AppHeader } from '@/widgets/header/AppHeader'

interface AppLayoutProps {
  showNavigation?: boolean
}

export function AppLayout({ showNavigation = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-canvas text-text-primary">
      <a
        className="fixed left-4 top-4 z-60 -translate-y-24 rounded-control bg-brand-500 px-4 py-2 text-label font-semibold text-text-on-brand transition-transform focus:translate-y-0 focus:outline-none"
        href="#main-content"
      >
        본문으로 바로가기
      </a>
      <AppHeader showNavigation={showNavigation} />
      <main id="main-content">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
    </div>
  )
}
