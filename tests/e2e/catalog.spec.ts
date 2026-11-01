import { expect, test } from '@playwright/test'

const seeded = process.env.E2E_SEEDED === 'true'

test.describe('catalog', () => {
  test.beforeEach(() => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
  })

  test('opens a service detail from the catalog', async ({ page }) => {
    await page.goto('/servicos')
    await expect(page.getByRole('heading', { name: 'Serviços' })).toBeVisible()
    await expect(page.getByText('Corte + Barba').first()).toBeVisible()

    await page
      .getByRole('link', { name: /Corte \+ Barba/ })
      .first()
      .click()
    await expect(page).toHaveURL('/servicos/corte-barba')
    await expect(page.getByRole('link', { name: 'Agendar este serviço' })).toBeVisible()
  })

  test('renders the store with stock status', async ({ page }) => {
    await page.goto('/loja')
    await expect(page.getByRole('heading', { name: 'Loja' })).toBeVisible()
    await expect(page.getByText('Pomada Modeladora Matte')).toBeVisible()
    await expect(page.getByText('Em estoque').first()).toBeVisible()
  })
})
