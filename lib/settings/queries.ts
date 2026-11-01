import { prisma } from '@/lib/db/prisma'
import type {
  AdminBarber,
  AdminShopHours,
  AdminTimeBlock,
  ShopSettings,
} from '@/lib/settings/types'

export async function getShopSettings(): Promise<ShopSettings | null> {
  return prisma.shop.findFirst({
    select: {
      id: true,
      name: true,
      cnpj: true,
      addressLine: true,
      city: true,
      state: true,
      postalCode: true,
      phone: true,
      whatsapp: true,
      email: true,
    },
  })
}

export async function getAdminShopHours(): Promise<AdminShopHours[]> {
  return prisma.shopHours.findMany({
    orderBy: { weekday: 'asc' },
    select: {
      id: true,
      weekday: true,
      openMinute: true,
      closeMinute: true,
      closed: true,
    },
  })
}

export async function getAdminBarbers(): Promise<AdminBarber[]> {
  return prisma.barberProfile.findMany({
    orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }],
    select: {
      id: true,
      displayName: true,
      title: true,
      avatarUrl: true,
      active: true,
      sortOrder: true,
      user: {
        select: { name: true, email: true, phone: true },
      },
    },
  })
}

export async function getAdminTimeBlocks(): Promise<AdminTimeBlock[]> {
  const blocks = await prisma.timeBlock.findMany({
    orderBy: [
      { active: 'desc' },
      { recurring: 'desc' },
      { weekday: 'asc' },
      { startMinute: 'asc' },
    ],
    select: {
      id: true,
      barberId: true,
      label: true,
      recurring: true,
      weekday: true,
      date: true,
      startMinute: true,
      endMinute: true,
      active: true,
      barber: { select: { displayName: true } },
    },
  })

  return blocks.map((block) => ({
    ...block,
    date: block.date ? block.date.toISOString().slice(0, 10) : null,
  }))
}
