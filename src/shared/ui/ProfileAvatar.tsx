interface ProfileAvatarProps {
  label: string
  nickname: string
  imageUrl: string | null
}

export function ProfileAvatar({ label, nickname, imageUrl }: ProfileAvatarProps) {
  const initial = nickname.trim().charAt(0)
  const trimmedImageUrl = imageUrl?.trim()

  return (
    <div aria-label={label} className="grid min-h-9 place-items-center rounded-control px-1" role="img">
      <span
        aria-hidden="true"
        className="relative grid size-8 place-items-center overflow-hidden rounded-full border border-brand-400/30 bg-brand-500/15 text-caption font-bold text-brand-400"
      >
        {initial || (
          <svg className="size-4.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z" />
          </svg>
        )}
        {trimmedImageUrl && (
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
            key={trimmedImageUrl}
            onError={(event) => {
              event.currentTarget.hidden = true
            }}
            src={trimmedImageUrl}
          />
        )}
      </span>
    </div>
  )
}
