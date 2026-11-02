import { z } from 'zod'

export const customerProfileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120),
  phone: z.string().trim().max(30).optional().default(''),
  cpf: z.string().trim().max(14).optional().default(''),
  birthDate: z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')])
    .optional()
    .default(''),
  addressLine: z.string().trim().max(160).optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(2).optional().default(''),
  postalCode: z.string().trim().max(9).optional().default(''),
})

export const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  whatsapp: z.boolean(),
})

export const favoriteSchema = z.object({
  kind: z.enum(['service', 'barber', 'product']),
  id: z.string().min(1),
})

export const reviewSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.coerce.number().int().min(1, 'Escolha de 1 a 5 estrelas.').max(5),
  comment: z.string().trim().max(500).optional().default(''),
})

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
})

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
