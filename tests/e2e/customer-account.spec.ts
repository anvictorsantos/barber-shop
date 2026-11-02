import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

const seeded = process.env.E2E_SEEDED === 'true'

async function acceptConsent(page: Page) {
  const accept = page.getByRole('button', { name: 'Aceitar' })
  if ((await accept.count()) > 0) await accept.click()
}

test.describe('customer account', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
    const login = await page.request.post('/api/auth/login', {
      data: { identifier: 'joao.silva@example.com', password: 'demo1234' },
    })
    expect(login.ok()).toBeTruthy()
  })

  test('renders appointments, history, favorites, and profile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto('/conta/agendamentos')
    await expect(page.getByRole('heading', { name: 'Meus Agendamentos' })).toBeVisible()

    await page.goto('/conta/historico')
    await expect(page.getByRole('heading', { name: 'Histórico' })).toBeVisible()

    await page.goto('/conta/favoritos')
    await expect(page.getByRole('heading', { name: 'Favoritos', exact: true })).toBeVisible()

    await page.goto('/conta/perfil')
    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible()
    await expect(page.getByText('Dados Pessoais')).toBeVisible()
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible()
  })

  test('persists a service favorite through a reload', async ({ page }) => {
    await page.goto('/servicos/corte-barba')
    await acceptConsent(page)

    const save = page.getByRole('button', { name: 'Salvar Corte + Barba nos favoritos' })
    const remove = page.getByRole('button', { name: 'Remover Corte + Barba dos favoritos' })

    if ((await remove.count()) > 0) {
      await remove.click()
      await expect(save).toBeVisible()
    }

    await save.click()
    await expect(remove).toBeVisible()

    await page.reload()
    await acceptConsent(page)
    await expect(remove).toBeVisible()

    await remove.click()
    await expect(save).toBeVisible()
  })
})
