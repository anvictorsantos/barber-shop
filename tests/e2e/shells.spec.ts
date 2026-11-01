import { expect, test } from '@playwright/test'

const seeded = process.env.E2E_SEEDED === 'true'

test.describe('account shells', () => {
  test.beforeEach(() => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
  })

  test('login form reaches admin', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel('Telefone ou e-mail').fill('luiz@barbeariadoluiz.com.br')
    await page.getByLabel('Senha').fill('demo1234')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
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
