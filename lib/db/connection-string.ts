const WEAK_SSL_MODES = new Set(['prefer', 'require', 'verify-ca'])

// pg 8 treats these as verify-full; name it explicitly so pg 9 keeps verifying the certificate.
export function normalizeSslMode(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString

  const url = new URL(connectionString)
  const mode = url.searchParams.get('sslmode')
  if (!mode || !WEAK_SSL_MODES.has(mode) || url.searchParams.has('uselibpqcompat')) {
    return connectionString
  }

  url.searchParams.set('sslmode', 'verify-full')
  return url.toString()
}
