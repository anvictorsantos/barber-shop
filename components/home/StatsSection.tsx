import { Scissors, Slice, Users } from 'lucide-react'

export function StatsSection({
  beards,
  cuts,
  clients,
}: {
  beards: number
  cuts: number
  clients: number
}) {
  const items = [
    {
      icon: Slice,
      value: beards,
      label: 'Barbas alinhadas',
      help: 'Do primeiro fio à finalização.',
    },
    {
      icon: Scissors,
      value: cuts,
      label: 'Cortes bem-feitos',
      help: 'Tesoura, máquina e acabamento.',
    },
    {
      icon: Users,
      value: clients,
      label: 'Clientes atendidos',
      help: 'Gente que senta na cadeira e volta.',
    },
  ] as const

  return (
    <section className="border-b border-border py-16 lg:py-20">
      <div className="mx-auto grid w-full max-w-shell grid-cols-1 gap-12 px-6 sm:grid-cols-3 lg:px-10">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-3 text-center"
          >
            <item.icon
              aria-hidden
              strokeWidth={1.5}
              className="h-8 w-8 text-accent"
            />
            <span className="font-display text-[56px] font-medium leading-none tabular-nums text-text lg:text-[72px]">
              {item.value.toLocaleString('pt-BR')}
            </span>
            <span className="text-caption font-semibold uppercase tracking-[0.18em] text-text-secondary">
              {item.label}
            </span>
            <span className="max-w-[220px] text-caption leading-relaxed text-muted">
              {item.help}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
