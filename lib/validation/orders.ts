import { z } from 'zod'

const optionalEmail = z
  .union([z.literal(''), z.string().trim().email('E-mail inválido.')])
  .optional()
  .default('')

const serviceLineSchema = z.object({
  kind: z.literal('service'),
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  startAt: z.string().min(1),
})

const productLineSchema = z.object({
  kind: z.literal('product'),
  productId: z.string().min(1),
  quantity: z.coerce
    .number()
    .int()
    .min(1, 'Quantidade inválida.')
    .max(99, 'Quantidade muito alta.'),
})

export const createOrderSchema = z.object({
  paymentMode: z.enum(['ONLINE', 'ON_SITE']),
  customer: z.object({
    name: z.string().trim().min(2, 'Informe seu nome.').max(120),
    email: optionalEmail,
    phone: z.string().trim().max(30).optional().default(''),
  }),
  lines: z
    .array(z.discriminatedUnion('kind', [serviceLineSchema, productLineSchema]))
    .min(1, 'Adicione pelo menos um item.')
    .max(20, 'Muitos itens no pedido.'),
  note: z.string().trim().max(500).optional().default(''),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
