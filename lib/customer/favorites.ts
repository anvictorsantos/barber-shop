import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'

export type FavoriteKind = 'service' | 'barber' | 'product'

async function ensureTarget(kind: FavoriteKind, id: string): Promise<void> {
  if (kind === 'service') {
    const service = await prisma.service.findFirst({
      where: { id, active: true },
      select: { id: true },
    })
    if (!service) throw new AppError(404, 'not_found', 'Serviço não encontrado.')
    return
  }

  if (kind === 'barber') {
    const barber = await prisma.barberProfile.findFirst({
      where: { id, active: true },
      select: { id: true },
    })
    if (!barber) throw new AppError(404, 'not_found', 'Profissional não encontrado.')
    return
  }

  const product = await prisma.product.findFirst({
    where: { id, active: true },
    select: { id: true },
  })
  if (!product) throw new AppError(404, 'not_found', 'Produto não encontrado.')
}

export async function toggleFavorite(
  userId: string,
  kind: FavoriteKind,
  id: string,
): Promise<boolean> {
  await ensureTarget(kind, id)

  if (kind === 'service') {
    const existing = await prisma.favoriteService.findUnique({
      where: { userId_serviceId: { userId, serviceId: id } },
    })
    if (existing) {
      await prisma.favoriteService.delete({
        where: { userId_serviceId: { userId, serviceId: id } },
      })
      return false
    }
    await prisma.favoriteService.create({ data: { userId, serviceId: id } })
    return true
  }

  if (kind === 'barber') {
    const existing = await prisma.favoriteBarber.findUnique({
      where: { userId_barberId: { userId, barberId: id } },
    })
    if (existing) {
      await prisma.favoriteBarber.delete({ where: { userId_barberId: { userId, barberId: id } } })
      return false
    }
    await prisma.favoriteBarber.create({ data: { userId, barberId: id } })
    return true
  }

  const existing = await prisma.favoriteProduct.findUnique({
    where: { userId_productId: { userId, productId: id } },
  })
  if (existing) {
    await prisma.favoriteProduct.delete({ where: { userId_productId: { userId, productId: id } } })
    return false
  }
  await prisma.favoriteProduct.create({ data: { userId, productId: id } })
  return true
}
