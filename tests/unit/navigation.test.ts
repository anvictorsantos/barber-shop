import { describe, expect, it } from 'vitest'

import { adminNavFor, customerNavItems } from '@/lib/navigation'

describe('navigation scoping', () => {
  it('shows finance and settings to the owner', () => {
    const hrefs = adminNavFor('OWNER').map((item) => item.href)
    expect(hrefs).toContain('/admin/financeiro')
    expect(hrefs).toContain('/admin/configuracoes')
    expect(hrefs).toContain('/admin/catalogo')
  })

  it('hides owner-only admin sections from a barber', () => {
    const hrefs = adminNavFor('BARBER').map((item) => item.href)
    expect(hrefs).toContain('/admin')
    expect(hrefs).toContain('/admin/agenda')
    expect(hrefs).not.toContain('/admin/financeiro')
    expect(hrefs).not.toContain('/admin/configuracoes')
    expect(hrefs).not.toContain('/admin/catalogo')
  })

  it('keeps the customer bottom nav to four items', () => {
    expect(customerNavItems).toHaveLength(4)
  })
})
