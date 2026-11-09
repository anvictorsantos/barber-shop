import { Users } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ClientsSearch } from '@/components/admin/clients/ClientsSearch'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { getClients } from '@/lib/admin/clients'
import { resolveAdminScope } from '@/lib/admin/context'
import { getSessionUser } from '@/lib/auth/session'
import { formatBRL } from '@/lib/format/money'

import type { Metadata } from 'next'

const PAGE_SIZE = 10

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Clientes — Barbearia do Luiz',
  robots: { index: false, follow: false },
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/entrar?next=/admin/clientes')
  if (user.role === 'CUSTOMER') redirect('/conta/agendamentos')

  const scope = await resolveAdminScope(user)
  const query = await searchParams
  const search = typeof query.q === 'string' ? query.q.trim() : ''
  const clients = await getClients(scope, search)

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE))
  const requestedPage = typeof query.page === 'string' ? Number(query.page) : 1
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1),
    totalPages,
  )
  const paginated = clients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const pageHref = (page: number) => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return qs ? `/admin/clientes?${qs}` : '/admin/clientes'
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description={
          scope.role === 'OWNER'
            ? 'Histórico e consumo dos clientes.'
            : 'Clientes atendidos por você.'
        }
      />

      <ClientsSearch initial={search} />

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            description={search ? 'Tente outra busca.' : 'Novos clientes aparecem aqui.'}
          />
        </Card>
      ) : (
        <>
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
                {paginated.map((client) => (
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

          <nav
            aria-label="Paginação de clientes"
            className="flex items-center justify-between gap-3"
          >
            <Link
              href={pageHref(currentPage - 1)}
              aria-disabled={currentPage === 1}
              className={
                currentPage === 1
                  ? 'pointer-events-none rounded-md border border-border px-4 py-2 text-caption font-bold text-muted opacity-40'
                  : 'rounded-md border border-border px-4 py-2 text-caption font-bold text-text hover:border-accent'
              }
            >
              Anterior
            </Link>

            <span className="text-caption text-muted">
              Página {currentPage} de {totalPages}
            </span>

            <Link
              href={pageHref(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages
                  ? 'pointer-events-none rounded-md border border-border px-4 py-2 text-caption font-bold text-muted opacity-40'
                  : 'rounded-md border border-border px-4 py-2 text-caption font-bold text-text hover:border-accent'
              }
            >
              Próxima
            </Link>
          </nav>
        </>
      )}
    </div>
  )
}
