import { z } from 'zod'

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true')

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  APP_URL: z.string().url().default('http://localhost:3000'),
  SHOP_TIMEZONE: z.string().min(1).default('America/Sao_Paulo'),
  SESSION_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(16),
  ORIGIN_SHARED_SECRET: z.string().default(''),
  DEMO_MODE: booleanString.default(false),

  EMAIL_ENABLED: booleanString.default(true),
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default(''),
  EMAIL_REPLY_TO: z.string().default(''),

  WHATSAPP_ENABLED: booleanString.default(true),
  WHATSAPP_ACCESS_TOKEN: z.string().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(''),
  WHATSAPP_VERIFY_TOKEN: z.string().default(''),
  WHATSAPP_TEMPLATE_OTP: z.string().default(''),
  WHATSAPP_TEMPLATE_CONFIRMATION: z.string().default(''),
  WHATSAPP_TEMPLATE_REMINDER: z.string().default(''),
  WHATSAPP_TEMPLATE_CANCELED: z.string().default(''),
  WHATSAPP_TEMPLATE_RESCHEDULED: z.string().default(''),
  WHATSAPP_TEMPLATE_NO_SHOW_BLOCK: z.string().default(''),
  WHATSAPP_GRAPH_VERSION: z.string().default('v22.0'),

  MERCADO_PAGO_ENABLED: booleanString.default(true),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().default(''),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().default(''),

  VAPID_PUBLIC_KEY: z.string().default(''),
  VAPID_PRIVATE_KEY: z.string().default(''),
  VAPID_SUBJECT: z.string().default('mailto:contato@barbeariadoluiz.com.br'),

  SENTRY_DSN: z.string().default(''),
  SENTRY_ENV: z.string().default(''),
  SENTRY_RELEASE: z.string().default(''),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(input: NodeJS.ProcessEnv): ServerEnv {
  const parsed = serverEnvSchema.safeParse(input)

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid environment: ${details}`)
  }

  if (parsed.data.NODE_ENV === 'production' && parsed.data.DEMO_MODE) {
    throw new Error('DEMO_MODE is forbidden in production')
  }

  return parsed.data
}

let cached: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env)
  return cached
}
