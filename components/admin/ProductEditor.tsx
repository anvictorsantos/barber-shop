'use client'

import { useState, type FormEvent } from 'react'

import { ImageField } from '@/components/admin/ImageField'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { createProductAction, updateProductAction } from '@/lib/catalog/actions'
import type { AdminProduct } from '@/lib/catalog/types'
import { formatBRLInput } from '@/lib/format/money'

export function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? formatBRLInput(product.priceCents) : '')
  const [stock, setStock] = useState(product?.stock ?? 0)
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [active, setActive] = useState(product?.active ?? true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const input = { name, description, price, stock, imageUrl, active }
    const result = product
      ? await updateProductAction({ ...input, id: product.id })
      : await createProductAction(input)

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
          {product ? 'Editar produto' : 'Novo produto'}
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
            htmlFor="product-name"
          >
            <Input
              id="product-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field
            label="Preço"
            htmlFor="product-price"
            hint="Formato: 35,00"
          >
            <Input
              id="product-price"
              inputMode="decimal"
              required
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </Field>

          <Field
            label="Estoque"
            htmlFor="product-stock"
            hint="Unidades disponíveis"
          >
            <Input
              id="product-stock"
              type="number"
              min={0}
              required
              value={stock}
              onChange={(event) => setStock(Number(event.target.value))}
            />
          </Field>

          <ImageField
            id="product-image"
            label="URL da imagem"
            hint="Opcional"
            value={imageUrl}
            onChange={setImageUrl}
          />
        </div>

        <Field
          label="Descrição"
          htmlFor="product-description"
        >
          <Textarea
            id="product-description"
            required
            maxLength={1200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <label className="flex items-center gap-2 text-caption font-semibold text-muted">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--primary)]"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Ativo na loja
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={pending}
          >
            {pending ? 'Salvando…' : 'Salvar produto'}
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
