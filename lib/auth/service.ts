import { emailReputationChecker } from '@/lib/auth/email-reputation'
import type { EmailReputationChecker } from '@/lib/auth/email-reputation-types'
import { normalizeIdentifier, normalizePhone, type NormalizedIdentifier } from '@/lib/auth/identity'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import {
  consumeEmailVerification,
  consumePasswordResetToken,
  issueEmailVerification,
  issuePasswordResetEmail,
  issuePasswordResetOtp,
  issuePhoneOtp,
  verifyPasswordResetOtp,
  verifyPhoneOtp,
} from '@/lib/auth/verification'
import { prisma } from '@/lib/db/prisma'
import { getServerEnv } from '@/lib/env'
import { AppError } from '@/lib/http/errors'
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/notifications/email'
import { sendPhoneOtp } from '@/lib/notifications/whatsapp'

import type { Role, User } from '@prisma/client'

export interface AuthUser {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: Role
  emailVerifiedAt: Date | null
  phoneVerifiedAt: Date | null
}

export interface RegisterResult {
  user: AuthUser
  requiresPhoneVerification: boolean
  verificationEmailSent: boolean
}

export interface AuthDelivery {
  sendPhoneOtp(phone: string, code: string): Promise<void>
  sendVerificationEmail(to: string, name: string, url: string): Promise<void>
  sendPasswordResetEmail(to: string, name: string, url: string): Promise<void>
}

export interface AuthDeps {
  delivery: AuthDelivery
  emailReputation: EmailReputationChecker
}

const defaultDeps: AuthDeps = {
  delivery: {
    sendPhoneOtp,
    sendVerificationEmail,
    sendPasswordResetEmail,
  },
  emailReputation: emailReputationChecker(),
}

function toAuthUser(user: {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: Role
  emailVerifiedAt: Date | null
  phoneVerifiedAt: Date | null
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    phoneVerifiedAt: user.phoneVerifiedAt,
  }
}

function identifierWhere(identifier: NormalizedIdentifier) {
  return identifier.kind === 'email' ? { email: identifier.value } : { phone: identifier.value }
}

function emailUrl(path: string, token: string): string {
  const base = getServerEnv().APP_URL.replace(/\/+$/, '')
  return `${base}${path}?token=${encodeURIComponent(token)}`
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

function logDeliveryFailure(kind: string, error: unknown): void {
  console.warn(`[auth] ${kind} delivery failed:`, error instanceof Error ? error.name : 'unknown')
}

export async function registerUser(
  input: { name: string; identifier: string; password: string },
  deps: AuthDeps = defaultDeps,
): Promise<RegisterResult> {
  const identifier = normalizeIdentifier(input.identifier)
  if (!identifier) {
    throw new AppError(400, 'invalid_identifier', 'Informe um telefone ou e-mail válido.')
  }

  const existing = await prisma.user.findFirst({ where: identifierWhere(identifier) })
  if (existing) {
    throw new AppError(409, 'identifier_taken', 'Este contato já está cadastrado.')
  }

  if (identifier.kind === 'email') {
    const verdict = await deps.emailReputation.check(identifier.value)
    if (verdict?.disposable) {
      throw new AppError(400, 'email_not_allowed', 'Use um e-mail permanente.')
    }
  }

  const passwordHash = await hashPassword(input.password)

  let user: User
  try {
    user = await prisma.user.create({
      data: {
        name: input.name,
        email: identifier.kind === 'email' ? identifier.value : null,
        phone: identifier.kind === 'phone' ? identifier.value : null,
        passwordHash,
        role: 'CUSTOMER',
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, 'identifier_taken', 'Este contato já está cadastrado.')
    }
    throw error
  }

  if (identifier.kind === 'phone') {
    const code = await issuePhoneOtp(user.id, identifier.value)
    try {
      await deps.delivery.sendPhoneOtp(identifier.value, code)
    } catch (error) {
      logDeliveryFailure('WhatsApp OTP', error)
      throw new AppError(
        502,
        'delivery_failed',
        'Não foi possível enviar o código. Tente novamente.',
      )
    }

    return {
      user: toAuthUser(user),
      requiresPhoneVerification: true,
      verificationEmailSent: false,
    }
  }

  const token = await issueEmailVerification(user.id, identifier.value)
  const url = emailUrl('/verificar-email', token)
  let verificationEmailSent = true

  try {
    await deps.delivery.sendVerificationEmail(identifier.value, user.name, url)
  } catch (error) {
    verificationEmailSent = false
    logDeliveryFailure('verification email', error)
  }

  return {
    user: toAuthUser(user),
    requiresPhoneVerification: false,
    verificationEmailSent,
  }
}

export async function loginUser(identifierInput: string, password: string): Promise<AuthUser> {
  const identifier = normalizeIdentifier(identifierInput)
  if (!identifier) {
    throw new AppError(401, 'invalid_credentials', 'Contato ou senha inválidos.')
  }

  const user = await prisma.user.findFirst({ where: identifierWhere(identifier) })
  if (!user?.passwordHash) {
    throw new AppError(401, 'invalid_credentials', 'Contato ou senha inválidos.')
  }

  const valid = await verifyPassword(user.passwordHash, password)
  if (!valid) {
    throw new AppError(401, 'invalid_credentials', 'Contato ou senha inválidos.')
  }

  if (identifier.kind === 'phone' && !user.phoneVerifiedAt) {
    throw new AppError(403, 'phone_not_verified', 'Confirme seu WhatsApp para entrar.')
  }

  return toAuthUser(user)
}

export async function verifyPhoneSignup(phoneInput: string, code: string): Promise<AuthUser> {
  const phone = normalizePhone(phoneInput)
  if (!phone) {
    throw new AppError(400, 'invalid_phone', 'Telefone inválido.')
  }

  const userId = await verifyPhoneOtp(phone, code)
  if (!userId) {
    throw new AppError(400, 'invalid_code', 'Código inválido ou expirado.')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { phoneVerifiedAt: new Date() },
  })

  return toAuthUser(user)
}

export async function verifyEmailToken(token: string): Promise<AuthUser> {
  const userId = await consumeEmailVerification(token)
  if (!userId) {
    throw new AppError(400, 'invalid_token', 'Link inválido ou expirado.')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  })

  return toAuthUser(user)
}

