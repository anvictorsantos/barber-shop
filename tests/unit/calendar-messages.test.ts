import { describe, expect, it } from 'vitest'

import { buildAppointmentIcs, buildGoogleCalendarUrl } from '@/lib/calendar/ics'
import { renderAppointmentEmail, renderAppointmentWhatsApp } from '@/lib/notifications/messages'

const startAt = new Date('2026-11-05T15:00:00.000Z')
const endAt = new Date('2026-11-05T15:40:00.000Z')

const calendarInput = {
  uid: 'appointment-1@barbearia-do-luiz',
  title: 'Corte + Barba — Barbearia do Luiz',
  description: 'Corte + Barba com Luiz Silva',
  location: 'Barbearia do Luiz, Rua A, 10, Belo Horizonte/MG',
  startAt,
  endAt,
  organizerName: 'Barbearia do Luiz',
  organizerEmail: 'contato@example.com',
}

const messageContext = {
  customerName: 'Maria',
  serviceName: 'Corte + Barba',
  barberName: 'Luiz Silva',
  startAt,
  shopName: 'Barbearia do Luiz',
  shopAddress: 'Rua A, 10, Belo Horizonte/MG',
  orderCode: 'BL-12345',
  orderUrl: 'https://example.com/pedido/BL-12345',
}

describe('calendar exports', () => {
  it('builds a valid google calendar template link', () => {
    const url = buildGoogleCalendarUrl(calendarInput)
    const params = new URL(url).searchParams

    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true)
    expect(params.get('action')).toBe('TEMPLATE')
    expect(params.get('dates')).toBe('20261105T150000Z/20261105T154000Z')
    expect(params.get('text')).toContain('Corte + Barba')
  })

  it('builds an ics event in utc', () => {
    const ics = buildAppointmentIcs(calendarInput)

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('DTSTART:20261105T150000Z')
    expect(ics).toContain('DTEND:20261105T154000Z')
    expect(ics).toContain('UID:appointment-1@barbearia-do-luiz')
    expect(ics).toContain('SUMMARY:Corte + Barba')
  })
})

describe('appointment messages', () => {
  it('renders confirmation copy with local time and calendar link', () => {
    const email = renderAppointmentEmail('BOOKING_CONFIRMATION', {
      ...messageContext,
      calendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
    })

    expect(email).not.toBeNull()
    expect(email?.subject).toContain('Agendamento confirmado')
    expect(email?.text).toContain('05/11/2026 às 12:00')
    expect(email?.text).toContain('Google Agenda')
    expect(email?.html).toContain('Agendamento confirmado')
  })

  it('renders reminder whatsapp text', () => {
    const text = renderAppointmentWhatsApp('REMINDER', messageContext)

    expect(text).toContain('Lembrete')
    expect(text).toContain('Corte + Barba')
    expect(text).toContain('05/11/2026 às 12:00')
  })

  it('returns null for kinds that are not appointment messages', () => {
    expect(renderAppointmentEmail('NO_SHOW_BLOCK', messageContext)).toBeNull()
    expect(renderAppointmentWhatsApp('OTP', messageContext)).toBeNull()
  })
})
