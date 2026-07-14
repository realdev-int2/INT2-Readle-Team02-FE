import type { ComponentPropsWithoutRef } from 'react'

type ErrorMessageProps = ComponentPropsWithoutRef<'p'>

export function ErrorMessage({ children, className = '', ...props }: ErrorMessageProps) {
  if (!children) {
    return null
  }

  return (
    <p
      className={`flex items-start gap-2 text-caption text-status-error ${className}`}
      role="alert"
      {...props}
    >
      <span aria-hidden="true" className="font-bold">
        !
      </span>
      <span>{children}</span>
    </p>
  )
}
