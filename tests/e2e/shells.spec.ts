import { expect, test } from '@playwright/test'

const seeded = process.env.E2E_SEEDED === 'true'

test.describe('account shells', () => {
  test.beforeEach(() => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
  })

  test('owner shell at 1440', async ({ page }) => {
    const login = await page.request.post('/api/auth/login', {
      data: { identifier: 'luiz@barbeariadoluiz.com.br', password: 'demo1234' },
    })
    expect(login.ok()).toBeTruthy()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Navegação administrativa' })).toBeVisible()
  })

  test('customer shell at 390', async ({ page }) => {
    const login = await page.request.post('/api/auth/login', {
      data: { identifier: 'joao.silva@example.com', password: 'demo1234' },
    })
    expect(login.ok()).toBeTruthy()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/conta/agendamentos')
    await expect(page.getByRole('heading', { name: 'Meus Agendamentos' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Navegação da conta' })).toBeVisible()
  })
})
