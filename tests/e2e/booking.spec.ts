import { expect, test } from '@playwright/test'
import { addDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

const seeded = process.env.E2E_SEEDED === 'true'

test.describe('booking', () => {
  test.beforeEach(() => {
    test.skip(!seeded, 'Requires a seeded database. Set E2E_SEEDED=true after db:seed.')
  })

  test('guest books a slot into the cart', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/servicos/corte-barba')
    await page.getByRole('button', { name: 'Aceitar' }).click()
    await page.getByRole('link', { name: 'Agendar este serviço' }).click()
    await expect(page).toHaveURL(/\/agendar\/.+\/profissional/)

    const serviceId = new URL(page.url()).pathname.split('/')[2]
    if (!serviceId) throw new Error('missing service id')
    await page.getByRole('link', { name: 'Continuar para horário' }).click()
    await expect(page).toHaveURL(/\/agendar\/.+\/horario\?barberId=/)

    const url = new URL(page.url())
    const barberId = url.searchParams.get('barberId')
    expect(barberId).toBeTruthy()

    const today = parseISO(formatInTimeZone(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'))
    let chosenDate: Date | null = null

    for (let index = 0; index < 8; index += 1) {
      const candidate = addDays(today, index)
      const response = await page.request.get(
        `/api/availability?serviceId=${encodeURIComponent(serviceId)}&barberId=${encodeURIComponent(barberId ?? '')}&date=${format(candidate, 'yyyy-MM-dd')}`,
      )
      if (!response.ok()) continue

      const body = (await response.json()) as { slots?: { available: boolean }[] }
      if (body.slots?.some((slot) => slot.available)) {
        chosenDate = candidate
        break
      }
    }

    expect(chosenDate).not.toBeNull()
    if (!chosenDate) return

    if (
      format(chosenDate, 'yyyy-MM') !== format(today, 'yyyy-MM') &&
      chosenDate.getTime() > today.getTime()
    ) {
      await page.getByRole('button', { name: 'Próximo mês' }).click()
    }

    await page
      .getByRole('button', {
        name: format(chosenDate, "d 'de' MMMM", { locale: ptBR }),
        exact: true,
      })
      .click()

    await expect(page.getByRole('radiogroup', { name: 'Horários disponíveis' })).toBeVisible()
    await page.getByRole('radio').first().click()
    await page.getByRole('link', { name: 'Continuar' }).click()

    await expect(page.getByRole('heading', { name: 'Resumo do Agendamento' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar e adicionar ao carrinho' }).click()

    await expect(page).toHaveURL('/carrinho')
    await expect(page.getByRole('heading', { name: 'Corte + Barba' })).toBeVisible()
    await expect(page.getByText('Finalizar pedido')).toBeVisible()

    await page.getByRole('button', { name: 'Remover Corte + Barba' }).click()
    await expect(page.getByText('Carrinho vazio')).toBeVisible()
  })
})
