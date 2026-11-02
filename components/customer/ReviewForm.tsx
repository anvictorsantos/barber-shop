'use client'

import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { submitReviewAction } from '@/lib/customer/actions'
import { cn } from '@/lib/utils'

export function ReviewForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setPending(true)
    setError(null)
    const result = await submitReviewAction({ appointmentId, rating, comment })
    setPending(false)

    if (!result.ok) setError(result.error)
    else router.refresh()
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-input p-4">
      <span className="text-caption font-bold text-text">Avaliar esta visita</span>

      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Nota"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} estrelas`}
            onClick={() => setRating(value)}
            className="cursor-pointer p-0.5"
          >
            <Star
              className={cn('h-6 w-6', value <= rating ? 'text-accent' : 'text-muted')}
              fill={value <= rating ? 'currentColor' : 'none'}
              aria-hidden
            />
          </button>
        ))}
      </div>

      <Textarea
        aria-label="Comentário (opcional)"
        placeholder="Conte como foi o atendimento (opcional)"
        value={comment}
        maxLength={500}
        onChange={(event) => setComment(event.target.value)}
      />

      {error ? (
        <p
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="gold"
          onClick={submit}
          disabled={pending}
        >
          {pending ? 'Enviando…' : 'Enviar avaliação'}
        </Button>
      </div>
    </div>
  )
}
