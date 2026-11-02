import { expect, test } from '@playwright/test'

const demo = process.env.E2E_DEMO === 'true'

test.describe('demo mode', () => {
  test.beforeEach(() => {
    test.skip(!demo, 'Requires DEMO_MODE=true. Set E2E_DEMO=true to run.')
  })

  test('one-click logins reach the customer and owner areas', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.getByText('Acesso de demonstração')).toBeVisible()

    await page.getByRole('button', { name: 'Entrar como cliente' }).click()
    await expect(page).toHaveURL('/conta/agendamentos')
    await expect(page.getByRole('heading', { name: 'Meus Agendamentos' })).toBeVisible()

    await page.request.post('/api/auth/logout')
    await page.goto('/entrar')

    await page.getByRole('button', { name: 'Entrar como dono' }).click()
    await expect(page).toHaveURL('/admin')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
