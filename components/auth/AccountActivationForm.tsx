'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { AuthField, AuthInput } from '@/components/auth/AuthField'
import { AuthHeading } from '@/components/auth/AuthHeading'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { postJson } from '@/lib/http/client'

interface ActivationResponse {
  user: { id: string; name: string; role: 'CUSTOMER' | 'BARBER' | 'OWNER' }
}

export function AccountActivationForm({ token }: { token: string | null }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resending, setResending] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [done, setDone] = useState(false)

  function validate(): boolean {
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return false
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return false
    }
    if (!token && !phone.trim()) {
      setError('Informe o telefone.')
      return false
    }
    if (!token && code.length !== 6) {
      setError('Código inválido.')
      return false
    }
    return true
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!validate()) return

    setPending(true)
    const payload = token ? { token, password } : { phone, code, password }
    const result = await postJson<ActivationResponse>('/api/auth/activate', payload)
    setPending(false)

    if (!result.ok) {
      if (result.error.code === 'invalid_token' || result.error.code === 'invalid_code') {
        setInvalid(true)
        setError(token ? 'Este link expirou. Peça um novo.' : 'Código inválido ou expirado.')
        return
      }
      setError(result.error.message)
      return
    }

    setDone(true)
  }

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!identifier.trim()) {
      setError('Informe seu telefone ou e-mail.')
      return
    }

    setError(null)
    setNotice(null)
    setResending(true)
    await postJson('/api/auth/resend', { identifier })
    setResending(false)
    setNotice('Se este contato tiver um agendamento, enviamos as instruções.')
  }

  async function goToAccount() {
    router.push('/conta/agendamentos')
    router.refresh()
  }

  if (done) {
    return (
      <div className="flex w-full flex-col gap-6 rounded-lg border border-border bg-surface p-6 sm:p-8">
        <AuthHeading
          title="Conta ativada"
          description="Conta ativada. Você já pode entrar."
        />
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={goToAccount}
        >
          Ir para minha conta
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg border border-border bg-surface p-6 sm:p-8">
      <AuthHeading
        title="Defina sua senha"
        description={
          token
            ? 'Use este link para ativar sua conta e acompanhar seus agendamentos.'
            : 'Informe o telefone e o código recebido no WhatsApp para definir sua senha.'
        }
      />

      <form
        className="flex flex-col gap-6"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}
        {notice ? <FormMessage tone="info">{notice}</FormMessage> : null}

        <div className="flex flex-col gap-4">
          {token ? null : (
            <>
              <AuthField
                label="Telefone"
                htmlFor="activate-phone"
              >
                <AuthInput
                  id="activate-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+55 31 98881-5243"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Código do WhatsApp"
                htmlFor="activate-code"
              >
                <AuthInput
                  id="activate-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  className="text-center tracking-[0.3em]"
                />
              </AuthField>
            </>
          )}

          <AuthField
            label="Nova senha"
            htmlFor="activate-password"
            hint="Mínimo de 8 caracteres."
          >
            <AuthInput
              id="activate-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </AuthField>

          <AuthField
            label="Confirmar senha"
            htmlFor="activate-confirm"
          >
            <AuthInput
              id="activate-confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </AuthField>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          {pending ? 'Salvando…' : 'Definir senha'}
        </Button>
      </form>

      {invalid ? (
        <form
          className="flex flex-col gap-4 border-t border-border pt-6"
          onSubmit={resend}
        >
          <AuthField
            label="Telefone ou e-mail"
            htmlFor="activate-resend"
          >
            <AuthInput
              id="activate-resend"
              autoComplete="username"
              placeholder="seu@email.com"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </AuthField>

          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={resending}
          >
            {resending ? 'Enviando…' : 'Enviar novo link'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
