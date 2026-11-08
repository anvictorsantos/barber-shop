import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  consumeAccountActivation,
  consumeEmailVerification,
  consumePasswordResetToken,
  issueAccountActivation,
  issueEmailVerification,
  issuePasswordResetEmail,
  issuePhoneOtp,
  verifyPhoneOtp,
} from '@/lib/auth/verification'
import { prisma } from '@/lib/db/prisma'

let ownerId = ''
let ownerPhone = ''
let ownerEmail = ''

beforeAll(async () => {
  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } })
  expect(owner).not.toBeNull()
  if (!owner?.phone || !owner.email) return

  ownerId = owner.id
  ownerPhone = owner.phone
  ownerEmail = owner.email
})

afterAll(async () => {
  if (ownerId) {
    await prisma.verificationToken.deleteMany({ where: { userId: ownerId } })
  }
})

describe('verification tokens', () => {
  it('verifies a phone OTP once and counts a wrong attempt', async () => {
    const code = await issuePhoneOtp(ownerId, ownerPhone)
    const wrong = code === '000000' ? '111111' : '000000'

    await expect(verifyPhoneOtp(ownerPhone, wrong)).resolves.toBeNull()
    await expect(verifyPhoneOtp(ownerPhone, code)).resolves.toBe(ownerId)
    await expect(verifyPhoneOtp(ownerPhone, code)).resolves.toBeNull()
  })

  it('consumes an email verification link once', async () => {
    const token = await issueEmailVerification(ownerId, ownerEmail)

    await expect(consumeEmailVerification(token)).resolves.toBe(ownerId)
    await expect(consumeEmailVerification(token)).resolves.toBeNull()
  })

  it('consumes a password reset link once', async () => {
    const token = await issuePasswordResetEmail(ownerId, ownerEmail)

    await expect(consumePasswordResetToken(token)).resolves.toBe(ownerId)
    await expect(consumePasswordResetToken(token)).resolves.toBeNull()
  })

  it('consumes an account activation link once and invalidates a pending OTP', async () => {
    const otp = await issuePhoneOtp(ownerId, ownerPhone)
    const token = await issueAccountActivation(ownerId, ownerEmail)

    await expect(consumeAccountActivation(token)).resolves.toBe(ownerId)
    await expect(consumeAccountActivation(token)).resolves.toBeNull()
    await expect(verifyPhoneOtp(ownerPhone, otp)).resolves.toBeNull()
  })

  it('rejects an expired account activation link', async () => {
    const token = await issueAccountActivation(ownerId, ownerEmail)

    await prisma.verificationToken.updateMany({
      where: { userId: ownerId, purpose: 'ACCOUNT_ACTIVATION', consumedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    await expect(consumeAccountActivation(token)).resolves.toBeNull()
  })
})
