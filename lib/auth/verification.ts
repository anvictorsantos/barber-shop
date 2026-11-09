import { peekRateLimit, resetRateLimit, takeRateLimit } from '@/lib/auth/rate-limit'
import {
  EMAIL_VERIFICATION_TTL_MS,
  OTP_FAILURE_LIMIT,
  OTP_FAILURE_WINDOW_MS,
  OTP_ISSUE_PER_DAY,
  OTP_ISSUE_PER_HOUR,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  createOpaqueToken,
  createOtp,
  hashesMatch,
  hashToken,
} from '@/lib/auth/tokens'
import { prisma } from '@/lib/db/prisma'
import { AppError } from '@/lib/http/errors'

import type { VerificationPurpose } from '@prisma/client'

async function assertOtpIssuanceAllowed(identifier: string): Promise<void> {
  const now = Date.now()
  const [hour, day] = await Promise.all([
    prisma.verificationToken.count({
      where: {
        identifier,
        channel: 'WHATSAPP',
        createdAt: { gt: new Date(now - 60 * 60 * 1000) },
      },
    }),
    prisma.verificationToken.count({
      where: {
        identifier,
        channel: 'WHATSAPP',
        createdAt: { gt: new Date(now - 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  if (hour >= OTP_ISSUE_PER_HOUR || day >= OTP_ISSUE_PER_DAY) {
    throw new AppError(
      429,
      'rate_limited',
      'Muitos códigos solicitados. Tente novamente mais tarde.',
    )
  }
}

function failureKey(identifier: string, purpose: VerificationPurpose): string {
  return `otp-fail:${purpose}:${identifier}`
}

async function blockedByFailures(
  identifier: string,
  purpose: VerificationPurpose,
): Promise<boolean> {
  const row = await peekRateLimit(failureKey(identifier, purpose))
  const blocked =
    row !== null && row.resetAt.getTime() > Date.now() && row.count >= OTP_FAILURE_LIMIT
  if (!blocked) return false

  await prisma.verificationToken.updateMany({
    where: { identifier, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  })

  return true
}

async function recordOtpFailure(identifier: string, purpose: VerificationPurpose): Promise<void> {
  const result = await takeRateLimit(
    failureKey(identifier, purpose),
    OTP_FAILURE_LIMIT,
    OTP_FAILURE_WINDOW_MS,
  )

  if (!result.allowed) {
    await prisma.verificationToken.updateMany({
      where: { identifier, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    })
  }
}

export async function issuePhoneOtp(userId: string, identifier: string): Promise<string> {
  await assertOtpIssuanceAllowed(identifier)

  const code = createOtp()

  await prisma.verificationToken.updateMany({
    where: { identifier, purpose: 'PHONE_OTP', consumedAt: null },
    data: { consumedAt: new Date() },
  })

  await prisma.verificationToken.create({
    data: {
      userId,
      identifier,
      channel: 'WHATSAPP',
      purpose: 'PHONE_OTP',
      tokenHash: hashToken(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })

  return code
}

export async function verifyPhoneOtp(identifier: string, code: string): Promise<string | null> {
  if (await blockedByFailures(identifier, 'PHONE_OTP')) return null

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      purpose: 'PHONE_OTP',
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!token || token.attempts >= OTP_MAX_ATTEMPTS) return null

  if (!hashesMatch(token.tokenHash, hashToken(code))) {
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    })
    await recordOtpFailure(identifier, 'PHONE_OTP')
    return null
  }

  await prisma.verificationToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  })
  await resetRateLimit(failureKey(identifier, 'PHONE_OTP'))

  return token.userId
}

export async function issueEmailVerification(userId: string, email: string): Promise<string> {
  const token = createOpaqueToken()

  await prisma.verificationToken.updateMany({
    where: { identifier: email, purpose: 'EMAIL_VERIFY', consumedAt: null },
    data: { consumedAt: new Date() },
  })

  await prisma.verificationToken.create({
    data: {
      userId,
      identifier: email,
      channel: 'EMAIL',
      purpose: 'EMAIL_VERIFY',
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  })

  return token
}

export async function consumeEmailVerification(token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  })

  if (
    !record ||
    record.purpose !== 'EMAIL_VERIFY' ||
    record.consumedAt !== null ||
    record.expiresAt.getTime() <= Date.now()
  ) {
    return null
  }

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  })

  return record.userId
}

export async function issuePasswordResetEmail(userId: string, email: string): Promise<string> {
  const token = createOpaqueToken()

  await prisma.verificationToken.updateMany({
    where: { identifier: email, purpose: 'PASSWORD_RESET', consumedAt: null },
    data: { consumedAt: new Date() },
  })

  await prisma.verificationToken.create({
    data: {
      userId,
      identifier: email,
      channel: 'EMAIL',
      purpose: 'PASSWORD_RESET',
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  })

  return token
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  })

  if (
    !record ||
    record.purpose !== 'PASSWORD_RESET' ||
    record.consumedAt !== null ||
    record.expiresAt.getTime() <= Date.now()
  ) {
    return null
  }

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  })

  return record.userId
}

export async function issueAccountActivation(userId: string, email: string): Promise<string> {
  const token = createOpaqueToken()

  await prisma.verificationToken.updateMany({
    where: { identifier: email, purpose: 'ACCOUNT_ACTIVATION', consumedAt: null },
    data: { consumedAt: new Date() },
  })

  await prisma.verificationToken.create({
    data: {
      userId,
      identifier: email,
      channel: 'EMAIL',
      purpose: 'ACCOUNT_ACTIVATION',
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  })

  return token
}

export async function consumeAccountActivation(token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  })

  if (
    !record ||
    record.purpose !== 'ACCOUNT_ACTIVATION' ||
    record.consumedAt !== null ||
    record.expiresAt.getTime() <= Date.now() ||
    !record.userId
  ) {
    return null
  }

  const userId = record.userId

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    prisma.verificationToken.updateMany({
      where: {
        userId,
        consumedAt: null,
        purpose: { in: ['ACCOUNT_ACTIVATION', 'PHONE_OTP'] },
      },
      data: { consumedAt: new Date() },
    }),
  ])

  return userId
}

export async function invalidatePendingActivation(userId: string): Promise<void> {
  await prisma.verificationToken.updateMany({
    where: {
      userId,
      consumedAt: null,
      purpose: { in: ['ACCOUNT_ACTIVATION', 'PHONE_OTP'] },
    },
    data: { consumedAt: new Date() },
  })
}

export async function issuePasswordResetOtp(userId: string, phone: string): Promise<string> {
  await assertOtpIssuanceAllowed(phone)

  const code = createOtp()

  await prisma.verificationToken.updateMany({
    where: { identifier: phone, purpose: 'PASSWORD_RESET', consumedAt: null },
    data: { consumedAt: new Date() },
  })

  await prisma.verificationToken.create({
    data: {
      userId,
      identifier: phone,
      channel: 'WHATSAPP',
      purpose: 'PASSWORD_RESET',
      tokenHash: hashToken(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })

  return code
}

export async function verifyPasswordResetOtp(phone: string, code: string): Promise<string | null> {
  if (await blockedByFailures(phone, 'PASSWORD_RESET')) return null

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: phone,
      purpose: 'PASSWORD_RESET',
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!token || token.attempts >= OTP_MAX_ATTEMPTS) return null

  if (!hashesMatch(token.tokenHash, hashToken(code))) {
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    })
    await recordOtpFailure(phone, 'PASSWORD_RESET')
    return null
  }

  await prisma.verificationToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  })
  await resetRateLimit(failureKey(phone, 'PASSWORD_RESET'))

  return token.userId
}
