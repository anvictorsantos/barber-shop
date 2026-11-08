import Image from 'next/image'

import {
  FACEBOOK_URL,
  FacebookIcon,
  INSTAGRAM_URL,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/brand/SocialIcons'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { initials } from '@/lib/format/name'

interface TeamMember {
  id: string
  displayName: string
  title: string
  avatarUrl: string | null
}

export function TeamSection({ barbers, whatsapp }: { barbers: TeamMember[]; whatsapp: string }) {
  const socials = [
    { href: INSTAGRAM_URL, label: 'Instagram', icon: InstagramIcon },
    { href: FACEBOOK_URL, label: 'Facebook', icon: FacebookIcon },
    { href: `https://wa.me/${whatsapp}`, label: 'WhatsApp', icon: WhatsAppIcon },
  ] as const

  return (
    <section className="border-b border-border py-20 lg:py-28">
      <div className="mx-auto w-full max-w-shell px-6 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4">
            <SectionLabel>Nossa equipe</SectionLabel>
            <h2 className="font-display text-[34px] font-semibold leading-[1.1] text-text lg:text-[44px]">
              Quem cuida do seu visual
            </h2>
          </div>
          <p className="max-w-[340px] text-body leading-relaxed text-muted">
            Conheça o time e escolha quem cuida do seu visual.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {barbers.map((barber) => (
            <article
              key={barber.id}
              className="group flex flex-col gap-4"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-surface-subtle">
                {barber.avatarUrl ? (
                  <Image
                    src={barber.avatarUrl}
                    alt={barber.displayName}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#2a2118_0%,#151311_70%)]">
                    <span className="font-display text-[64px] font-medium text-accent/80">
                      {initials(barber.displayName)}
                    </span>
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(0deg,rgba(12,11,10,0.92)_0%,rgba(12,11,10,0)_100%)]" />

                <div className="absolute inset-x-0 bottom-4 flex flex-col gap-0.5 px-4">
                  <h3 className="text-lead font-medium text-text">{barber.displayName}</h3>
                  <p className="text-caption text-text-secondary">{barber.title}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-muted">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={`${social.label} de ${barber.displayName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-text"
                  >
                    <social.icon
                      aria-hidden
                      className="h-4 w-4"
                    />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
