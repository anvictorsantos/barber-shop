'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { updateProfileAction } from '@/lib/customer/actions'

interface ProfileValues {
  name: string
  phone: string
  cpf: string
  birthDate: string
  addressLine: string
  city: string
  state: string
  postalCode: string
}

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function update<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  async function submit() {
    setPending(true)
    setError(null)
    const result = await updateProfileAction(values)
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSaved(true)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Nome"
          htmlFor="profile-name"
        >
          <Input
            id="profile-name"
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            autoComplete="name"
          />
        </Field>

        <Field
          label="WhatsApp"
          htmlFor="profile-phone"
          hint="Com DDI. Alterar exige nova verificação."
        >
          <Input
            id="profile-phone"
            type="tel"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
          />
        </Field>

        <Field
          label="CPF"
          htmlFor="profile-cpf"
        >
          <Input
            id="profile-cpf"
            value={values.cpf}
            onChange={(event) => update('cpf', event.target.value)}
            inputMode="numeric"
          />
        </Field>

        <Field
          label="Nascimento"
          htmlFor="profile-birth"
        >
          <Input
            id="profile-birth"
            type="date"
            value={values.birthDate}
            onChange={(event) => update('birthDate', event.target.value)}
          />
        </Field>

        <Field
          label="Endereço"
          htmlFor="profile-address"
        >
          <Input
            id="profile-address"
            value={values.addressLine}
            onChange={(event) => update('addressLine', event.target.value)}
            autoComplete="street-address"
          />
        </Field>

        <Field
          label="Cidade"
          htmlFor="profile-city"
        >
          <Input
            id="profile-city"
            value={values.city}
            onChange={(event) => update('city', event.target.value)}
            autoComplete="address-level2"
          />
        </Field>

        <Field
          label="UF"
          htmlFor="profile-state"
        >
          <Input
            id="profile-state"
            value={values.state}
            maxLength={2}
            onChange={(event) => update('state', event.target.value.toUpperCase())}
            autoComplete="address-level1"
          />
        </Field>

        <Field
          label="CEP"
          htmlFor="profile-cep"
        >
          <Input
            id="profile-cep"
            value={values.postalCode}
            onChange={(event) => update('postalCode', event.target.value)}
            autoComplete="postal-code"
          />
        </Field>
      </div>

      {error ? (
        <p
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : null}
      {saved ? (
        <p
          role="status"
          className="text-caption text-success"
        >
          Perfil atualizado.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          variant="gold"
          onClick={submit}
          disabled={pending}
        >
          {pending ? 'Salvando…' : 'Salvar perfil'}
        </Button>
      </div>
    </div>
  )
}
