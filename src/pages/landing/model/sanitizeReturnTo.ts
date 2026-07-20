import { ROUTES } from '@/shared/config/routes'

export function sanitizeReturnTo(value: string | null) {
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
