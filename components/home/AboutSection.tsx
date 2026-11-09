import { SectionLabel } from '@/components/ui/SectionLabel'

export function AboutSection() {
  return (
    <section className="border-b border-border py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-shell gap-10 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-10">
        <div className="flex flex-col gap-4">
          <SectionLabel>Sobre a barbearia</SectionLabel>
          <h2 className="font-display text-[34px] font-semibold leading-[1.1] text-text lg:text-[44px]">
            Seu estilo é seu. Nosso trabalho é valorizar o que combina com você.
          </h2>
        </div>

        <div className="flex flex-col gap-8 lg:pt-2">
          <p className="text-[19px] leading-relaxed text-text-secondary lg:text-[21px]">
            Na Barbearia do Luiz, a gente acredita que um bom corte vai além do espelho. É sobre
            ouvir você, entender seu estilo e cuidar de cada detalhe. Tudo isso com atendimento
            próximo, trabalho caprichado e um ambiente de boa prosa.
          </p>

          <p className="flex items-center gap-3 text-caption text-muted">
            <span
              aria-hidden
              className="h-px w-8 bg-accent/60"
            />
            Corte bem-feito, conversa boa e atendimento de verdade.
          </p>
        </div>
      </div>
    </section>
  )
}
