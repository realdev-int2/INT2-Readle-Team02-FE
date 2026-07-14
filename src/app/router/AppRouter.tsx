import { Route, Routes } from 'react-router'
import { DesignSystemPage } from '@/pages/design-system/DesignSystemPage'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { ROUTES } from '@/shared/config/routes'

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomePage />} />
      {import.meta.env.DEV && (
        <Route path={ROUTES.designSystem} element={<DesignSystemPage />} />
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
