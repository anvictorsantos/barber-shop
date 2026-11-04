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
    { icon: Slice, value: beards, label: 'Barbas feitas' },
    { icon: Scissors, value: cuts, label: 'Cortes feitos' },
    { icon: Users, value: clients, label: 'Clientes atendidos' },
  ] as const

  return (
    <section className="bg-[#16171b] py-16 lg:py-20">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-12 px-5 sm:grid-cols-3 lg:px-10">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-4 text-center"
          >
            <item.icon
              aria-hidden
              strokeWidth={1.5}
              className="h-10 w-10 text-accent"
            />
            <span className="font-display text-[56px] font-bold leading-none text-accent lg:text-[72px]">
              {item.value.toLocaleString('pt-BR')}
            </span>
            <span className="text-sm font-bold uppercase tracking-[2px] text-white">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
