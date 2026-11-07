export function AuthHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="font-display text-[30px] font-bold leading-[1.2] text-text sm:text-[38px]">
        {title}
      </h2>
      {description ? <p className="text-sm leading-[1.5] text-muted">{description}</p> : null}
    </div>
  )
}
