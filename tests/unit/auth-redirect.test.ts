import { describe, expect, it } from 'vitest'

import { postAuthPath, safeNextPath } from '@/lib/auth/redirect'

describe('auth redirects', () => {
  it('rejects external and protocol-relative paths', () => {
    expect(safeNextPath('https://evil.example')).toBeNull()
    expect(safeNextPath('//evil.example')).toBeNull()
    expect(safeNextPath('/admin')).toBe('/admin')
  })

  it('sends each role to its home', () => {
    expect(postAuthPath('CUSTOMER')).toBe('/conta/agendamentos')
    expect(postAuthPath('OWNER')).toBe('/admin')
    expect(postAuthPath('BARBER')).toBe('/admin')
  })

  it('does not cross role boundaries', () => {
    expect(postAuthPath('CUSTOMER', '/admin')).toBe('/conta/agendamentos')
    expect(postAuthPath('OWNER', '/conta/perfil')).toBe('/admin')
    expect(postAuthPath('OWNER', '/admin/agenda')).toBe('/admin/agenda')
  })
})
