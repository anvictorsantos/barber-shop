import { afterAll, describe, expect, it } from 'vitest'

import { prisma } from '@/lib/db/prisma'
import {
  createBarber,
  createTimeBlock,
  deleteTimeBlock,
  toggleBarber,
  updateBarber,
} from '@/lib/settings/admin'

const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
const barberEmail = `barber.settings.${suffix}@example.com`
const blockLabel = `Bloqueio E2E ${suffix}`

let barberId = ''
let userId = ''
let blockId = ''

afterAll(async () => {
  if (blockId) await prisma.timeBlock.deleteMany({ where: { id: blockId } })
  if (barberId) await prisma.barberProfile.deleteMany({ where: { id: barberId } })
  if (userId) {
    await prisma.session.deleteMany({ where: { userId } })
    await prisma.verificationToken.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  }
})

describe('settings admin operations', () => {
  it('creates, edits, and toggles a barber', async () => {
    const profile = await createBarber({
      name: 'Barbeiro E2E',
      email: barberEmail,
      phone: '',
      password: 'secret123',
      displayName: 'Barbeiro E2E',
      title: 'Barbeiro',
      avatarUrl: '',
    })
    barberId = profile.id
    userId = profile.userId

    expect(profile.active).toBe(true)
    expect(profile.displayName).toBe('Barbeiro E2E')

    const updated = await updateBarber({
      id: profile.id,
      name: 'Barbeiro E2E Atualizado',
      displayName: 'Barbeiro E2E Atualizado',
      title: 'Master Barber',
      avatarUrl: '',
      active: true,
    })
    expect(updated.title).toBe('Master Barber')

    const toggled = await toggleBarber({ id: profile.id, active: false })
    expect(toggled.active).toBe(false)
  })

  it('creates and deletes a time block', async () => {
    const barber = await prisma.barberProfile.findFirst({ where: { active: true } })
    expect(barber).not.toBeNull()
    if (!barber) return

    const block = await createTimeBlock({
      barberId: barber.id,
      label: blockLabel,
      recurring: true,
      weekday: 3,
      start: '15:00',
      end: '16:00',
    })
    blockId = block.id

    expect(block.startMinute).toBe(900)
    expect(block.endMinute).toBe(960)

    await deleteTimeBlock({ id: block.id })
    blockId = ''

    const missing = await prisma.timeBlock.findUnique({ where: { id: block.id } })
    expect(missing).toBeNull()
  })
})
