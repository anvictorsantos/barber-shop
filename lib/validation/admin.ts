import { z } from 'zod'

const optionalEmail = z
  .union([z.literal(''), z.string().trim().email('E-mail inválido.')])
  .optional()
  .default('')

export const manualBookingSchema = z.object({
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  startAt: z.string().min(1, 'Escolha um horário.'),
  source: z.enum(['MANUAL', 'WALK_IN']),
  customer: z.object({
    name: z.string().trim().min(2, 'Informe o nome do cliente.').max(120),
    email: optionalEmail,
    phone: z.string().trim().max(30).optional().default(''),
  }),
  note: z.string().trim().max(300).optional().default(''),
})

export const appointmentActionSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().trim().max(200).optional().default(''),
})

export const customerBlockSchema = z.object({
  userId: z.string().min(1),
})

export type ManualBookingInput = z.infer<typeof manualBookingSchema>
export type AppointmentActionInput = z.infer<typeof appointmentActionSchema>
