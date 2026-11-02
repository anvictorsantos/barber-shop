import { expect, test } from '@playwright/test'

const seeded = process.env.E2E_SEEDED === 'true'

test.describe('admin agenda', () => {
  test.beforeEach(() => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
  })

  test('owner opens the day agenda and the manual booking form', async ({ page }) => {
    const login = await page.request.post('/api/auth/login', {
      data: { identifier: 'luiz@barbeariadoluiz.com.br', password: 'demo1234' },
    })
    expect(login.ok()).toBeTruthy()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/admin/agenda')
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
    await expect(page.getByLabel('Filtrar por profissional')).toBeVisible()

    await page.getByRole('button', { name: 'Novo agendamento' }).click()
    await expect(page.getByRole('heading', { name: 'Novo agendamento' })).toBeVisible()
    await expect(page.getByLabel('Serviço')).toBeVisible()
    await expect(page.getByLabel('Profissional', { exact: true })).toBeVisible()
  })
})
