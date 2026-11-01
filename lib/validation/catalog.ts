import { z } from 'zod'

const imageUrl = z
  .union([z.literal(''), z.string().url('URL de imagem inválida.')])
  .optional()
  .default('')

const price = z.string().min(1, 'Informe o preço.')

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome.').max(80, 'Nome muito longo.'),
  description: z.string().trim().min(2, 'Informe a descrição.').max(1200, 'Descrição muito longa.'),
  category: z.enum(['CORTE', 'BARBA', 'COMBO', 'PEZINHO', 'QUIMICA']),
  durationMin: z.coerce
    .number()
    .int()
    .min(10, 'Mínimo de 10 minutos.')
    .max(90, 'Máximo de 90 minutos.'),
  price,
  originalPrice: z.string().optional().default(''),
  promoLabel: z.string().trim().max(20, 'Texto promocional muito longo.').optional().default(''),
  imageUrl,
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
})

export const updateServiceSchema = serviceInputSchema.extend({
  id: z.string().min(1),
})

export const productInputSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome.').max(80, 'Nome muito longo.'),
  description: z.string().trim().min(2, 'Informe a descrição.').max(1200, 'Descrição muito longa.'),
  price,
  stock: z.coerce.number().int().min(0, 'Estoque inválido.').max(1_000_000, 'Estoque muito alto.'),
  imageUrl,
  active: z.boolean().default(true),
})

export const updateProductSchema = productInputSchema.extend({
  id: z.string().min(1),
})

export const toggleSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
})

export type ServiceInput = z.infer<typeof serviceInputSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type ProductInput = z.infer<typeof productInputSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ToggleInput = z.infer<typeof toggleSchema>
