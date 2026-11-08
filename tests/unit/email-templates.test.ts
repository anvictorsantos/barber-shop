import { describe, expect, it } from 'vitest'

import {
  renderAccountActivationEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
} from '@/lib/notifications/email/templates'
import { renderAppointmentEmail } from '@/lib/notifications/messages'

describe('email templates', () => {
  it('renders a verification email and escapes the name', () => {
    const rendered = renderVerificationEmail(
      '<Luiz>',
      'luiz@example.com',
      'https://example.com/verificar?token=abc&next=1',
    )

    expect(rendered.subject).toContain('Confirme seu e-mail')
    expect(rendered.html).toContain('&lt;Luiz&gt;')
    expect(rendered.html).not.toContain('<Luiz>')
    expect(rendered.html).toContain('token=abc&amp;next=1')
    expect(rendered.html).toContain('/brand/logo.png')
    expect(rendered.html).toContain('24 horas')
    expect(rendered.text).toContain('https://example.com/verificar?token=abc&next=1')
  })

  it('renders a password reset email', () => {
    const rendered = renderPasswordResetEmail(
      'João',
      'joao@example.com',
      'https://example.com/redefinir?token=xyz',
    )

    expect(rendered.subject).toContain('Redefina sua senha')
    expect(rendered.html).toContain('https://example.com/redefinir?token=xyz')
    expect(rendered.html).toContain('joao@example.com')
    expect(rendered.text).toContain('expira em 30 minutos')
  })

  it('renders an account activation email', () => {
    const rendered = renderAccountActivationEmail(
      'Maria',
      'maria@example.com',
      'https://example.com/ativar-conta?token=abc',
    )

    expect(rendered.subject).toContain('Defina sua senha')
    expect(rendered.html).toContain('https://example.com/ativar-conta?token=abc')
    expect(rendered.html).toContain('maria@example.com')
    expect(rendered.text).toContain('24 horas')
  })

  it('renders the appointment as a ticket and escapes the customer name', () => {
    const email = renderAppointmentEmail('BOOKING_CONFIRMATION', {
      customerName: 'João <Silva>',
      serviceName: 'Corte + Barba',
      barberName: 'Luiz Silva',
      startAt: new Date('2026-11-12T13:00:00Z'),
      shopName: 'Barbearia do Luiz',
      shopAddress: 'Rua dos Geólogos, 698',
      orderCode: 'BL-1022',
      orderUrl: 'https://example.com/pedido/BL-1022',
      calendarLinks: [
        {
          label: 'Google Agenda',
          url: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
        },
        {
          label: 'Outlook',
          url: 'https://outlook.live.com/calendar/0/deeplink/compose?rru=addevent',
        },
      ],
    })

    expect(email).not.toBeNull()
    expect(email?.html).toContain('João &lt;Silva&gt;')
    expect(email?.html).not.toContain('<Silva>')
    expect(email?.html).toContain('Corte + Barba')
    expect(email?.html).toContain('Luiz Silva')
    expect(email?.html).toContain('Adicionar à sua agenda:')
    expect(email?.html).toContain('Outlook')
    expect(email?.html).toContain('#BL-1022')
    expect(email?.text).toContain('Serviço: Corte + Barba')
  })

  it('omits the calendar link and keeps the reason on a cancellation', () => {
    const email = renderAppointmentEmail('CANCELED', {
      customerName: 'João',
      serviceName: 'Corte + Barba',
      barberName: 'Luiz Silva',
      startAt: new Date('2026-11-12T13:00:00Z'),
      shopName: 'Barbearia do Luiz',
      shopAddress: 'Rua dos Geólogos, 698',
      orderCode: 'BL-1022',
      orderUrl: 'https://example.com/pedido/BL-1022',
      reason: 'Imprevisto',
    })

    expect(email?.html).toContain('Motivo: Imprevisto.')
    expect(email?.html).not.toContain('Adicionar à sua agenda:')
  })
})
