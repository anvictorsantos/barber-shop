import { expect, test } from '@playwright/test'

const seeded = process.env.E2E_SEEDED === 'true'

test.describe('admin panel', () => {
  test.beforeEach(() => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
  })

  test('owner dashboard, finance, and clients render', async ({ page }) => {
    const login = await page.request.post('/api/auth/login', {
      data: { identifier: 'luiz@barbeariadoluiz.com.br', password: 'demo1234' },
    })
    expect(login.ok()).toBeTruthy()

    await page.setViewportSize({ width: 1440, height: 900 })

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Receita — 14 dias')).toBeVisible()

    await page.goto('/admin/financeiro')
    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
    await expect(page.getByText('Receita por dia')).toBeVisible()
    await expect(page.getByText('Por forma de pagamento')).toBeVisible()

    await page.goto('/admin/clientes')
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible()
    await expect(page.getByLabel('Buscar clientes')).toBeVisible()
    await page.getByLabel('Buscar clientes').fill('joao')
    await page.getByRole('button', { name: 'Buscar' }).click()
    await expect(page.getByRole('link', { name: 'João Silva' })).toBeVisible()
  })
})
