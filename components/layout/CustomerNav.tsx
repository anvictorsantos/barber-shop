'use client'

import {
  CalendarDays,
  DollarSign,
  Heart,
  History,
  Home,
  LayoutDashboard,
  Scissors,
  Settings,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { customerNavItems, type NavIcon } from '@/lib/navigation'
import { cn } from '@/lib/utils'

const icons: Record<NavIcon, LucideIcon> = {
  home: Home,
  calendar: CalendarDays,
  scissors: Scissors,
  users: Users,
  dashboard: LayoutDashboard,
  finance: DollarSign,
  settings: Settings,
  history: History,
  user: User,
  heart: Heart,
}

const DESKTOP_TABS = [
  { href: '/conta/agendamentos', label: 'Meus Agendamentos' },
  { href: '/conta/historico', label: 'Histórico' },
  { href: '/conta/perfil', label: 'Perfil' },
  { href: '/conta/favoritos', label: 'Favoritos' },
] as const

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function CustomerNav({ variant }: { variant: 'horizontal' | 'bottom' }) {
  const pathname = usePathname()

  if (variant === 'horizontal') {
    return (
      <nav
        className="hidden items-center gap-6 lg:flex"
        aria-label="Navegação da conta"
      >
        {DESKTOP_TABS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-xs border px-4 py-2.5 text-sm font-bold leading-[17px] transition',
                active
                  ? 'border-primary bg-white/[0.04] text-primary'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-shell/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Navegação da conta"
    >
      <ul className="grid grid-cols-4">
        {customerNavItems.map((item) => {
          const Icon = icons[item.icon]
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-touch flex-col items-center justify-center gap-1 py-2 text-micro font-semibold transition',
                  active ? 'text-accent' : 'text-muted',
                )}
              >
                <Icon
                  className="h-5 w-5"
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
