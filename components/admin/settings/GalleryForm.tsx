'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { ImageField } from '@/components/admin/ImageField'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Input'
import { updateGalleryAction } from '@/lib/settings/actions'
import type { AdminGalleryImage } from '@/lib/settings/types'

export function GalleryForm({ images }: { images: AdminGalleryImage[] }) {
  const router = useRouter()
  const [slots, setSlots] = useState(images)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  function update(index: number, patch: Partial<AdminGalleryImage>) {
    setSlots((current) => current.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setPending(true)

    const result = await updateGalleryAction({ images: slots })

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
      <h2 className="text-title font-bold text-text">Galeria da home</h2>
      <p className="text-body text-muted">
        A foto 1 aparece em destaque, em formato horizontal. Campo vazio usa a foto padrão.
      </p>

      <form
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}
        {saved ? <FormMessage tone="success">Galeria salva.</FormMessage> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {slots.map((slot, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-lg border border-border p-4"
            >
              <ImageField
                id={`gallery-photo-${index + 1}`}
                label={`Foto ${index + 1}`}
                {...(index === 0 ? { hint: 'Destaque, formato horizontal' } : {})}
                value={slot.url}
                onChange={(url) => update(index, { url })}
              />
              <Field
                label="Descrição"
                htmlFor={`gallery-alt-${index + 1}`}
                hint="Lida por leitores de tela"
              >
                <Input
                  id={`gallery-alt-${index + 1}`}
                  maxLength={120}
                  value={slot.alt}
                  onChange={(event) => update(index, { alt: event.target.value })}
                />
              </Field>
            </div>
          ))}
        </div>

        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? 'Salvando…' : 'Salvar galeria'}
        </Button>
      </form>
    </Card>
  )
}
