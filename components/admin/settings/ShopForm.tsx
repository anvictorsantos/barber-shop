'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Input'
import { updateShopAction } from '@/lib/settings/actions'
import type { ShopSettings } from '@/lib/settings/types'

export function ShopForm({ shop }: { shop: ShopSettings | null }) {
  const router = useRouter()
  const [name, setName] = useState(shop?.name ?? '')
  const [cnpj, setCnpj] = useState(shop?.cnpj ?? '')
  const [addressLine, setAddressLine] = useState(shop?.addressLine ?? '')
  const [city, setCity] = useState(shop?.city ?? '')
  const [state, setState] = useState(shop?.state ?? 'MG')
  const [postalCode, setPostalCode] = useState(shop?.postalCode ?? '')
  const [phone, setPhone] = useState(shop?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(shop?.whatsapp ?? '')
  const [email, setEmail] = useState(shop?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setPending(true)

    const result = await updateShopAction({
      name,
      cnpj,
      addressLine,
      city,
      state,
      postalCode,
      phone,
      whatsapp,
      email,
    })

    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSaved(true)
    router.refresh()
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-title font-bold text-text">Dados da barbearia</h2>

      <form
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}
        {saved ? <FormMessage tone="success">Dados salvos.</FormMessage> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome"
            htmlFor="shop-name"
          >
            <Input
              id="shop-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field
            label="CNPJ"
            htmlFor="shop-cnpj"
            hint="Opcional"
          >
            <Input
              id="shop-cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
            />
          </Field>
          <Field
            label="Endereço"
            htmlFor="shop-address"
          >
            <Input
              id="shop-address"
              required
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </Field>
          <Field
            label="Cidade"
            htmlFor="shop-city"
          >
            <Input
              id="shop-city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Field>
          <Field
            label="Estado"
            htmlFor="shop-state"
            hint="Sigla, ex: MG"
          >
            <Input
              id="shop-state"
              required
              maxLength={2}
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
            />
          </Field>
          <Field
            label="CEP"
            htmlFor="shop-postal"
            hint="Opcional"
          >
            <Input
              id="shop-postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </Field>
          <Field
            label="Telefone"
            htmlFor="shop-phone"
            hint="Opcional"
          >
            <Input
              id="shop-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field
            label="WhatsApp"
            htmlFor="shop-whatsapp"
          >
            <Input
              id="shop-whatsapp"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </Field>
          <Field
            label="E-mail de contato"
            htmlFor="shop-email"
            hint="Opcional"
          >
            <Input
              id="shop-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>

        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? 'Salvando…' : 'Salvar dados'}
        </Button>
      </form>
    </Card>
  )
}
