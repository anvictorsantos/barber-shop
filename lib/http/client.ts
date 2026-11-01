export interface ApiError {
  code: string
  message: string
}

export type PostResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

interface ErrorPayload {
  error?: { code?: unknown; message?: unknown }
}

export async function postJson<T>(url: string, body: unknown): Promise<PostResult<T>> {
  return requestJson<T>(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function getJson<T>(url: string): Promise<PostResult<T>> {
  return requestJson<T>(url, { headers: { accept: 'application/json' } })
}

async function requestJson<T>(url: string, init: RequestInit): Promise<PostResult<T>> {
  try {
    const response = await fetch(url, init)

    const payload = (await response.json().catch(() => null)) as (T & ErrorPayload) | null

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: typeof payload?.error?.code === 'string' ? payload.error.code : 'request_failed',
          message:
            typeof payload?.error?.message === 'string'
              ? payload.error.message
              : 'Não foi possível concluir. Tente novamente.',
        },
      }
    }

    return { ok: true, data: payload as T }
  } catch {
    return {
      ok: false,
      error: { code: 'network_error', message: 'Sem conexão. Tente novamente.' },
    }
  }
}
