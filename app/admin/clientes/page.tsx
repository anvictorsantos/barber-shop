import { Search, Users } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { getClients } from '@/lib/admin/clients'
import { resolveAdminScope } from '@/lib/admin/context'
import { getSessionUser } from '@/lib/auth/session'
import { formatBRL } from '@/lib/format/money'

import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Clientes — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin/clientes')
  if (user.role === 'CUSTOMER') redirect('/conta/agendamentos')

  const scope = await resolveAdminScope(user)
  const query = await searchParams
  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const clients = await getClients(scope, search)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description={
          scope.role === 'OWNER' ? 'Fichas, histórico e consumo.' : 'Clientes atendidos por você.'
        }
      />

      <form
        action="/admin/clientes"
        className="flex max-w-md items-center gap-2"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Buscar por nome, e-mail ou telefone"
            aria-label="Buscar clientes"
            className="h-10 w-full rounded-sm border border-border-strong bg-surface-input pl-9 pr-3 text-body text-text placeholder:text-subtle focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="h-10 cursor-pointer rounded-lg bg-white/10 px-4 text-caption font-bold text-text hover:bg-white/15"
        >
          Buscar
        </button>
      </form>

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            description={search ? 'Tente outra busca.' : 'Novos clientes aparecem aqui.'}
          />
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border px-5 text-micro uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="py-3 font-semibold">Contato</th>
                <th className="py-3 text-right font-semibold">Visitas</th>
                <th className="py-3 text-right font-semibold">Gasto</th>
                <th className="py-3 text-right font-semibold">Última visita</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-border/60 text-caption last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/clientes/${client.id}`}
                      className="font-bold text-text hover:text-accent"
                    >
                      {client.name}
                    </Link>
                    {client.noShowCount > 0 ? (
                      <span className="ml-2 text-micro text-danger">
                        {client.noShowCount} falta{client.noShowCount === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 text-muted">
                    <span className="block">{client.email ?? '—'}</span>
                    <span className="block text-micro">{client.phone ?? ''}</span>
                  </td>
                  <td className="py-3 text-right text-text">{client.visits}</td>
                  <td className="py-3 text-right font-bold text-text">
                    {formatBRL(client.spentCents)}
                  </td>
                  <td className="py-3 text-right text-muted">{client.lastVisitLabel ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {client.bookingBlocked ? (
                      <StatusPill tone="danger">Bloqueado</StatusPill>
                    ) : (
                      <StatusPill tone="success">Ativo</StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
