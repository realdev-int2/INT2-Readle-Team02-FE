import { Link } from 'react-router'
import { ROUTES } from '@/shared/config/routes'

export function NotFoundPage() {
  return (
    <section className="grid min-h-[calc(100vh-7.5rem)] place-items-center py-12 text-text-primary sm:min-h-[calc(100vh-3.5rem)]">
      <div className="text-center">
        <p className="text-label font-medium text-text-muted">404</p>
        <h1 className="mt-2 text-heading font-semibold text-text-primary">
          페이지를 찾을 수 없습니다.
        </h1>
        <Link
          className="mt-6 inline-block rounded-control text-brand-400 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
          to={ROUTES.home}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </section>
  )
}
