import { afterAll, describe, expect, it } from 'vitest'

import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyEmailToken,
  verifyPhoneSignup,
  type AuthDeps,
} from '@/lib/auth/service'
import { prisma } from '@/lib/db/prisma'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const phone = `+55319${String(Date.now()).slice(-8)}`
const email = `auth.test.${suffix}@example.com`

let otpCode = ''
let verificationUrl = ''

const deps: AuthDeps = {
  delivery: {
    async sendPhoneOtp(_phone, code) {
      otpCode = code
    },
    async sendVerificationEmail(_to, _name, url) {
      verificationUrl = url
    },
    async sendPasswordResetEmail() {},
  },
  emailReputation: {
    async check() {
      return { disposable: false }
    },
  },
}

const createdIds: string[] = []

afterAll(async () => {
  if (createdIds.length === 0) return
  await prisma.session.deleteMany({ where: { userId: { in: createdIds } } })
  await prisma.verificationToken.deleteMany({ where: { userId: { in: createdIds } } })
  await prisma.user.deleteMany({ where: { id: { in: createdIds } } })
})

describe('auth service', () => {
  it('requires phone verification before login', async () => {
    const registered = await registerUser(
      { name: 'Telefone Teste', identifier: phone, password: 'secret123' },
      deps,
    )
    createdIds.push(registered.user.id)

    expect(registered.requiresPhoneVerification).toBe(true)
    expect(registered.user.phoneVerifiedAt).toBeNull()
    expect(otpCode).toMatch(/^\d{6}$/)

    await expect(loginUser(phone, 'secret123')).rejects.toThrow('Confirme seu WhatsApp')

    const verified = await verifyPhoneSignup(phone, otpCode)
    expect(verified.phoneVerifiedAt).not.toBeNull()
    await expect(loginUser(phone, 'secret123')).resolves.toMatchObject({
      id: registered.user.id,
    })
  })

  it('registers an email and verifies it', async () => {
    const registered = await registerUser(
      { name: 'Email Teste', identifier: email, password: 'secret123' },
      deps,
    )
    createdIds.push(registered.user.id)

    expect(registered.requiresPhoneVerification).toBe(false)
    expect(registered.verificationEmailSent).toBe(true)
    expect(verificationUrl).toContain('/verificar-email?token=')

    const token = new URL(verificationUrl).searchParams.get('token')
    expect(token).not.toBeNull()

    const verified = await verifyEmailToken(token ?? '')
    expect(verified.emailVerifiedAt).not.toBeNull()
    await expect(loginUser(email, 'secret123')).resolves.toMatchObject({
      id: registered.user.id,
    })
  })

  it('resets a password with a phone OTP and revokes old sessions', async () => {
    await requestPasswordReset(phone, deps)
    expect(otpCode).toMatch(/^\d{6}$/)

    await resetPasswordWithOtp(phone, otpCode, 'newsecret123')

    await expect(loginUser(phone, 'secret123')).rejects.toThrow('Contato ou senha inválidos.')
    await expect(loginUser(phone, 'newsecret123')).resolves.toMatchObject({
      phone,
    })
  })
})
