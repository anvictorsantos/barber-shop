import Link from 'next/link'

import { buttonClasses } from '@/components/ui/Button'

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh items-center justify-center bg-background px-5 py-16"
    >
      <div className="w-full max-w-narrow">
        <p className="font-display text-brand text-accent">BARBEARIA DO LUIZ</p>
        <h1 className="mt-4 text-page font-extrabold text-text">
          Corte, barba e resenha de alto padrão
        </h1>
        <p className="mt-3 text-body leading-relaxed text-muted">
          Escolha o serviço, o barbeiro e o horário. Confirmação em poucos minutos.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/servicos"
            className={buttonClasses({ size: 'lg' })}
          >
            Ver serviços
          </Link>
          <Link
            href="/loja"
            className={buttonClasses({ variant: 'outline', size: 'lg' })}
          >
            Loja
          </Link>
        </div>

        <div className="mt-8 h-px w-full bg-border" />
        <p className="mt-4 text-caption text-subtle">Belo Horizonte — MG · Segunda a sábado</p>
      </div>
    </main>
  )
}
