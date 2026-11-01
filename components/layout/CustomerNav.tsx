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

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function CustomerNav({ variant }: { variant: 'horizontal' | 'bottom' }) {
  const pathname = usePathname()

  if (variant === 'horizontal') {
    return (
      <nav
        className="hidden items-center gap-1 lg:flex"
        aria-label="Navegação da conta"
      >
        {customerNavItems.map((item) => {
          const Icon = icons[item.icon]
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-caption font-semibold transition',
                active ? 'bg-white/5 text-accent' : 'text-muted hover:text-text',
              )}
            >
              <Icon
                className="h-4 w-4"
                aria-hidden
              />
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
