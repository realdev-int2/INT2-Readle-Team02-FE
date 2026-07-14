import { useId, type InputHTMLAttributes } from 'react'
import { ErrorMessage } from '@/shared/ui/ErrorMessage'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  description?: string
  error?: string
  label: string
}

export function Input({
  'aria-describedby': ariaDescribedBy,
  className = '',
  description,
  error,
  id,
  label,
  required,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="grid content-start gap-2">
      <label className="text-label font-medium text-text-primary" htmlFor={inputId}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-status-error">
            *
          </span>
        )}
      </label>
      {description && (
        <p className="text-caption text-text-muted" id={descriptionId}>
          {description}
        </p>
      )}
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`min-h-control w-full rounded-control border bg-surface-canvas px-control-x py-control-y text-body text-text-primary outline-none transition-colors placeholder:text-text-muted hover:border-border-strong focus:border-brand-400 focus:shadow-focus disabled:cursor-not-allowed disabled:bg-surface-panel disabled:text-text-muted ${error ? 'border-status-error' : 'border-border-default'} ${className}`}
        id={inputId}
        required={required}
        {...props}
      />
      <ErrorMessage id={errorId}>{error}</ErrorMessage>
    </div>
  )
}
