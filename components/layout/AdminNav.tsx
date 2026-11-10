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

import { adminNavFor, type NavIcon } from '@/lib/navigation'
import { cn } from '@/lib/utils'

import type { Role } from '@prisma/client'

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
  return href === '/admin'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname()
  const items = adminNavFor(role)

  return (
    <nav
      className="flex flex-col gap-2"
      aria-label="Navegação administrativa"
    >
      {items.map((item) => {
        const Icon = icons[item.icon]
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-body font-semibold transition',
              active ? 'bg-primary text-accent-ink' : 'text-muted hover:bg-white/5 hover:text-text',
            )}
          >
            <Icon
              className="h-[18px] w-[18px]"
              aria-hidden
            />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
