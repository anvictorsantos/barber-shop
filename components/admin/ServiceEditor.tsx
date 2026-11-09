'use client'

import { useState, type FormEvent } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { createServiceAction, updateServiceAction } from '@/lib/catalog/actions'
import { serviceCategoryLabels, serviceCategoryOrder } from '@/lib/catalog/labels'
import type { AdminService } from '@/lib/catalog/types'
import { formatBRLInput } from '@/lib/format/money'

import type { ServiceCategory } from '@prisma/client'

export function ServiceEditor({
  service,
  onClose,
  onSaved,
}: {
  service: AdminService | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(service?.name ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [category, setCategory] = useState<ServiceCategory>(service?.category ?? 'CORTE')
  const [durationMin, setDurationMin] = useState(service?.durationMin ?? 30)
  const [price, setPrice] = useState(service ? formatBRLInput(service.priceCents) : '')
  const [originalPrice, setOriginalPrice] = useState(
    service?.originalPriceCents ? formatBRLInput(service.originalPriceCents) : '',
  )
  const [promoLabel, setPromoLabel] = useState(service?.promoLabel ?? '')
  const [imageUrl, setImageUrl] = useState(service?.imageUrl ?? '')
  const [sortOrder, setSortOrder] = useState(service?.sortOrder ?? 0)
  const [active, setActive] = useState(service?.active ?? true)
  const [featured, setFeatured] = useState(service?.featured ?? false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const input = {
      name,
      description,
      category,
      durationMin,
      price,
      originalPrice,
      promoLabel,
      imageUrl,
      active,
      featured,
      sortOrder,
    }

    const result = service
      ? await updateServiceAction({ ...input, id: service.id })
      : await createServiceAction(input)

    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSaved()
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-title font-bold text-text">
          {service ? 'Editar serviço' : 'Novo serviço'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-caption font-semibold text-muted underline hover:text-text"
        >
          Fechar
        </button>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome"
            htmlFor="service-name"
          >
            <Input
              id="service-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field
            label="Categoria"
            htmlFor="service-category"
          >
            <Select
              id="service-category"
              value={category}
              onValueChange={(value) => setCategory(value as ServiceCategory)}
              options={serviceCategoryOrder.map((item) => ({
                label: serviceCategoryLabels[item],
                value: item,
              }))}
            />
          </Field>

          <Field
            label="Duração (min)"
            htmlFor="service-duration"
          >
            <Input
              id="service-duration"
              type="number"
              min={10}
              max={90}
              required
              value={durationMin}
              onChange={(event) => setDurationMin(Number(event.target.value))}
            />
          </Field>

          <Field
            label="Preço"
            htmlFor="service-price"
            hint="Formato: 60,00"
          >
            <Input
              id="service-price"
              inputMode="decimal"
              required
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </Field>

          <Field
            label="Preço original"
            htmlFor="service-original"
            hint="Opcional"
          >
            <Input
              id="service-original"
              inputMode="decimal"
              value={originalPrice}
              onChange={(event) => setOriginalPrice(event.target.value)}
            />
          </Field>

          <Field
            label="Selo promocional"
            htmlFor="service-promo"
            hint="Opcional"
          >
            <Input
              id="service-promo"
              maxLength={20}
              value={promoLabel}
              onChange={(event) => setPromoLabel(event.target.value)}
            />
          </Field>

          <Field
            label="Ordem no catálogo"
            htmlFor="service-order"
          >
            <Input
              id="service-order"
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
            />
          </Field>

          <Field
            label="URL da imagem"
            htmlFor="service-image"
            hint="Opcional"
          >
            <Input
              id="service-image"
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Descrição"
          htmlFor="service-description"
        >
          <Textarea
            id="service-description"
            required
            maxLength={1200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-caption font-semibold text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Ativo no catálogo
          </label>

          <label className="flex items-center gap-2 text-caption font-semibold text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
            />
            Destaque no topo
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={pending}
          >
            {pending ? 'Salvando…' : 'Salvar serviço'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
