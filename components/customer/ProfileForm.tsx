'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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

const fieldClass =
  'h-[41px] rounded-sm border-white/[0.07] bg-surface-input px-4 text-sm text-text placeholder:text-muted focus:border-accent'

const labelClass = 'text-[13px] font-semibold leading-4 text-muted'

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className={labelClass}
    >
      {children}
    </label>
  )
}

export function ProfileForm({ initial, email }: { initial: ProfileValues; email: string | null }) {
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
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="profile-name">Nome Completo</FieldLabel>
        <Input
          id="profile-name"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          autoComplete="name"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
          <input
            id="profile-email"
            value={email ?? 'Sem e-mail cadastrado'}
            readOnly
            disabled
            className={`${fieldClass} cursor-not-allowed opacity-70`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="profile-phone">Telefone / WhatsApp</FieldLabel>
          <Input
            id="profile-phone"
            type="tel"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="profile-cpf">CPF</FieldLabel>
          <Input
            id="profile-cpf"
            value={values.cpf}
            onChange={(event) => update('cpf', event.target.value)}
            inputMode="numeric"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="profile-birth">Data de Nascimento</FieldLabel>
          <Input
            id="profile-birth"
            type="date"
            value={values.birthDate}
            onChange={(event) => update('birthDate', event.target.value)}
            className={fieldClass}
          />
        </div>
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
          onClick={submit}
          disabled={pending}
          className="h-[41px] rounded-sm px-6 text-sm"
        >
          {pending ? 'Salvando…' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  )
}
