'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { cn } from '@/lib/utils'

export function LogoutButton({
  className,
  label = 'Sair',
}: {
  className?: string
  label?: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className={cn(
        'flex cursor-pointer items-center gap-2 text-caption font-semibold text-muted transition hover:text-danger disabled:opacity-50',
        className,
      )}
    >
      <LogOut
        aria-hidden
        className="h-4 w-4"
      />
      {label}
    </button>
  )
}
