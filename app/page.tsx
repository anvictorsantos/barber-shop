export default function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-narrow">
        <p className="font-display text-brand text-accent">BARBEARIA DO LUIZ</p>
        <h1 className="mt-4 text-page font-extrabold text-text">
          Corte, barba e resenha de alto padrão
        </h1>
        <p className="mt-3 text-body leading-relaxed text-muted">
          Fundação do projeto pronta. A experiência de agendamento entra na próxima fase.
        </p>
        <div className="mt-8 h-px w-full bg-border" />
        <p className="mt-4 text-caption text-subtle">Belo Horizonte — MG · Segunda a sábado</p>
      </div>
    </main>
  )
}
