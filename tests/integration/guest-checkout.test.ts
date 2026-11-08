import { addDays, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { describe, expect, it } from 'vitest'

import {
  activateAccountWithOtp,
  activateAccountWithToken,
  loginUser,
  requestPhoneLogin,
  sendAccountActivation,
  verifyPhoneSignup,
  type AuthDeps,
} from '@/lib/auth/service'
import { getAvailability } from '@/lib/availability/queries'
import { BUSINESS_TIMEZONE } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/prisma'
import { createOrder } from '@/lib/orders/create-order'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
let phoneSeed = 0

function nextPhone(): string {
  phoneSeed += 1
  return `+55319${String(Date.now() + phoneSeed).slice(-8)}`
}

function makeDeps() {
  const sent = { emails: [] as string[], otps: [] as { phone: string; code: string }[] }
  const delivery: AuthDeps['delivery'] = {
    async sendPhoneOtp(phone, code) {
      sent.otps.push({ phone, code })
    },
    async sendVerificationEmail() {},
    async sendPasswordResetEmail() {},
    async sendAccountActivationEmail(_to, _name, url) {
      sent.emails.push(url)
    },
  }

  return {
    sent,
    deps: {
      delivery,
      emailReputation: {
        async check() {
          return { disposable: false }
        },
      },
    } satisfies AuthDeps,
  }
}

async function firstAvailableSlot() {
  const service = await prisma.service.findFirst({ where: { active: true } })
  const barber = await prisma.barberProfile.findFirst({ where: { active: true } })
  if (!service || !barber) throw new Error('seed missing')

  const today = parseISO(formatInTimeZone(new Date(), BUSINESS_TIMEZONE, 'yyyy-MM-dd'))

  for (let index = 0; index < 14; index += 1) {
    const date = format(addDays(today, index), 'yyyy-MM-dd')
    const availability = await getAvailability({ serviceId: service.id, barberId: barber.id, date })
    const slot = availability.slots.find((item) => item.available)
    if (slot) return { service, barber, slot }
  }

  throw new Error('no available slot')
}

async function createGuestOrder(customer: { name: string; email: string; phone: string }) {
  const { service, barber, slot } = await firstAvailableSlot()
  const order = await createOrder(
    {
      paymentMode: 'ON_SITE',
      customer,
      lines: [
        {
          kind: 'service',
          serviceId: service.id,
          barberId: barber.id,
          startAt: slot.startAt,
        },
      ],
      note: '',
    },
    null,
  )

  return { order, service, barber, slot }
}

async function cleanup(orderId: string | null, userIds: string[]): Promise<void> {
  if (orderId) {
    await prisma.notificationLog.deleteMany({ where: { orderId } })
    await prisma.appointment.deleteMany({ where: { orderId } })
    await prisma.order.deleteMany({ where: { id: orderId } })
  }

  if (userIds.length > 0) {
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.verificationToken.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  }
}

describe('guest checkout', () => {
  it('creates an unverified account and sends only the email activation for an email-only guest', async () => {
    const email = `guest.email.${suffix}@example.com`
    const { order } = await createGuestOrder({ name: 'Convidado Email', email, phone: '' })
    const userId = order.customerId ?? ''
    const { sent, deps } = makeDeps()

    try {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
      expect(user.passwordHash).toBeNull()
      expect(user.role).toBe('CUSTOMER')
      expect(user.email).toBe(email)
      expect(user.phone).toBeNull()
      expect(user.emailVerifiedAt).toBeNull()

      await sendAccountActivation(userId, { email, phone: null }, deps)
      expect(sent.emails).toHaveLength(1)
      expect(sent.otps).toHaveLength(0)
    } finally {
      await cleanup(order.id, [userId])
    }
  })

  it('sends only the WhatsApp activation for a phone-only guest', async () => {
    const phone = nextPhone()
    const { order } = await createGuestOrder({ name: 'Convidado Fone', email: '', phone })
    const userId = order.customerId ?? ''
    const { sent, deps } = makeDeps()

    try {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
      expect(user.passwordHash).toBeNull()
      expect(user.phone).toBe(phone)

      await sendAccountActivation(userId, { email: null, phone }, deps)
      expect(sent.otps).toHaveLength(1)
      expect(sent.otps[0]?.phone).toBe(phone)
      expect(sent.emails).toHaveLength(0)
    } finally {
      await cleanup(order.id, [userId])
    }
  })

  it('sends both activation channels when the guest supplies both contacts', async () => {
    const email = `guest.both.${suffix}@example.com`
    const phone = nextPhone()
    const { order } = await createGuestOrder({ name: 'Convidado Ambos', email, phone })
    const userId = order.customerId ?? ''
    const { sent, deps } = makeDeps()

    try {
      await sendAccountActivation(userId, { email, phone }, deps)
      expect(sent.emails).toHaveLength(1)
      expect(sent.otps).toHaveLength(1)
    } finally {
      await cleanup(order.id, [userId])
    }
  })

  it('links an existing account without overwriting its data', async () => {
    const email = `existing.${suffix}@example.com`
    const phone = nextPhone()
    const existing = await prisma.user.create({
      data: { name: 'Conta Existente', email, phone, role: 'CUSTOMER' },
    })

    let orderId: string | null = null
    try {
      const { order } = await createGuestOrder({ name: 'Outro Nome', email, phone: '' })
      orderId = order.id

      const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })
      expect(order.customerId).toBe(existing.id)
      expect(order.customerName).toBe('Conta Existente')
      expect(unchanged.name).toBe('Conta Existente')
      expect(unchanged.email).toBe(email)
      expect(unchanged.phone).toBe(phone)
    } finally {
      await cleanup(orderId, [existing.id])
    }
  })

  it('rejects when the email and phone belong to different accounts', async () => {
    const email = `conflict.email.${suffix}@example.com`
    const phone = nextPhone()
    const emailUser = await prisma.user.create({
      data: { name: 'Dono Email', email, role: 'CUSTOMER' },
    })
    const phoneUser = await prisma.user.create({
      data: { name: 'Dono Fone', phone, role: 'CUSTOMER' },
    })

    try {
      await expect(createGuestOrder({ name: 'Conflito', email, phone })).rejects.toMatchObject({
        code: 'contact_conflict',
      })

      const orders = await prisma.order.count({
        where: { customerId: { in: [emailUser.id, phoneUser.id] } },
      })
      expect(orders).toBe(0)
    } finally {
      await cleanup(null, [emailUser.id, phoneUser.id])
    }
  })

  it('sets the password and email verification through the activation token', async () => {
    const email = `activate.${suffix}@example.com`
    const { order } = await createGuestOrder({ name: 'Ativar Email', email, phone: '' })
    const userId = order.customerId ?? ''
    const { sent, deps } = makeDeps()

    try {
      await expect(loginUser(email, 'newsecret123')).rejects.toThrow('Contato ou senha inválidos.')

      await sendAccountActivation(userId, { email, phone: null }, deps)
      const token = new URL(sent.emails[0] ?? '').searchParams.get('token')
      expect(token).not.toBeNull()

      const activated = await activateAccountWithToken(token ?? '', 'newsecret123')
      expect(activated.emailVerifiedAt).not.toBeNull()

      await expect(loginUser(email, 'newsecret123')).resolves.toMatchObject({ id: userId })
    } finally {
      await cleanup(order.id, [userId])
    }
  })

  it('allows OTP login for a pending phone account only until a password is set', async () => {
    const phone = nextPhone()
    const { order } = await createGuestOrder({ name: 'Ativar Fone', email: '', phone })
    const userId = order.customerId ?? ''
    const { sent, deps } = makeDeps()

    try {
      await expect(loginUser(phone, 'newsecret123')).rejects.toThrow('Contato ou senha inválidos.')

      await sendAccountActivation(userId, { email: null, phone }, deps)
      const firstCode = sent.otps[0]?.code ?? ''
      await expect(verifyPhoneSignup(phone, firstCode)).resolves.toMatchObject({ id: userId })

      const second = makeDeps()
      await sendAccountActivation(userId, { email: null, phone }, second.deps)
      const secondCode = second.sent.otps[0]?.code ?? ''

      const activated = await activateAccountWithOtp(phone, secondCode, 'newsecret123')
      expect(activated.phoneVerifiedAt).not.toBeNull()
      await expect(loginUser(phone, 'newsecret123')).resolves.toMatchObject({ id: userId })

      const blocked = makeDeps()
      await requestPhoneLogin(phone, blocked.deps)
      expect(blocked.sent.otps).toHaveLength(0)
    } finally {
      await cleanup(order.id, [userId])
    }
  })
})
