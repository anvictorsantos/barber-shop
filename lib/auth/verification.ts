import {
  EMAIL_VERIFICATION_TTL_MS,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  createOpaqueToken,
  createOtp,
  hashesMatch,
  hashToken,
} from '@/lib/auth/tokens'
import { prisma } from '@/lib/db/prisma'

export async function issuePhoneOtp(userId: string, identifier: string): Promise<string> {
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
    return null
  }

  await prisma.verificationToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  })

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

export async function issuePasswordResetOtp(userId: string, phone: string): Promise<string> {
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
    return null
  }

  await prisma.verificationToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  })

  return token.userId
}
