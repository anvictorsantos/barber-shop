import { expect, test } from '@playwright/test'

import { e2ePassword } from './credentials'

import type { Page } from '@playwright/test'

const seeded = process.env.E2E_SEEDED === 'true'

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

async function acceptConsent(page: Page) {
  const accept = page.getByRole('button', { name: 'Aceitar' })
  if ((await accept.count()) > 0) await accept.click()
}

test.describe('accessibility and layout', () => {
  test.beforeEach(() => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
  })

  test('public and customer screens fit a phone and expose a skip link', async ({ page }) => {
    await page.request.post('/api/auth/login', {
      data: { identifier: 'joao.silva@example.com', password: e2ePassword() },
    })
    await page.setViewportSize({ width: 390, height: 844 })

    for (const path of ['/', '/servicos', '/loja', '/carrinho', '/conta/agendamentos']) {
      await page.goto(path)
      await acceptConsent(page)
      await expectNoOverflow(page)
      await expect(page.locator('#main-content')).toHaveCount(1)
      expect(await page.locator('img:not([alt])').count()).toBe(0)
    }

    await page.goto('/servicos')
    await acceptConsent(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  })

  test('admin screens fit a desktop and expose a skip link', async ({ page }) => {
    await page.request.post('/api/auth/login', {
      data: { identifier: 'luiz@barbeariadoluiz.com.br', password: e2ePassword() },
    })
    await page.setViewportSize({ width: 1440, height: 900 })

    for (const path of ['/admin', '/admin/agenda', '/admin/financeiro', '/admin/clientes']) {
      await page.goto(path)
      await expectNoOverflow(page)
      await expect(page.locator('#main-content')).toHaveCount(1)
    }

    await page.goto('/admin')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  })
})
