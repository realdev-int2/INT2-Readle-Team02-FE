interface RoutePlaceholderPageProps {
  description: string
  eyebrow: string
  title: string
}

export function RoutePlaceholderPage({
  description,
  eyebrow,
  title,
}: RoutePlaceholderPageProps) {
  return (
    <section
      aria-labelledby="page-title"
      className="flex min-h-[calc(100vh-7.5rem)] items-center py-12 sm:min-h-[calc(100vh-3.5rem)] sm:py-16"
    >
      <div className="max-w-2xl">
        <p className="text-label font-semibold text-brand-400">{eyebrow}</p>
        <h1 className="mt-2 text-title font-bold tracking-tight" id="page-title">
          {title}
        </h1>
        <p className="mt-3 text-text-secondary">{description}</p>
      </div>
    </section>
  )
}
