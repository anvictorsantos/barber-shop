import { z } from 'zod'

export const recordPaymentSchema = z.object({
  orderCode: z.string().trim().min(1),
  method: z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH']),
})

export const refundPaymentSchema = z.object({
  orderCode: z.string().trim().min(1),
  amountCents: z.number().int().positive('Valor inválido.'),
  reason: z.string().trim().min(3, 'Informe o motivo.').max(300),
  appointmentId: z.string().min(1).optional(),
  orderProductId: z.string().min(1).optional(),
})

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>
