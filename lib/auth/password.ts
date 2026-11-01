import { hash, verify } from '@node-rs/argon2'

// Argon2id is the package default; these are the documented cost parameters.
const HASH_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS)
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}
