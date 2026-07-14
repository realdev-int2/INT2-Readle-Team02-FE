import type { ButtonHTMLAttributes } from 'react'
import { Loading } from '@/shared/ui/Loading'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean
  loading?: boolean
  loadingLabel?: string
  variant?: ButtonVariant
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'border-brand-400/70 bg-linear-to-br from-brand-400 via-brand-500 to-brand-600 text-text-on-brand shadow-button hover:border-brand-400 hover:shadow-button-hover',
  secondary:
    'border-border-default bg-surface-panel text-text-primary hover:border-brand-400 hover:bg-surface-elevated',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:bg-surface-panel hover:text-text-primary',
  danger:
    'border-status-error bg-status-error-subtle text-status-error hover:bg-status-error hover:text-text-on-brand',
}

export function Button({
  'aria-label': ariaLabel,
  children,
  className = '',
  disabled,
  fullWidth = false,
  loading = false,
  loadingLabel = '처리 중',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading || undefined}
      aria-label={loading ? loadingLabel : ariaLabel}
      className={`inline-flex min-h-control items-center justify-center gap-2 rounded-control border px-control-x py-control-y text-label font-semibold transition-all duration-150 active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variantClass[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <Loading className="text-inherit" label={loadingLabel} size="sm" /> : children}
    </button>
  )
}
