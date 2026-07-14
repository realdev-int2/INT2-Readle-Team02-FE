import { NavLink } from 'react-router'
import { ROUTES } from '@/shared/config/routes'

const navigationItems = [
  { label: '홈', to: ROUTES.home },
  { label: '학습 현황', to: ROUTES.dashboard },
  { label: '히스토리', to: ROUTES.history },
] as const

export function PrimaryNavigation() {
  return (
    <nav aria-label="주요 메뉴">
      <ul className="flex items-center gap-1 overflow-x-auto">
        {navigationItems.map(({ label, to }) => (
          <li key={to}>
            <NavLink
              className={({ isActive }) =>
                `block whitespace-nowrap rounded-control px-3 py-2 text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
                  isActive
                    ? 'bg-surface-elevated font-semibold text-text-primary'
                    : 'text-text-muted hover:bg-surface-panel hover:text-text-secondary'
                }`
              }
              end={to === ROUTES.home}
              to={to}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
