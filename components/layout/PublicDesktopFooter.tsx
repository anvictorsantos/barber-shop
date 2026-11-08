import { MapPin } from 'lucide-react'

import {
  FACEBOOK_URL,
  FacebookIcon,
  INSTAGRAM_URL,
  InstagramIcon,
  WhatsAppIcon,
} from '@/components/brand/SocialIcons'

export function PublicDesktopFooter({
  shopName,
  whatsapp,
  address = 'Rua dos Geólogos, 698, Belo Horizonte, MG, Brazil',
}: {
  shopName: string
  whatsapp: string
  address?: string
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  const socials = [
    { href: INSTAGRAM_URL, label: 'Instagram', icon: InstagramIcon },
    { href: mapsUrl, label: 'Localização', icon: MapPin },
    { href: FACEBOOK_URL, label: 'Facebook', icon: FacebookIcon },
    { href: `https://wa.me/${whatsapp}`, label: 'WhatsApp', icon: WhatsAppIcon },
  ] as const

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-shell flex-col items-center justify-between gap-4 px-6 py-6 text-center text-caption text-muted lg:min-h-[88px] lg:flex-row lg:px-10 lg:text-left">
        <nav
          aria-label="Redes sociais e contato"
          className="flex items-center gap-6"
        >
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              target="_blank"
              rel="noreferrer"
              className="text-muted transition-colors hover:text-text"
            >
              <social.icon
                aria-hidden
                className="h-4 w-4"
              />
            </a>
          ))}
        </nav>

        <p>
          © {new Date().getFullYear()} {shopName} · Corte, barba e resenha em Belo Horizonte
        </p>
      </div>
    </footer>
  )
}
