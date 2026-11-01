import { normalizeEmail, normalizePhone } from '@/lib/auth/identity'
import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'
import { parseTimeToMinutes } from '@/lib/time/schedule'
import type {
  CreateBarberInput,
  DeleteTimeBlockInput,
  HoursInput,
  ShopInput,
  TimeBlockInput,
  ToggleBarberInput,
  UpdateBarberInput,
} from '@/lib/validation/settings'

function requiredMinutes(value: string, label: string): number {
  const minutes = parseTimeToMinutes(value)
  if (minutes === null) throw new AppError(400, 'invalid_time', `Horário inválido em ${label}.`)
  return minutes
}

export async function updateShop(input: ShopInput) {
  const data = {
    name: input.name,
    cnpj: input.cnpj || null,
    addressLine: input.addressLine,
    city: input.city,
    state: input.state.toUpperCase(),
    postalCode: input.postalCode || null,
    phone: input.phone || null,
    whatsapp: input.whatsapp,
    email: input.email || null,
  }

  const existing = await prisma.shop.findFirst({ select: { id: true } })
  if (existing) {
    return prisma.shop.update({ where: { id: existing.id }, data })
  }

  return prisma.shop.create({ data })
}

export async function updateHours(input: HoursInput) {
  const rows = input.hours.map((row) => {
    const openMinute = requiredMinutes(row.open, 'abertura')
    const closeMinute = requiredMinutes(row.close, 'fechamento')

    if (!row.closed && closeMinute <= openMinute) {
      throw new AppError(400, 'invalid_hours', 'O fechamento precisa ser depois da abertura.')
    }

    return {
      weekday: row.weekday,
      openMinute,
      closeMinute,
      closed: row.closed,
    }
  })

  return prisma.$transaction(
    rows.map((row) =>
      prisma.shopHours.upsert({
        where: { weekday: row.weekday },
        update: {
          openMinute: row.openMinute,
          closeMinute: row.closeMinute,
          closed: row.closed,
        },
        create: row,
      }),
    ),
  )
}

export async function createBarber(input: CreateBarberInput) {
  const email = input.email ? normalizeEmail(input.email) : null
  if (input.email && !email) {
    throw new AppError(400, 'invalid_email', 'E-mail inválido.')
  }

  const phone = input.phone ? normalizePhone(input.phone) : null
  if (input.phone && !phone) {
    throw new AppError(400, 'invalid_phone', 'Telefone inválido.')
  }

  if (!email && !phone) {
    throw new AppError(400, 'missing_contact', 'Informe e-mail ou telefone.')
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    },
  })
  if (existing) {
    throw new AppError(409, 'identifier_taken', 'Este contato já está cadastrado.')
  }

  const passwordHash = await hashPassword(input.password)
  const verifiedAt = new Date()
  const count = await prisma.barberProfile.count()

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email,
        phone,
        passwordHash,
        role: 'BARBER',
        emailVerifiedAt: email ? verifiedAt : null,
        phoneVerifiedAt: phone ? verifiedAt : null,
      },
    })

    return tx.barberProfile.create({
      data: {
        userId: user.id,
        displayName: input.displayName,
        title: input.title,
        avatarUrl: input.avatarUrl || null,
        active: true,
        sortOrder: count,
      },
    })
  })
}

export async function updateBarber(input: UpdateBarberInput) {
  const existing = await prisma.barberProfile.findUnique({ where: { id: input.id } })
  if (!existing) throw new AppError(404, 'not_found', 'Barbeiro não encontrado.')

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.userId },
      data: { name: input.name },
    })

    return tx.barberProfile.update({
      where: { id: input.id },
      data: {
        displayName: input.displayName,
        title: input.title,
        avatarUrl: input.avatarUrl || null,
        active: input.active,
      },
    })
  })
}

export async function toggleBarber(input: ToggleBarberInput) {
  const existing = await prisma.barberProfile.findUnique({ where: { id: input.id } })
  if (!existing) throw new AppError(404, 'not_found', 'Barbeiro não encontrado.')

  return prisma.barberProfile.update({
    where: { id: input.id },
    data: { active: input.active },
  })
}

export async function createTimeBlock(input: TimeBlockInput) {
  const barber = await prisma.barberProfile.findUnique({ where: { id: input.barberId } })
  if (!barber) throw new AppError(404, 'not_found', 'Barbeiro não encontrado.')

  const startMinute = requiredMinutes(input.start, 'início')
  const endMinute = requiredMinutes(input.end, 'fim')
  if (endMinute <= startMinute) {
    throw new AppError(400, 'invalid_time', 'O fim deve ser depois do início.')
  }

  const date = input.recurring ? null : input.date ? new Date(`${input.date}T00:00:00.000Z`) : null
  if (!input.recurring && (!date || Number.isNaN(date.getTime()))) {
    throw new AppError(400, 'invalid_date', 'Data inválida.')
  }

  return prisma.timeBlock.create({
    data: {
      barberId: input.barberId,
      label: input.label,
      recurring: input.recurring,
      weekday: input.recurring ? (input.weekday ?? null) : null,
      date,
      startMinute,
      endMinute,
      active: true,
    },
  })
}

export async function deleteTimeBlock(input: DeleteTimeBlockInput) {
  const existing = await prisma.timeBlock.findUnique({ where: { id: input.id } })
  if (!existing) throw new AppError(404, 'not_found', 'Bloqueio não encontrado.')

  await prisma.timeBlock.delete({ where: { id: input.id } })
}
