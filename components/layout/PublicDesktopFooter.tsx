import { Camera, MessageCircle, ThumbsUp } from 'lucide-react'

const INSTAGRAM_URL = 'https://www.instagram.com/barbeariadoluiz'
const FACEBOOK_URL = 'https://www.facebook.com/barbeariadoluiz'

export function PublicDesktopFooter({
  shopName,
  whatsapp,
}: {
  shopName: string
  whatsapp: string
}) {
  const socials = [
    { href: INSTAGRAM_URL, label: 'Instagram', icon: Camera },
    { href: FACEBOOK_URL, label: 'Facebook', icon: ThumbsUp },
    { href: `https://wa.me/${whatsapp}`, label: 'WhatsApp', icon: MessageCircle },
  ] as const

  return (
    <footer className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-white/10 px-5 py-6 text-center text-caption text-muted lg:min-h-[88px] lg:flex-row lg:px-20 lg:text-left">
      <p>
        © {new Date().getFullYear()} {shopName} · Corte, Barba e Resenha de Alto Padrão
      </p>

      <nav
        aria-label="Redes sociais"
        className="flex items-center gap-6"
      >
        <span>Fale com a gente</span>
        {socials.map((social) => (
          <a
            key={social.label}
            href={social.href}
            aria-label={social.label}
            target="_blank"
            rel="noreferrer"
            className="text-accent transition hover:text-accent-hover"
          >
            <social.icon
              aria-hidden
              className="h-[18px] w-[18px]"
            />
          </a>
        ))}
      </nav>
    </footer>
  )
}
