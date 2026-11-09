import { afterAll, describe, expect, it } from 'vitest'

import {
  activateAccountWithOtp,
  activateAccountWithToken,
  loginUser,
  registerUser,
  requestPasswordReset,
  requestPhoneLogin,
  resetPasswordWithOtp,
  sendAccountActivation,
  verifyEmailToken,
  verifyPhoneSignup,
  type AuthDeps,
} from '@/lib/auth/service'
import { issuePhoneOtp } from '@/lib/auth/verification'
import { prisma } from '@/lib/db/prisma'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const phone = `+55319${String(Date.now()).slice(-8)}`
const email = `auth.test.${suffix}@example.com`

let otpCode = ''
let verificationUrl = ''
let activationUrl = ''

const deps: AuthDeps = {
  delivery: {
    async sendPhoneOtp(_phone, code) {
      otpCode = code
    },
    async sendVerificationEmail(_to, _name, url) {
      verificationUrl = url
    },
    async sendPasswordResetEmail() {},
    async sendAccountActivationEmail(_to, _name, url) {
      activationUrl = url
    },
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
    const user = await prisma.user.findFirstOrThrow({ where: { phone } })
    createdIds.push(user.id)

    expect(registered.requiresPhoneVerification).toBe(true)
    expect(user.phoneVerifiedAt).toBeNull()
    expect(otpCode).toMatch(/^\d{6}$/)

    await expect(loginUser(phone, 'secret123')).rejects.toThrow('Confirme seu WhatsApp')

    const verified = await verifyPhoneSignup(phone, otpCode)
    expect(verified.phoneVerifiedAt).not.toBeNull()
    await expect(loginUser(phone, 'secret123')).resolves.toMatchObject({
      id: user.id,
    })
  })

  it('registers an email and verifies it', async () => {
    const registered = await registerUser(
      { name: 'Email Teste', identifier: email, password: 'secret123' },
      deps,
    )
    const user = await prisma.user.findFirstOrThrow({ where: { email } })
    createdIds.push(user.id)

    expect(registered.requiresPhoneVerification).toBe(false)
    expect(registered.verificationEmailSent).toBe(true)
    expect(verificationUrl).toContain('/verificar-email?token=')

    const token = new URL(verificationUrl).searchParams.get('token')
    expect(token).not.toBeNull()

    const verified = await verifyEmailToken(token ?? '')
    expect(verified.emailVerifiedAt).not.toBeNull()
    await expect(loginUser(email, 'secret123')).resolves.toMatchObject({
      id: user.id,
    })
  })

  it('does not reveal an existing contact at registration', async () => {
    const repeated = await registerUser(
      { name: 'Email Teste', identifier: email, password: 'secret123' },
      deps,
    )

    expect(repeated).toEqual({
      requiresPhoneVerification: false,
      verificationEmailSent: true,
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

  it('activates an email account only through the emailed link', async () => {
    const pending = await prisma.user.create({
      data: {
        name: 'Pendente Email',
        email: `pending.${suffix}@example.com`,
        passwordHash: null,
        role: 'CUSTOMER',
      },
    })
    createdIds.push(pending.id)
    const pendingEmail = pending.email ?? ''

    await expect(loginUser(pendingEmail, 'secret123')).rejects.toThrow(
      'Contato ou senha inválidos.',
    )

    activationUrl = ''
    await sendAccountActivation(pending.id, { email: pendingEmail, phone: null }, deps)
    expect(activationUrl).toContain('/ativar-conta?token=')

    const token = new URL(activationUrl).searchParams.get('token')
    const activated = await activateAccountWithToken(token ?? '', 'secret123')
    expect(activated.emailVerifiedAt).not.toBeNull()

    await expect(loginUser(pendingEmail, 'secret123')).resolves.toMatchObject({
      id: pending.id,
    })
  })

  it('activates a phone account with the WhatsApp code and then refuses OTP login', async () => {
    const pendingPhone = `+55319${String(Date.now() + 1).slice(-8)}`
    const pending = await prisma.user.create({
      data: {
        name: 'Pendente Fone',
        phone: pendingPhone,
        passwordHash: null,
        role: 'CUSTOMER',
      },
    })
    createdIds.push(pending.id)

    await expect(loginUser(pendingPhone, 'secret123')).rejects.toThrow(
      'Contato ou senha inválidos.',
    )

    otpCode = ''
    await sendAccountActivation(pending.id, { email: null, phone: pendingPhone }, deps)
    expect(otpCode).toMatch(/^\d{6}$/)

    const activated = await activateAccountWithOtp(pendingPhone, otpCode, 'secret123')
    expect(activated.phoneVerifiedAt).not.toBeNull()
    await expect(loginUser(pendingPhone, 'secret123')).resolves.toMatchObject({
      id: pending.id,
    })

    const blockedCode = await issuePhoneOtp(pending.id, pendingPhone)
    await expect(verifyPhoneSignup(pendingPhone, blockedCode)).rejects.toThrow('Código inválido')
  })

  it('allows a pending phone account to log in by OTP until it sets a password', async () => {
    const pendingPhone = `+55319${String(Date.now() + 2).slice(-8)}`
    const pending = await prisma.user.create({
      data: {
        name: 'Pendente Login',
        phone: pendingPhone,
        passwordHash: null,
        role: 'CUSTOMER',
      },
    })
    createdIds.push(pending.id)

    otpCode = ''
    await requestPhoneLogin(pendingPhone, deps)
    expect(otpCode).toMatch(/^\d{6}$/)

    const loggedIn = await verifyPhoneSignup(pendingPhone, otpCode)
    expect(loggedIn.phoneVerifiedAt).not.toBeNull()
    await expect(loginUser(pendingPhone, 'secret123')).rejects.toThrow(
      'Contato ou senha inválidos.',
    )
  })

  it('does not send an OTP login code for accounts that already have a password', async () => {
    const passwordPhone = `+55319${String(Date.now() + 3).slice(-8)}`
    const account = await prisma.user.create({
      data: {
        name: 'Conta Com Senha',
        phone: passwordPhone,
        phoneVerifiedAt: new Date(),
        passwordHash: 'existing-hash',
        role: 'CUSTOMER',
      },
    })
    createdIds.push(account.id)

    otpCode = ''
    await requestPhoneLogin(passwordPhone, deps)
    expect(otpCode).toBe('')

    const code = await issuePhoneOtp(account.id, passwordPhone)
    await expect(verifyPhoneSignup(passwordPhone, code)).rejects.toThrow('Código inválido')
  })
})
