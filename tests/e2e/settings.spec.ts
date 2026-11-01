import { expect, test } from '@playwright/test'

const seeded = process.env.E2E_SEEDED === 'true'

test.describe('settings', () => {
  test.beforeEach(() => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
  })

  test('renders the owner settings tabs', async ({ page }) => {
    const login = await page.request.post('/api/auth/login', {
      data: { identifier: 'luiz@barbeariadoluiz.com.br', password: 'demo1234' },
    })
    expect(login.ok()).toBeTruthy()

    await page.goto('/admin/configuracoes')
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()

    await page.getByRole('button', { name: 'Horários' }).click()
    await expect(page.getByRole('heading', { name: 'Horários de funcionamento' })).toBeVisible()

    await page.getByRole('button', { name: 'Equipe' }).click()
    await expect(page.getByRole('heading', { name: 'Equipe' })).toBeVisible()

    await page.getByRole('button', { name: 'Bloqueios' }).click()
    await expect(page.getByRole('heading', { name: 'Bloqueios ativos' })).toBeVisible()
  })
})
