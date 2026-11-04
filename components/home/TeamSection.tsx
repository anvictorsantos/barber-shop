import Image from 'next/image'

import {
  FACEBOOK_URL,
  FacebookIcon,
  INSTAGRAM_URL,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/brand/SocialIcons'

interface TeamMember {
  id: string
  displayName: string
  title: string
  avatarUrl: string | null
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function TeamSection({ barbers, whatsapp }: { barbers: TeamMember[]; whatsapp: string }) {
  const socials = [
    { href: INSTAGRAM_URL, label: 'Instagram', icon: InstagramIcon },
    { href: FACEBOOK_URL, label: 'Facebook', icon: FacebookIcon },
    { href: `https://wa.me/${whatsapp}`, label: 'WhatsApp', icon: WhatsAppIcon },
  ] as const

  return (
    <section className="overflow-hidden bg-[#0d0e12] py-16 lg:py-20">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-5 lg:gap-10 lg:px-10">
        <span className="hidden shrink-0 text-[42px] font-black uppercase tracking-[0.35em] text-white/20 [writing-mode:vertical-rl] lg:block">
          Nossa equipe
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white/40 lg:hidden">
            Nossa equipe
          </h2>

          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {barbers.map((barber) => (
              <article
                key={barber.id}
                className="w-[260px] shrink-0 snap-start lg:w-[300px]"
              >
                <div className="relative h-[340px] overflow-hidden rounded-md bg-surface">
                  {barber.avatarUrl ? (
                    <Image
                      src={barber.avatarUrl}
                      alt={barber.displayName}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#2a2118_0%,#14151a_70%)]">
                      <span className="font-display text-[64px] font-black text-accent/80">
                        {initials(barber.displayName)}
                      </span>
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(180deg,rgba(10,10,12,0)_0%,rgba(10,10,12,0.9)_100%)]" />
                  <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-3 text-center">
                    <span className="text-sm font-bold text-accent">{barber.displayName}</span>
                    <span className="text-caption text-white/60">{barber.title}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-7 text-white/80">
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={`${social.label} de ${barber.displayName}`}
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-accent"
                    >
                      <social.icon
                        aria-hidden
                        className="h-[18px] w-[18px]"
                      />
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
