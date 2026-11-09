import { z } from 'zod'

const identifier = z
  .string()
  .trim()
  .min(3, 'Informe um telefone ou e-mail válido.')
  .max(254, 'Contato muito longo.')

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'abc12345',
  'admin123',
  'barbearia',
  'brasil123',
  'demo1234',
  'iloveyou',
  'letmein',
  'mudar123',
  'password',
  'password1',
  'password123',
  'qwerty123',
  'senha123',
  'welcome1',
])

const password = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(128, 'A senha é muito longa.')
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), 'Escolha uma senha mais forte.')

const code = z.string().regex(/^\d{6}$/, 'Código inválido.')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
  identifier,
  password,
})

export const loginSchema = z.object({
  identifier,
  password: z.string().min(1, 'Informe a senha.').max(128, 'Senha muito longa.'),
})

export const verifyPhoneSchema = z.object({
  phone: z.string().trim().min(8, 'Informe o telefone.'),
  code,
})

export const verifyEmailSchema = z.object({
  token: z.string().min(20, 'Token inválido.'),
})

export const requestResetSchema = z.object({ identifier })

export const resetPasswordSchema = z.union([
  z.object({ token: z.string().min(20, 'Token inválido.'), password }),
  z.object({ phone: z.string().trim().min(8, 'Informe o telefone.'), code, password }),
])

export const resendSchema = z.object({ identifier })

export const phoneLoginSchema = z.object({
  phone: z.string().trim().min(8, 'Informe o telefone.'),
})

export const activateAccountSchema = z.union([
  z.object({ token: z.string().min(20, 'Token inválido.'), password }),
  z.object({ phone: z.string().trim().min(8, 'Informe o telefone.'), code, password }),
])

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type RequestResetInput = z.infer<typeof requestResetSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ResendInput = z.infer<typeof resendSchema>
export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>
