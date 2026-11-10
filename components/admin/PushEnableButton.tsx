'use client'

import { BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getJson, postJson } from '@/lib/http/client'

type PushState = 'idle' | 'working' | 'enabled' | 'unsupported' | 'denied'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}

export function PushEnableButton() {
  const [state, setState] = useState<PushState>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (subscription) setState('enabled')
      })
      .catch(() => undefined)
  }, [])

  async function enable() {
    if (state === 'working') return
    setError(null)
    setState('working')

    try {
      if ((await Notification.requestPermission()) !== 'granted') {
        setState('denied')
        return
      }

      const key = await getJson<{ publicKey: string }>('/api/admin/push')
      if (!key.ok || !key.data.publicKey) throw new Error('push_unavailable')

      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key.data.publicKey),
        }))

      const saved = await postJson<{ ok: boolean }>('/api/admin/push', subscription.toJSON())
      if (!saved.ok) throw new Error(saved.error.code)

      setState('enabled')
    } catch {
      setState('idle')
      setError('Não foi possível ativar. Tente novamente.')
    }
  }

  if (state === 'unsupported') return null

  if (state === 'enabled') {
    return <p className="px-2 pb-1 text-micro text-muted">Notificações no celular ativadas.</p>
  }

  return (
    <div className="px-2 pb-1">
      <button
        type="button"
        onClick={enable}
        disabled={state === 'working'}
        className="flex w-full cursor-pointer items-center gap-2 rounded-md bg-white/5 px-2 py-2 text-left text-caption font-semibold text-text transition hover:bg-white/10 disabled:opacity-50"
      >
        <BellRing
          className="h-4 w-4 text-accent"
          aria-hidden
        />
        {state === 'working' ? 'Ativando…' : 'Ativar notificações no celular'}
      </button>
      {state === 'denied' ? (
        <p className="pt-1 text-micro text-muted">Permissão bloqueada no navegador.</p>
      ) : null}
      {error ? <p className="pt-1 text-micro text-muted">{error}</p> : null}
    </div>
  )
}
