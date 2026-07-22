interface PageHeadingProps {
  description: string
  eyebrow: string
  id: string
  title: string
}

export function PageHeading({ description, eyebrow, id, title }: PageHeadingProps) {
  return (
    <header>
      <p className="font-mono text-[0.625rem] font-bold tracking-[0.16em] text-brand-400">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-title font-bold text-text-primary sm:text-[2.25rem]" id={id}>
        {title}
      </h1>
      <p className="mt-2 text-label text-text-muted">{description}</p>
    </header>
  )
}
