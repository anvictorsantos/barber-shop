import Image from 'next/image'

import {
  FACEBOOK_URL,
  FacebookIcon,
  INSTAGRAM_URL,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/brand/SocialIcons'
import { SectionLabel } from '@/components/ui/SectionLabel'

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
    <section className="py-20 lg:py-28">
      <div className="mx-auto w-full max-w-shell px-6 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4">
            <SectionLabel>Nossa equipe</SectionLabel>
            <h2 className="font-display text-[34px] font-semibold leading-[1.1] text-text lg:text-[44px]">
              Quem cuida do seu corte
            </h2>
          </div>
          <p className="max-w-[340px] text-body leading-relaxed text-muted">
            Conheça os profissionais da casa e escolha quem atende você.
          </p>
        </div>

        <div className="mt-10 border-t border-border lg:mt-12">
          {barbers.map((barber, index) => (
            <div
              key={barber.id}
              className="flex items-center gap-3 border-b border-border py-5 sm:gap-5"
            >
              <span className="w-5 shrink-0 text-caption tabular-nums text-subtle">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-subtle">
                {barber.avatarUrl ? (
                  <Image
                    src={barber.avatarUrl}
                    alt={barber.displayName}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <span className="font-display text-lead font-medium text-accent/90">
                    {initials(barber.displayName)}
                  </span>
                )}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h3 className="truncate text-body font-medium text-text">{barber.displayName}</h3>
                <p className="truncate text-caption text-muted">{barber.title}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-muted">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
