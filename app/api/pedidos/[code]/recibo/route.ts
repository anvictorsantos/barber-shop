import { getSessionUser } from '@/lib/auth/session'
import type { SessionUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AppError, errorResponse } from '@/lib/http/errors'
import { getOrderByCode } from '@/lib/orders/queries'
import type { getOrderByCode as getOrder } from '@/lib/orders/queries'
import { buildOrderReceiptPdf, receiptFileName } from '@/lib/payments/receipt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type OrderWithLines = NonNullable<Awaited<ReturnType<typeof getOrder>>>

async function canReadReceipt(user: SessionUser, order: OrderWithLines): Promise<boolean> {
  if (user.role === 'OWNER') return true
  if (user.role === 'CUSTOMER') return order.customerId === user.id

  const profile = await prisma.barberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })

  return (
    profile !== null &&
    order.appointments.some((appointment) => appointment.barberId === profile.id)
  )
}

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const user = await getSessionUser()
    if (!user) throw new AppError(401, 'unauthorized', 'Faça login para baixar o recibo.')

    const order = await getOrderByCode(code)
    if (!order) throw new AppError(404, 'not_found', 'Pedido não encontrado.')
    if (!(await canReadReceipt(user, order))) {
      throw new AppError(403, 'forbidden', 'Acesso negado.')
    }

    const settled = order.payments.some((payment) => payment.paidAt !== null)
    if (!settled) throw new AppError(409, 'not_paid', 'Recibo disponível após o pagamento.')

    const shop = await prisma.shop.findFirst({
      select: {
        name: true,
        cnpj: true,
        addressLine: true,
        city: true,
        state: true,
        phone: true,
      },
    })
    if (!shop) throw new AppError(500, 'shop_missing', 'Barbearia não configurada.')

    const pdf = await buildOrderReceiptPdf(order, shop)

    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${receiptFileName(order.code)}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
