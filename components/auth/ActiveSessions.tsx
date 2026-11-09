'use client'

import { Monitor, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface SessionItem {
  id: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string
  current: boolean
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return 'Dispositivo desconhecido'

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Chrome\//.test(userAgent)
          ? 'Chrome'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : 'Navegador'

  const device = /iPhone/.test(userAgent)
    ? 'iPhone'
    : /iPad/.test(userAgent)
      ? 'iPad'
      : /Android/.test(userAgent)
        ? 'Android'
        : /Windows/.test(userAgent)
          ? 'Windows'
          : /Macintosh/.test(userAgent)
            ? 'Mac'
            : /Linux/.test(userAgent)
              ? 'Linux'
              : null

  return device ? `${browser} ${device}` : browser
}

export function ActiveSessions() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionItem[] | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    const response = await fetch('/api/sessions')
    if (!response.ok) {
      setFailed(true)
      setSessions([])
      return
    }
    const data = (await response.json()) as { sessions: SessionItem[] }
    setSessions(data.sessions)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function revoke(id: string | null) {
    setPending(id ?? 'all')
    await fetch(id ? `/api/sessions?id=${encodeURIComponent(id)}` : '/api/sessions', {
      method: 'DELETE',
    })
    setPending(null)

    if (id && sessions?.find((session) => session.id === id)?.current) {
      router.replace('/')
      router.refresh()
      return
    }
    void load()
  }

  const others = sessions?.filter((session) => !session.current) ?? []

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-white/[0.07] bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-extrabold leading-[19px] text-text">Sessões ativas</h2>
        <p className="text-caption leading-[15px] text-muted">
          Aparelhos conectados à sua conta. Encerre o que não reconhecer.
        </p>
      </div>

      {sessions === null ? (
        <p className="text-caption text-muted">Carregando…</p>
      ) : sessions.length === 0 ? (
        <p className="text-caption text-muted">
          {failed ? 'Não foi possível carregar as sessões.' : 'Nenhuma sessão ativa.'}
        </p>
      ) : (
        <ul className="flex flex-col">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center gap-3 border-b border-white/[0.07] py-3 last:border-0"
            >
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary/10">
                {/iPhone|iPad|Android/.test(session.userAgent ?? '') ? (
                  <Smartphone
                    aria-hidden
                    className="h-4 w-4 text-primary"
                  />
                ) : (
                  <Monitor
                    aria-hidden
                    className="h-4 w-4 text-primary"
                  />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-bold leading-[17px] text-text">
                  {deviceLabel(session.userAgent)}
                  {session.current ? (
                    <span className="ml-2 rounded-lg bg-primary/10 px-2 py-0.5 text-label font-extrabold uppercase text-primary">
                      Este aparelho
                    </span>
                  ) : null}
                </span>
                <span className="truncate text-caption leading-[15px] text-muted">
                  {session.ip ?? 'IP desconhecido'} · último acesso{' '}
                  {dateFormat.format(new Date(session.lastUsedAt))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => revoke(session.id)}
                disabled={pending !== null}
                className="shrink-0 cursor-pointer text-caption font-semibold text-muted transition hover:text-danger disabled:opacity-50"
              >
                {pending === session.id ? 'Encerrando…' : 'Encerrar'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 ? (
        <button
          type="button"
          onClick={() => revoke(null)}
          disabled={pending !== null}
          className="w-fit cursor-pointer rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-caption font-bold text-primary transition hover:bg-primary/20 disabled:opacity-50"
        >
          {pending === 'all' ? 'Encerrando…' : 'Encerrar outras sessões'}
        </button>
      ) : null}
    </section>
  )
}
