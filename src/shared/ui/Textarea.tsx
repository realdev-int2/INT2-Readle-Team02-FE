import { useId, type TextareaHTMLAttributes } from 'react'
import { ErrorMessage } from '@/shared/ui/ErrorMessage'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  description?: string
  error?: string
  label: string
}

export function Textarea({
  'aria-describedby': ariaDescribedBy,
  className = '',
  description,
  error,
  id,
  label,
  required,
  rows = 5,
  ...props
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const descriptionId = description ? `${textareaId}-description` : undefined
  const errorId = error ? `${textareaId}-error` : undefined
  const describedBy = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="grid content-start gap-2">
      <label className="text-label font-medium text-text-primary" htmlFor={textareaId}>
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
      <textarea
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`w-full resize-y rounded-control border bg-surface-canvas px-control-x py-control-y text-body text-text-primary outline-none transition-colors placeholder:text-text-muted hover:border-border-strong focus:border-brand-400 focus:shadow-focus disabled:cursor-not-allowed disabled:bg-surface-panel disabled:text-text-muted ${error ? 'border-status-error' : 'border-border-default'} ${className}`}
        id={textareaId}
        required={required}
        rows={rows}
        {...props}
      />
      <ErrorMessage id={errorId}>{error}</ErrorMessage>
    </div>
  )
}
