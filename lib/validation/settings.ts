import { z } from 'zod'

import { imageUrlSchema } from '@/lib/validation/image'

const optionalEmail = z
  .union([z.literal(''), z.string().trim().email('E-mail inválido.')])
  .optional()
  .default('')

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.')

export const shopSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome.').max(120),
  cnpj: z.string().trim().max(20).optional().default(''),
  addressLine: z.string().trim().min(3, 'Informe o endereço.').max(200),
  city: z.string().trim().min(2, 'Informe a cidade.').max(120),
  state: z.string().trim().length(2, 'Use a sigla do estado.'),
  postalCode: z.string().trim().max(12).optional().default(''),
  phone: z.string().trim().max(30).optional().default(''),
  whatsapp: z.string().trim().min(8, 'Informe o WhatsApp.').max(30),
  email: optionalEmail,
})

export const hoursSchema = z.object({
  hours: z
    .array(
      z.object({
        weekday: z.coerce.number().int().min(0).max(6),
        open: time,
        close: time,
        closed: z.boolean(),
      }),
    )
    .length(7, 'Informe os sete dias.'),
})

export const createBarberSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome.').max(120),
    email: optionalEmail,
    phone: z.string().trim().max(30).optional().default(''),
    password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(128),
    displayName: z.string().trim().min(2, 'Informe o nome de exibição.').max(80),
    title: z.string().trim().min(2, 'Informe o cargo.').max(80),
    avatarUrl: imageUrlSchema,
  })
  .refine((input) => Boolean(input.email || input.phone), {
    message: 'Informe e-mail ou telefone.',
    path: ['email'],
  })

export const updateBarberSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, 'Informe o nome.').max(120),
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.').max(80),
  title: z.string().trim().min(2, 'Informe o cargo.').max(80),
  avatarUrl: imageUrlSchema,
  active: z.boolean(),
})

export const toggleBarberSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
})

export const timeBlockSchema = z
  .object({
    barberId: z.string().min(1),
    label: z.string().trim().min(2, 'Informe o motivo.').max(80),
    recurring: z.boolean(),
    weekday: z.coerce.number().int().min(0).max(6).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
      .optional(),
    start: time,
    end: time,
  })
  .superRefine((input, ctx) => {
    if (input.recurring && input.weekday === undefined) {
      ctx.addIssue({ code: 'custom', path: ['weekday'], message: 'Escolha o dia da semana.' })
    }
    if (!input.recurring && !input.date) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Escolha a data.' })
    }
    if (input.start >= input.end) {
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'O fim deve ser depois do início.' })
    }
  })

export const deleteTimeBlockSchema = z.object({ id: z.string().min(1) })

export type ShopInput = z.infer<typeof shopSchema>
export type HoursInput = z.infer<typeof hoursSchema>
export type CreateBarberInput = z.infer<typeof createBarberSchema>
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>
export type ToggleBarberInput = z.infer<typeof toggleBarberSchema>
export type TimeBlockInput = z.infer<typeof timeBlockSchema>
export type DeleteTimeBlockInput = z.infer<typeof deleteTimeBlockSchema>
