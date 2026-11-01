import { createHmac } from 'node:crypto'

import { cookies } from 'next/headers'

import { createOpaqueToken } from '@/lib/auth/tokens'
import { prisma } from '@/lib/db/prisma'
import { getServerEnv } from '@/lib/env'

import type { Prisma } from '@prisma/client'

export const SESSION_COOKIE = 'bl_session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const SESSION_REFRESH_AFTER_MS = 24 * 60 * 60 * 1000

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
  meta: { ip?: string; userAgent?: string } = {},
): Promise<string> {
  const token = createOpaqueToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

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
      lastUsedAt: true,
      user: { select: sessionUserSelect },
    },
  })

  if (!session) return null

  const now = Date.now()
  if (session.expiresAt.getTime() <= now) {
    await prisma.session.delete({ where: { id: session.id } })
    store.delete(SESSION_COOKIE)
    return null
  }

  if (now - session.lastUsedAt.getTime() > SESSION_REFRESH_AFTER_MS) {
    const expiresAt = new Date(now + SESSION_TTL_MS)
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