export async function requestPasswordReset(
  identifierInput: string,
  deps: AuthDeps = defaultDeps,
): Promise<void> {
  const identifier = normalizeIdentifier(identifierInput)
  if (!identifier) return

  const user = await prisma.user.findFirst({ where: identifierWhere(identifier) })
  if (!user) return

  try {
    if (identifier.kind === 'email' && user.email) {
      const token = await issuePasswordResetEmail(user.id, user.email)
      await deps.delivery.sendPasswordResetEmail(
        user.email,
        user.name,
        emailUrl('/recuperar-senha', token),
      )
      return
    }

    if (identifier.kind === 'phone' && user.phone) {
      const code = await issuePasswordResetOtp(user.id, user.phone)
      await deps.delivery.sendPhoneOtp(user.phone, code)
    }
  } catch (error) {
    logDeliveryFailure('password reset', error)
  }
}

export async function resetPasswordWithToken(token: string, password: string): Promise<void> {
  const userId = await consumePasswordResetToken(token)
  if (!userId) {
    throw new AppError(400, 'invalid_token', 'Link inválido ou expirado.')
  }

  await updatePassword(userId, password)
}

export async function resetPasswordWithOtp(
  phoneInput: string,
  code: string,
  password: string,
): Promise<void> {
  const phone = normalizePhone(phoneInput)
  if (!phone) {
    throw new AppError(400, 'invalid_phone', 'Telefone inválido.')
  }

  const userId = await verifyPasswordResetOtp(phone, code)
  if (!userId) {
    throw new AppError(400, 'invalid_code', 'Código inválido ou expirado.')
  }

  await updatePassword(userId, password)
}

export async function resendVerification(
  identifierInput: string,
  deps: AuthDeps = defaultDeps,
): Promise<void> {
  const identifier = normalizeIdentifier(identifierInput)
  if (!identifier) return

  const user = await prisma.user.findFirst({ where: identifierWhere(identifier) })
  if (!user) return

  try {
    if (identifier.kind === 'email' && user.email && !user.emailVerifiedAt) {
      const token = await issueEmailVerification(user.id, user.email)
      await deps.delivery.sendVerificationEmail(
        user.email,
        user.name,
        emailUrl('/verificar-email', token),
      )
      return
    }

    if (identifier.kind === 'phone' && user.phone && !user.phoneVerifiedAt) {
      const code = await issuePhoneOtp(user.id, user.phone)
      await deps.delivery.sendPhoneOtp(user.phone, code)
    }
  } catch (error) {
    logDeliveryFailure('resend verification', error)
  }
}

async function updatePassword(userId: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  await prisma.session.deleteMany({ where: { userId } })
}
