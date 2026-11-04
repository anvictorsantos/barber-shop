import Image from 'next/image'
import Link from 'next/link'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80'

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-10 w-10 border-accent/80 lg:h-14 lg:w-14 ${className}`}
    />
  )
}

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
        className="scale-110 object-cover blur-[6px] brightness-[0.45]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,12,0.55)_0%,rgba(10,10,12,0.88)_100%)]" />

      <div className="relative flex w-full flex-col items-center px-5 py-20 text-center">
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

        <div className="relative mt-10 flex w-full max-w-[560px] items-center justify-center px-10 py-10 lg:mt-12 lg:px-16 lg:py-14">
          <Corner className="left-0 top-0 border-l-2 border-t-2" />
          <Corner className="right-0 top-0 border-r-2 border-t-2" />
          <Corner className="bottom-0 left-0 border-b-2 border-l-2" />
          <Corner className="bottom-0 right-0 border-b-2 border-r-2" />

          <Image
            src="/brand/logo.png"
            alt={shopName}
            width={774}
            height={880}
            priority
            className="h-44 w-auto lg:h-64"
          />
        </div>

        <h1 className="mt-8 text-[22px] font-extrabold uppercase leading-[1.25] text-white lg:text-[34px]">
          Estilo é um reflexo da sua atitude e da sua personalidade.
        </h1>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px w-10 bg-accent/60" />
          <p className="text-sm leading-relaxed text-white/85 lg:text-[15px]">
            Horário de funcionamento
          </p>
          <span className="h-px w-10 bg-accent/60" />
        </div>
        <p className="mt-1 text-label font-semibold uppercase tracking-[2px] text-accent">
          {hoursLabel.replace('Horário de funcionamento das ', '')}
        </p>

        <Link
          href="/servicos"
          className="mt-8 inline-flex h-[52px] items-center justify-center rounded-md bg-primary px-8 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          Agendar Horário
        </Link>
      </div>
    </section>
  )
}
