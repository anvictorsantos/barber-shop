'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Input } from '@/components/ui/Input'
import { updateProfileAction } from '@/lib/customer/actions'

interface AddressValues {
  addressLine: string
  city: string
  state: string
  postalCode: string
}

const fieldClass =
  'h-[41px] rounded-sm border-white/[0.07] bg-surface-input px-4 text-sm text-text placeholder:text-muted focus:border-accent'

export function AddressForm({
  initial,
  personal,
}: {
  initial: AddressValues
  personal: { name: string; phone: string; cpf: string; birthDate: string }
}) {
  const router = useRouter()
  const [values, setValues] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(key: keyof AddressValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    setPending(true)
    setError(null)
    const result = await updateProfileAction({ ...personal, ...values })
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setEditing(false)
    router.refresh()
  }

  const cityLine = [values.city, values.state].filter(Boolean).join(' - ')
  const hasAddress = Boolean(values.addressLine || cityLine || values.postalCode)

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-white/[0.07] bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-extrabold leading-[19px] text-text">Endereço Principal</h2>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="cursor-pointer text-[13px] font-bold leading-4 text-primary transition hover:text-primary-hover"
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <Input
            aria-label="Endereço"
            value={values.addressLine}
            onChange={(event) => update('addressLine', event.target.value)}
            placeholder="Rua, número, complemento"
            className={fieldClass}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_64px_100px] gap-3">
            <Input
              aria-label="Cidade"
              value={values.city}
              onChange={(event) => update('city', event.target.value)}
              placeholder="Cidade"
              className={fieldClass}
            />
            <Input
              aria-label="UF"
              value={values.state}
              maxLength={2}
              onChange={(event) => update('state', event.target.value.toUpperCase())}
              placeholder="UF"
              className={fieldClass}
            />
            <Input
              aria-label="CEP"
              value={values.postalCode}
              onChange={(event) => update('postalCode', event.target.value)}
              placeholder="CEP"
              className={fieldClass}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="text-caption text-danger"
            >
              {error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="h-[41px] cursor-pointer rounded-sm bg-primary px-6 text-sm font-bold text-accent-ink transition hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-40"
            >
              {pending ? 'Salvando…' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium leading-[17px] text-text">
            {values.addressLine ||
              (hasAddress ? 'Endereço não informado' : 'Nenhum endereço cadastrado')}
          </span>
          <span className="text-[13px] leading-4 text-muted">
            {cityLine}
            {cityLine && values.postalCode ? ' • ' : ''}
            {values.postalCode ? `CEP ${values.postalCode}` : ''}
          </span>
        </div>
      )}
    </section>
  )
}
