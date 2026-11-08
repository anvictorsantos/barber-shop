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
    { value: beards, label: 'Barbas feitas' },
    { value: cuts, label: 'Cortes feitos' },
    { value: clients, label: 'Clientes atendidos' },
  ] as const

  return (
    <section className="border-b border-border">
      <div className="mx-auto grid w-full max-w-shell grid-cols-3 divide-x divide-border px-6 lg:px-10">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-1 px-3 py-8 first:pl-0 last:pr-0 sm:gap-2 sm:px-8 sm:py-12"
          >
            <span className="font-display text-[36px] font-medium leading-none tabular-nums text-text sm:text-[56px] lg:text-[64px]">
              {item.value.toLocaleString('pt-BR')}
            </span>
            <span className="text-caption leading-snug text-muted sm:text-body">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
