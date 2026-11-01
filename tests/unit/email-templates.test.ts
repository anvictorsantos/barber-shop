import { describe, expect, it } from 'vitest'

import {
  renderPasswordResetEmail,
  renderVerificationEmail,
} from '@/lib/notifications/email/templates'

describe('email templates', () => {
  it('renders a verification email and escapes the name', () => {
    const rendered = renderVerificationEmail(
      '<Luiz>',
      'https://example.com/verificar?token=abc&next=1',
    )

    expect(rendered.subject).toContain('Confirme seu e-mail')
    expect(rendered.html).toContain('&lt;Luiz&gt;')
    expect(rendered.html).not.toContain('<Luiz>')
    expect(rendered.html).toContain('token=abc&amp;next=1')
    expect(rendered.text).toContain('https://example.com/verificar?token=abc&next=1')
  })

  it('renders a password reset email', () => {
    const rendered = renderPasswordResetEmail('João', 'https://example.com/redefinir?token=xyz')

    expect(rendered.subject).toContain('Redefina sua senha')
    expect(rendered.html).toContain('https://example.com/redefinir?token=xyz')
    expect(rendered.text).toContain('expira em 30 minutos')
  })
})
