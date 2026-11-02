import { getSessionUser } from '@/lib/auth/session'
import type { SessionUser } from '@/lib/auth/session'
import { buildAppointmentIcs } from '@/lib/calendar/ics'
import { prisma } from '@/lib/db/prisma'
import { AppError, errorResponse } from '@/lib/http/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function canRead(
  user: SessionUser,
  appointment: { customerId: string | null; barberId: string },
) {
  if (user.role === 'OWNER') return true
  if (user.role === 'CUSTOMER') return appointment.customerId === user.id

  const profile = await prisma.barberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  return profile?.id === appointment.barberId
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) throw new AppError(401, 'unauthorized', 'Faça login para baixar o convite.')

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: { select: { name: true } },
        barber: { select: { displayName: true } },
      },
    })
    if (!appointment) throw new AppError(404, 'not_found', 'Agendamento não encontrado.')
    if (!(await canRead(user, appointment))) {
      throw new AppError(403, 'forbidden', 'Acesso negado.')
    }

    const shop = await prisma.shop.findFirst({
      select: { name: true, addressLine: true, city: true, state: true, email: true },
    })
    if (!shop) throw new AppError(500, 'shop_missing', 'Barbearia não configurada.')

    const ics = buildAppointmentIcs({
      uid: `appointment-${appointment.id}@barbearia-do-luiz`,
      title: `${appointment.service.name} — ${shop.name}`,
      description: `${appointment.service.name} com ${appointment.barber.displayName}`,
      location: `${shop.name}, ${shop.addressLine}, ${shop.city}/${shop.state}`,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      organizerName: shop.name,
      organizerEmail: shop.email,
    })

    return new Response(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="agendamento-${appointment.id}.ics"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
