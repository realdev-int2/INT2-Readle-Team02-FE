import type { ComponentPropsWithoutRef } from 'react'

type LoadingSize = 'sm' | 'md' | 'lg'

interface LoadingProps extends ComponentPropsWithoutRef<'span'> {
  label?: string
  size?: LoadingSize
}

const spinnerSizeClass: Record<LoadingSize, string> = {
  sm: 'size-4 border-2',
  md: 'size-5 border-2',
  lg: 'size-7 border-3',
}

export function Loading({
  className = '',
  label = '불러오는 중',
  size = 'md',
  ...props
}: LoadingProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-label text-text-secondary ${className}`}
      role="status"
      {...props}
    >
      <span
        aria-hidden="true"
        className={`animate-spin rounded-full border-brand-400 border-r-transparent ${spinnerSizeClass[size]}`}
      />
      <span>{label}</span>
    </span>
  )
}
