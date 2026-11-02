import { expect, test } from '@playwright/test'

test('health endpoint answers', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()

  const body = (await response.json()) as { status: string; service: string }
  expect(body.status).toBe('ok')
  expect(body.service).toBe('barbearia-do-luiz')
})

test('landing renders the brand', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /BARBEARIA DO LUIZ/i }).first()).toBeVisible()
})
