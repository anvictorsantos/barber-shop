import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export type BookingStep = 'servico' | 'profissional' | 'horario' | 'resumo' | 'pagamento'

const STEPS = [
  { key: 'servico', label: 'Serviço' },
  { key: 'profissional', label: 'Profissional' },
  { key: 'horario', label: 'Data e hora' },
  { key: 'resumo', label: 'Resumo' },
  { key: 'pagamento', label: 'Pagamento' },
] as const

export function BookingProgress({ current }: { current: BookingStep }) {
  const currentIndex = STEPS.findIndex((step) => step.key === current)

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-6 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-label font-bold text-accent-ink">
            {currentIndex}
          </span>
          <span className="text-caption font-bold text-white">{STEPS[currentIndex]?.label}</span>
        </div>
        <span className="text-caption text-muted">Passo {currentIndex} de 4</span>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <div className="flex items-center gap-5 py-6">
          {STEPS.map((step, index) => {
            const done = index < currentIndex
            const active = index === currentIndex

            return (
              <div
                key={step.key}
                className="flex flex-1 items-center gap-2.5"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label font-bold',
                    done
                      ? 'bg-[#302119] text-accent'
                      : active
                        ? 'bg-primary text-accent-ink'
                        : 'bg-surface text-muted',
                  )}
                >
                  {done ? (
                    <Check
                      aria-hidden
                      className="h-3 w-3"
                    />
                  ) : (
                    index
                  )}
                </span>
                <span
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'whitespace-nowrap text-caption',
                    active ? 'font-bold text-white' : 'font-medium text-muted',
                  )}
                >
                  {step.label}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn('h-px flex-1', done ? 'bg-primary' : 'bg-white/10')}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
