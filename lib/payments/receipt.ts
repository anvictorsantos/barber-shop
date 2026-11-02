import { formatInTimeZone } from 'date-fns-tz'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { formatBRL } from '@/lib/format/money'
import type { getOrderByCode } from '@/lib/orders/queries'

type OrderWithLines = NonNullable<Awaited<ReturnType<typeof getOrderByCode>>>

export interface ReceiptShop {
  name: string
  cnpj: string | null
  addressLine: string
  city: string
  state: string
  phone: string | null
}

export const PAYMENT_METHOD_LABELS = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  CASH: 'Dinheiro',
} as const

export function receiptFileName(code: string): string {
  return `recibo-${code}.pdf`
}

export async function buildOrderReceiptPdf(
  order: OrderWithLines,
  shop: ReceiptShop,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const ink = rgb(0.09, 0.09, 0.11)
  const muted = rgb(0.42, 0.42, 0.48)
  const accent = rgb(0.85, 0.55, 0.1)
  const margin = 48
  const right = 595 - margin
  let y = 780

  const line = (
    text: string,
    options: { bold?: boolean; size?: number; color?: typeof ink } = {},
  ) => {
    page.drawText(text, {
      x: margin,
      y,
      size: options.size ?? 10,
      font: options.bold ? bold : font,
      color: options.color ?? ink,
    })
    y -= (options.size ?? 10) + 6
  }

  const amountLine = (label: string, value: string, options: { bold?: boolean } = {}) => {
    page.drawText(label, {
      x: margin,
      y,
      size: 10,
      font: options.bold ? bold : font,
      color: muted,
    })
    const textWidth = (options.bold ? bold : font).widthOfTextAtSize(value, options.bold ? 14 : 10)
    page.drawText(value, {
      x: right - textWidth,
      y: options.bold ? y - 2 : y,
      size: options.bold ? 14 : 10,
      font: options.bold ? bold : font,
      color: options.bold ? accent : ink,
    })
    y -= options.bold ? 26 : 16
  }

  line(shop.name.toUpperCase(), { bold: true, size: 18 })
  line(`${shop.addressLine} - ${shop.city}/${shop.state}${shop.phone ? ` - ${shop.phone}` : ''}`, {
    size: 9,
    color: muted,
  })
  if (shop.cnpj) line(`CNPJ ${shop.cnpj}`, { size: 9, color: muted })

  y -= 10
  line('RECIBO', { bold: true, size: 14 })
  line(`Pedido #${order.code}`, { size: 10, color: muted })
  if (order.paidAt) {
    line(`Pago em ${formatInTimeZone(order.paidAt, BUSINESS_TIMEZONE, "dd/MM/yyyy 'às' HH:mm")}`, {
      size: 10,
      color: muted,
    })
  }

  y -= 8
  line(order.customerName, { bold: true, size: 11 })
  if (order.customerEmail) line(order.customerEmail, { size: 9, color: muted })
  if (order.customerPhone) line(order.customerPhone, { size: 9, color: muted })

  y -= 14
  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.88),
  })
  y -= 18

  for (const appointment of order.appointments) {
    const when = formatInTimeZone(appointment.startAt, BUSINESS_TIMEZONE, "dd/MM/yyyy 'às' HH:mm")
    const label = `${appointment.service.name} - ${appointment.barber.displayName} - ${when}`
    page.drawText(label, { x: margin, y, size: 10, font, color: ink })
    const value = formatBRL(appointment.priceCents)
    page.drawText(value, {
      x: right - font.widthOfTextAtSize(value, 10),
      y,
      size: 10,
      font,
      color: ink,
    })
    y -= 18
  }

  for (const item of order.products) {
    const label = `${item.product.name} x${item.quantity}`
    page.drawText(label, { x: margin, y, size: 10, font, color: ink })
    const value = formatBRL(item.lineTotalCents)
    page.drawText(value, {
      x: right - font.widthOfTextAtSize(value, 10),
      y,
      size: 10,
      font,
      color: ink,
    })
    y -= 18
  }

  y -= 4
  page.drawLine({
    start: { x: margin, y: y + 10 },
    end: { x: right, y: y + 10 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.88),
  })
  amountLine('Total', formatBRL(order.totalCents), { bold: true })

  const paid = order.payments.find(
    (payment) => payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED',
  )
  if (paid) {
    line(
      `${PAYMENT_METHOD_LABELS[paid.method]} - ${order.paymentMode === 'ONLINE' ? 'online' : 'na barbearia'}`,
      {
        size: 9,
        color: muted,
      },
    )
    if (paid.refundedCents > 0) {
      line(`Reembolsado: ${formatBRL(paid.refundedCents)}`, { size: 9, color: muted })
    }
  }

  y -= 20
  line('Documento sem valor fiscal.', { size: 8, color: muted })

  return pdf.save()
}
