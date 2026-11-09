import { createHmac } from 'node:crypto'

import { cookies } from 'next/headers'

import { createOpaqueToken } from '@/lib/auth/tokens'
import { prisma } from '@/lib/db/prisma'
import { getServerEnv } from '@/lib/env'

import type { Prisma, Role } from '@prisma/client'

export const SESSION_COOKIE = 'bl_session'
const DAY_MS = 24 * 60 * 60 * 1000
const STAFF_SESSION_TTL_MS = 7 * DAY_MS
const CUSTOMER_SESSION_TTL_MS = 30 * DAY_MS
const SESSION_REFRESH_AFTER_MS = 24 * 60 * 60 * 1000

function sessionTtlMs(role: Role): number {
  return role === 'CUSTOMER' ? CUSTOMER_SESSION_TTL_MS : STAFF_SESSION_TTL_MS
}

const sessionUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerifiedAt: true,
  phone: true,
  phoneVerifiedAt: true,
  role: true,
  noShowCount: true,
  bookingBlocked: true,
} as const

export type SessionUser = Prisma.UserGetPayload<{ select: typeof sessionUserSelect }>

function hashSessionToken(token: string): string {
  return createHmac('sha256', getServerEnv().SESSION_SECRET).update(token).digest('hex')
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  }
}

export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<string> {
  const token = createOpaqueToken()
  const tokenHash = hashSessionToken(token)
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true },
  })
  const ttlMs = sessionTtlMs(user.role)
  const expiresAt = new Date(Date.now() + ttlMs)

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  })

  const store = await cookies()
  store.set(SESSION_COOKIE, token, cookieOptions(expiresAt))
  return token
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const tokenHash = hashSessionToken(token)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      lastUsedAt: true,
      user: { select: sessionUserSelect },
    },
  })

  if (!session) return null

  const now = Date.now()
  const cap = session.createdAt.getTime() + sessionTtlMs(session.user.role)
  if (session.expiresAt.getTime() <= now || cap <= now) {
    await prisma.session.delete({ where: { id: session.id } })
    store.delete(SESSION_COOKIE)
    return null
  }

  if (now - session.lastUsedAt.getTime() > SESSION_REFRESH_AFTER_MS) {
    const ttlMs = sessionTtlMs(session.user.role)
    const expiresAt = new Date(Math.min(now + ttlMs, cap))
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date(now), expiresAt },
    })
    store.set(SESSION_COOKIE, token, cookieOptions(expiresAt))
  }

  return session.user
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } })
  }

  store.delete(SESSION_COOKIE)
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } })
}

export async function getCurrentSessionId(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: { id: true },
  })
  return session?.id ?? null
}

export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId, userId } })
}

export async function revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId, id: { not: currentSessionId } } })
}
