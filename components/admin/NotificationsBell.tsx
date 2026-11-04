'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import type { AdminNotification } from '@/lib/admin/notifications'

export function NotificationsBell({ count, items }: { count: number; items: AdminNotification[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div
      ref={ref}
      className="relative"
    >
      <button
        type="button"
        aria-label={count > 0 ? `Notificações (${count})` : 'Notificações'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-accent transition hover:border-accent"
      >
        <Bell
          className="h-[18px] w-[18px]"
          aria-hidden
        />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[320px] max-w-[90vw] rounded-xl border border-white/10 bg-surface p-3 shadow-card">
          <p className="px-2 pb-2 text-micro font-bold uppercase tracking-wider text-muted">
            Novos agendamentos
          </p>

          {items.length === 0 ? (
            <p className="px-2 py-4 text-caption text-muted">Nada novo por aqui.</p>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/agenda?date=${item.date}`}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-0.5 rounded-md px-2 py-2 transition hover:bg-white/5"
                  >
                    <span className="text-caption font-bold text-text">{item.customerName}</span>
                    <span className="text-micro text-muted">
                      {item.serviceName} · {item.timeLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/admin/agenda"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-md bg-white/5 px-3 py-2 text-center text-caption font-bold text-text transition hover:bg-white/10"
          >
            Ver agenda
          </Link>
        </div>
      ) : null}
    </div>
  )
}
