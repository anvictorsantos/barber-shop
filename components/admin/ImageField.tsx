'use client'

import { Trash2 } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'

import { buttonClasses } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'

export function ImageField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    setError(null)
    setPending(true)

    try {
      const body = new FormData()
      body.set('file', file)
      const response = await fetch('/api/admin/uploads', { method: 'POST', body })
      const result = (await response.json().catch(() => null)) as {
        url?: string
        error?: { message?: string }
      } | null

      if (!response.ok || !result?.url) {
        setError(result?.error?.message ?? 'Não foi possível enviar a imagem.')
        return
      }

      onChange(result.url)
    } catch {
      setError('Não foi possível enviar a imagem.')
    } finally {
      setPending(false)
    }
  }

  const fileId = `${id}-file`

  return (
    <Field
      label={label}
      htmlFor={id}
      {...(hint ? { hint } : {})}
      {...(error ? { error } : {})}
    >
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={value}
          disabled
          placeholder="Nenhuma imagem selecionada"
          className="disabled:cursor-not-allowed disabled:text-muted"
        />
        <button
          type="button"
          aria-label="Remover imagem"
          disabled={!value}
          onClick={() => onChange('')}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border-strong text-muted transition hover:border-danger hover:text-danger disabled:pointer-events-none disabled:opacity-40"
        >
          <Trash2
            aria-hidden
            className="h-4 w-4"
          />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={fileId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={upload}
        />
        <label
          htmlFor={fileId}
          className={buttonClasses({
            variant: 'outline',
            size: 'sm',
            className: pending ? 'pointer-events-none opacity-40' : '',
          })}
        >
          {pending ? 'Enviando…' : 'Enviar imagem'}
        </label>
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin URLs can point outside remotePatterns
        <img
          src={value}
          alt=""
          className="h-20 w-20 rounded-lg border border-border object-cover"
        />
      ) : null}
    </Field>
  )
}
