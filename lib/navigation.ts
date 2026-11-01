import type { Role } from '@prisma/client'

export type NavIcon =
  | 'home'
  | 'calendar'
  | 'scissors'
  | 'users'
  | 'dashboard'
  | 'finance'
  | 'settings'
  | 'history'
  | 'user'
  | 'heart'

export interface NavItem {
  href: string
  label: string
  icon: NavIcon
  ownerOnly?: boolean
}

export const customerNavItems: readonly NavItem[] = [
  { href: '/', label: 'Início', icon: 'home' },
  { href: '/servicos', label: 'Agendar', icon: 'scissors' },
  { href: '/conta/historico', label: 'Histórico', icon: 'history' },
  { href: '/conta/perfil', label: 'Perfil', icon: 'user' },
]

const adminNavItems: readonly NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/agenda', label: 'Agenda', icon: 'calendar' },
  { href: '/admin/clientes', label: 'Clientes', icon: 'users' },
  { href: '/admin/catalogo', label: 'Serviços', icon: 'scissors', ownerOnly: true },
  { href: '/admin/financeiro', label: 'Financeiro', icon: 'finance', ownerOnly: true },
  { href: '/admin/configuracoes', label: 'Configurações', icon: 'settings', ownerOnly: true },
]

export function adminNavFor(role: Role): readonly NavItem[] {
  return adminNavItems.filter((item) => !item.ownerOnly || role === 'OWNER')
}
