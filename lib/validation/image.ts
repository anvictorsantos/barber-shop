import { z } from 'zod'

function isImageUrl(value: string): boolean {
  if (!value) return true
  if (value.startsWith('/') && !value.startsWith('//')) return true
  if (!URL.canParse(value)) return false

  const { protocol } = new URL(value)
  return protocol === 'http:' || protocol === 'https:'
}

export const imageUrlSchema = z
  .string()
  .trim()
  .refine(isImageUrl, 'URL de imagem inválida.')
  .optional()
  .default('')
