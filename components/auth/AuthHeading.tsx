export function AuthHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-[28px] font-semibold leading-[1.15] text-text sm:text-[32px]">
        {title}
      </h2>
      {description ? <p className="text-body leading-relaxed text-muted">{description}</p> : null}
    </div>
  )
}
