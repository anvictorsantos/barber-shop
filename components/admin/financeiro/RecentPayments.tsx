'use client'

import { useState } from 'react'

import { paginationLinkClass } from '@/components/ui/Pagination'
import type { FinanceReport } from '@/lib/admin/dashboard'
import { PAYMENT_METHOD_LABELS } from '@/lib/finance/methods'
import { formatBRL } from '@/lib/format/money'

const PAGE_SIZE = 5

export function RecentPayments({ payments }: { payments: FinanceReport['recentPayments'] }) {
  const [page, setPage] = useState(1)

  if (payments.length === 0) {
    return <p className="text-caption text-subtle">Nenhum pagamento registrado.</p>
  }

  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = payments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-border text-micro uppercase tracking-wider text-muted">
              <th className="py-2 font-semibold">Pedido</th>
              <th className="py-2 font-semibold">Cliente</th>
              <th className="py-2 font-semibold">Profissional</th>
              <th className="py-2 font-semibold">Forma</th>
              <th className="py-2 text-right font-semibold">Valor</th>
              <th className="py-2 text-right font-semibold">Quando</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border/60 text-caption text-text last:border-0"
              >
                <td className="py-3 font-bold text-accent">#{payment.orderCode}</td>
                <td className="py-3">{payment.customerName}</td>
                <td className="py-3 text-muted">{payment.barberName ?? '—'}</td>
                <td className="py-3 text-muted">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                <td className="py-3 text-right font-bold">
                  {formatBRL(payment.amountCents - payment.refundedCents)}
                </td>
                <td className="py-3 text-right text-muted">{payment.paidAtLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Paginação de pagamentos"
          className="flex items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={paginationLinkClass(currentPage === 1)}
          >
            Anterior
          </button>

          <span className="text-caption text-muted">
            Página {currentPage} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={paginationLinkClass(currentPage === totalPages)}
          >
            Próxima
          </button>
        </nav>
      ) : null}
    </>
  )
}
