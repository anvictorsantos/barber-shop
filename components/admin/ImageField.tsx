'use client'

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
      <Input
        id={id}
        value={value}
        placeholder="/catalogo/exemplo.webp ou https://…"
        onChange={(event) => onChange(event.target.value)}
      />
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
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="cursor-pointer text-caption font-semibold text-muted underline hover:text-text"
          >
            Remover
          </button>
        ) : null}
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
