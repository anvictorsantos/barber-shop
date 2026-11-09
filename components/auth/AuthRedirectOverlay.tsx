'use client'

import Image from 'next/image'

export function AuthRedirectOverlay({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-auth-overlay fixed inset-0 z-[120] flex flex-col items-center justify-center gap-6 bg-background"
    >
      <Image
        src="/brand/logo.png"
        alt=""
        width={774}
        height={880}
        priority
        className="h-20 w-auto animate-pulse"
      />

      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
      </div>

      <p className="text-sm font-semibold text-muted">{label}</p>
    </div>
  )
}
