import { Link } from 'react-router'
import { ROUTES } from '@/shared/config/routes'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold">페이지를 찾을 수 없습니다.</h1>
        <Link className="mt-6 inline-block text-blue-600 underline" to={ROUTES.home}>
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  )
}
