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
    const created = await prisma.favoriteService.createMany({
      data: [{ userId, serviceId: id }],
      skipDuplicates: true,
    })
    if (created.count === 1) return true
    await prisma.favoriteService.deleteMany({ where: { userId, serviceId: id } })
    return false
  }

  if (kind === 'barber') {
    const created = await prisma.favoriteBarber.createMany({
      data: [{ userId, barberId: id }],
      skipDuplicates: true,
    })
    if (created.count === 1) return true
    await prisma.favoriteBarber.deleteMany({ where: { userId, barberId: id } })
    return false
  }

  const created = await prisma.favoriteProduct.createMany({
    data: [{ userId, productId: id }],
    skipDuplicates: true,
  })
  if (created.count === 1) return true
  await prisma.favoriteProduct.deleteMany({ where: { userId, productId: id } })
  return false
}
