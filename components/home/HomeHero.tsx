import Image from 'next/image'
import Link from 'next/link'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80'

export function HomeHero({
  shopName,
  open,
  hoursLabel,
}: {
  shopName: string
  open: boolean
  hoursLabel: string
}) {
  return (
    <section className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.75)_0%,rgba(10,10,12,0.5)_50%,rgba(18,19,22,0.92)_100%)]" />

      <div className="relative flex w-full flex-col items-center gap-5 px-5 py-16 text-center lg:gap-6">
        <span className="flex items-center gap-2">
          <span className="relative flex h-[7px] w-[7px]">
            {open ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            ) : null}
            <span
              className={
                open
                  ? 'relative inline-flex h-[7px] w-[7px] rounded-full bg-success'
                  : 'relative inline-flex h-[7px] w-[7px] rounded-full bg-muted'
              }
            />
          </span>
          <span
            className={
              open
                ? 'text-label font-bold uppercase tracking-[1.4px] text-success'
                : 'text-label font-bold uppercase tracking-[1.4px] text-muted'
            }
          >
            {open ? 'Aberto agora' : 'Fechado'}
          </span>
        </span>

        <Image
          src="/brand/logo.png"
          alt={shopName}
          width={774}
          height={880}
          priority
          className="h-28 w-auto lg:h-36"
        />

        <h1 className="max-w-4xl text-[26px] font-extrabold uppercase leading-[1.2] text-white lg:text-[40px]">
          Estilo é um reflexo da sua atitude e da sua personalidade.
        </h1>

        <p className="text-sm leading-relaxed text-white/85 lg:text-[17px]">{hoursLabel}</p>

        <Link
          href="/servicos"
          className="mt-2 inline-flex h-[52px] items-center justify-center rounded-md bg-primary px-8 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          Agendar Horário
        </Link>
      </div>
    </section>
  )
}
