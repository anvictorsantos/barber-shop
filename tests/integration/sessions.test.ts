import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { revokeOtherSessions, revokeSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const emailA = `sessions-a-${suffix}@example.com`
const emailB = `sessions-b-${suffix}@example.com`

let userA: string
let userB: string

function token(label: string): string {
  return `${suffix}-${label}`
}

async function createSessionRow(userId: string, label: string): Promise<string> {
  const session = await prisma.session.create({
    data: {
      tokenHash: token(label),
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      ip: '127.0.0.1',
      userAgent: 'vitest',
    },
    select: { id: true },
  })
  return session.id
}

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({ data: { name: 'Sessions A', email: emailA }, select: { id: true } }),
    prisma.user.create({ data: { name: 'Sessions B', email: emailB }, select: { id: true } }),
  ])
  userA = a.id
  userB = b.id
})

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { in: [emailA, emailB] } },
    select: { id: true },
  })
  const ids = users.map((user) => user.id)
  await prisma.session.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('session revocation', () => {
  it('will not revoke a session that belongs to another user', async () => {
    const foreign = await createSessionRow(userB, 'foreign')

    await revokeSession(userA, foreign)

    expect(await prisma.session.findUnique({ where: { id: foreign } })).not.toBeNull()
  })

  it('revokes a single own session and keeps the others', async () => {
    const first = await createSessionRow(userA, 'one')
    const second = await createSessionRow(userA, 'two')

    await revokeSession(userA, first)

    expect(await prisma.session.findUnique({ where: { id: first } })).toBeNull()
    expect(await prisma.session.findUnique({ where: { id: second } })).not.toBeNull()
  })

  it('revokes everything except the current session', async () => {
    await prisma.session.deleteMany({ where: { userId: userA } })
    const current = await createSessionRow(userA, 'current')
    await createSessionRow(userA, 'extra-a')
    await createSessionRow(userA, 'extra-b')

    await revokeOtherSessions(userA, current)

    const remaining = await prisma.session.findMany({ where: { userId: userA } })
    expect(remaining.map((session) => session.id)).toEqual([current])
  })
})
