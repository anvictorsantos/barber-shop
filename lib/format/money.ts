export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function centsToReais(cents: number): number {
  return cents / 100
}

export function formatBRLInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function parseBRLToCents(value: string): number | null {
  let normalized = value.replace(/[^\d,.-]/g, '')
  if (!normalized) return null

  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  }

  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) return null

  return Math.round(amount * 100)
}
