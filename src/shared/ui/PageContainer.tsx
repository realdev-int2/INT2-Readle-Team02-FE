import type { ComponentPropsWithoutRef } from 'react'

type PageContainerProps = ComponentPropsWithoutRef<'div'>

export function PageContainer({ className = '', ...props }: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-content px-page-mobile md:px-page-desktop ${className}`}
      {...props}
    />
  )
}
