import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000
export const OTP_TTL_MS = 10 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

export function createOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function hashesMatch(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, 'hex')
  const right = Buffer.from(rightHex, 'hex')
  if (left.length !== right.length || left.length === 0) return false
  return timingSafeEqual(left, right)
}
