import { useEffect, useRef } from 'react'
import { Button } from '@/shared/ui'

export interface QuizSubmitConfirmProps {
  onCancel: () => void
  onConfirm: () => void
}

export function QuizSubmitConfirm({ onCancel, onConfirm }: QuizSubmitConfirmProps) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement
    const focusableElements = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const firstFocusable = focusableElements?.[0]
    const lastFocusable = focusableElements?.[focusableElements.length - 1]

    firstFocusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
        return
      }

      if (event.key !== 'Tab' || !dialog || !firstFocusable || !lastFocusable) {
        return
      }

      if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? lastFocusable : firstFocusable).focus()
      } else if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus()
      }
    }
  }, [onCancel])

  return (
    <div className="quiz-dialog-backdrop" role="presentation">
      <section
        aria-describedby="quiz-submit-description"
        aria-labelledby="quiz-submit-title"
        aria-modal="true"
        className="quiz-submit-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <span aria-hidden="true" className="quiz-submit-dialog-icon">
          ✓
        </span>
        <h2 className="mt-4 text-heading font-bold text-text-primary" id="quiz-submit-title">
          답안을 제출하시겠습니까?
        </h2>
        <p className="mt-2 text-label leading-6 text-text-muted" id="quiz-submit-description">
          제출 후에는 답안을 수정할 수 없으며 바로 채점이 시작됩니다.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button onClick={onCancel} variant="secondary">
            계속 풀기
          </Button>
          <Button onClick={onConfirm}>제출하기</Button>
        </div>
      </section>
    </div>
  )
}
