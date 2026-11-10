'use client'

import { Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { ImageField } from '@/components/admin/ImageField'
import { FormMessage } from '@/components/auth/FormMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Input'
import { StatusPill } from '@/components/ui/StatusPill'
import { createBarberAction, toggleBarberAction, updateBarberAction } from '@/lib/settings/actions'
import type { AdminBarber } from '@/lib/settings/types'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function BarberEditor({
  barber,
  onClose,
  onSaved,
}: {
  barber: AdminBarber | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(barber?.user.name ?? '')
  const [email, setEmail] = useState(barber?.user.email ?? '')
  const [phone, setPhone] = useState(barber?.user.phone ?? '')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState(barber?.displayName ?? '')
  const [title, setTitle] = useState(barber?.title ?? 'Barbeiro')
  const [avatarUrl, setAvatarUrl] = useState(barber?.avatarUrl ?? '')
  const [active, setActive] = useState(barber?.active ?? true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const result = barber
      ? await updateBarberAction({
          id: barber.id,
          name,
          displayName,
          title,
          avatarUrl,
          active,
        })
      : await createBarberAction({
          name,
          email,
          phone,
          password,
          displayName,
          title,
          avatarUrl,
        })

    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSaved()
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-title font-bold text-text">
          {barber ? 'Editar barbeiro' : 'Novo barbeiro'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-caption font-semibold text-muted underline hover:text-text"
        >
          Fechar
        </button>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        {error ? <FormMessage>{error}</FormMessage> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome"
            htmlFor="barber-name"
          >
            <Input
              id="barber-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field
            label="Nome de exibição"
            htmlFor="barber-display"
          >
            <Input
              id="barber-display"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>
          <Field
            label="Cargo"
            htmlFor="barber-title"
          >
            <Input
              id="barber-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <ImageField
            id="barber-avatar"
            label="URL do avatar"
            hint="Opcional"
            value={avatarUrl}
            onChange={setAvatarUrl}
          />

          {barber ? (
            <>
              <Field
                label="E-mail"
                htmlFor="barber-email-read"
              >
                <Input
                  id="barber-email-read"
                  readOnly
                  value={email || '—'}
                />
              </Field>
              <Field
                label="Telefone"
                htmlFor="barber-phone-read"
              >
                <Input
                  id="barber-phone-read"
                  readOnly
                  value={phone || '—'}
                />
              </Field>
            </>
          ) : (
            <>
              <Field
                label="E-mail"
                htmlFor="barber-email"
                hint="Opcional, mas necessário sem telefone"
              >
                <Input
                  id="barber-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field
                label="Telefone"
                htmlFor="barber-phone"
                hint="Com DDI, ex: +55 31 98881-5243"
              >
                <Input
                  id="barber-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field
                label="Senha inicial"
                htmlFor="barber-password"
              >
                <Input
                  id="barber-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            </>
          )}
        </div>

        {barber ? (
          <label className="flex items-center gap-2 text-caption font-semibold text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--primary)]"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Ativo na agenda
          </label>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={pending}
          >
            {pending ? 'Salvando…' : 'Salvar barbeiro'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function TeamManager({ barbers }: { barbers: AdminBarber[] }) {
  const router = useRouter()
  const [editor, setEditor] = useState<AdminBarber | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function toggle(barber: AdminBarber) {
    setError(null)
    setPendingId(barber.id)
    const result = await toggleBarberAction({ id: barber.id, active: !barber.active })
    setPendingId(null)

    if (!result.ok) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title font-bold text-text">Equipe</h2>
        <Button onClick={() => setEditor(null)}>Novo barbeiro</Button>
      </div>

      {error ? <FormMessage>{error}</FormMessage> : null}

      {editor !== undefined ? (
        <BarberEditor
          key={editor?.id ?? 'new'}
          barber={editor}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined)
            router.refresh()
          }}
        />
      ) : null}

      {barbers.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nenhum barbeiro cadastrado"
            description="Adicione a equipe para abrir a agenda."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {barbers.map((barber) => (
            <article
              key={barber.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent bg-primary/10 text-caption font-bold text-accent">
                    {initials(barber.displayName)}
                  </span>
                  <div className="flex flex-col">
                    <h3 className="text-lead font-bold text-text">{barber.displayName}</h3>
                    <p className="text-caption text-muted">{barber.title}</p>
                  </div>
                </div>
                <StatusPill tone={barber.active ? 'success' : 'neutral'}>
                  {barber.active ? 'Ativo' : 'Inativo'}
                </StatusPill>
              </div>

              <div className="flex flex-col text-caption text-muted">
                <span>{barber.user.name}</span>
                <span>{barber.user.email ?? barber.user.phone ?? 'Sem contato'}</span>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditor(barber)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant={barber.active ? 'outline' : 'primary'}
                  disabled={pendingId === barber.id}
                  onClick={() => toggle(barber)}
                >
                  {barber.active ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
