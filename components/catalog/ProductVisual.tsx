import { cn } from '@/lib/utils'

import type { Product } from '@prisma/client'

type ProductKind = 'tin' | 'bottle' | 'dropper' | 'beer'

function kindFor(slug: string): ProductKind {
  if (slug.includes('cerveja')) return 'beer'
  if (slug.includes('oleo')) return 'dropper'
  if (slug.includes('locao')) return 'bottle'
  return 'tin'
}

function labelFor(kind: ProductKind, name: string): { label: string; sub: string } {
  if (kind === 'beer') return { label: 'Stella', sub: 'Artois' }
  const words = name.split(' ').filter(Boolean)
  return { label: words[0] ?? name, sub: words.at(-1) ?? '' }
}

const creamLabel = 'bg-[#e8dfcc] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]'

export function ProductVisual({
  product,
  className,
}: {
  product: Pick<Product, 'slug' | 'name'>
  className?: string
}) {
  const kind = kindFor(product.slug)
  const { label, sub } = labelFor(kind, product.name)

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden bg-[#1b1815]',
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(255,236,205,0.09), transparent 62%)',
        }}
      />
      <span
        aria-hidden
        className="absolute bottom-[20%] h-4 w-[46%] rounded-[50%] bg-black/45 blur-md"
      />

      {kind === 'tin' ? (
        <div className="relative h-[42%] w-[56%]">
          <div
            className="absolute inset-x-0 bottom-0 top-[10%] rounded-b-[10px] rounded-t-[5px]"
            style={{
              background: 'linear-gradient(90deg,#12100e 0%,#2c2823 32%,#1a1714 64%,#0e0d0c 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-[18%] rounded-[50%]"
            style={{
              background: 'linear-gradient(90deg,#8a6630 0%,#d9b26a 42%,#8a6630 100%)',
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.35)',
            }}
          />
          <div
            className={cn(
              'absolute inset-x-[7%] bottom-[9%] top-[24%] flex flex-col items-center justify-center gap-1 rounded-[3px]',
              creamLabel,
            )}
          >
            <span className="font-display text-[15px] leading-none text-[#2a241a]">{label}</span>
            <span className="text-[7px] font-medium uppercase tracking-[0.18em] text-[#8a7757]">
              {sub}
            </span>
          </div>
        </div>
      ) : null}

      {kind === 'bottle' ? (
        <div className="relative h-[62%] w-[32%]">
          <div className="absolute left-1/2 top-0 h-[13%] w-[38%] -translate-x-1/2 rounded-t-[3px] bg-[#151311]" />
          <div
            className="absolute left-1/2 top-[11%] h-[13%] w-[26%] -translate-x-1/2"
            style={{
              background: 'linear-gradient(90deg,#4a2911 0%,#8a5426 50%,#3a1e0d 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 top-[22%] overflow-hidden rounded-[10px_10px_8px_8px]"
            style={{
              background: 'linear-gradient(90deg,#3a1e0d 0%,#8a4f22 30%,#5d3416 62%,#2a160a 100%)',
            }}
          >
            <div className="absolute left-[10%] top-[8%] h-[84%] w-[7%] rounded-full bg-white/20 blur-[2px]" />
            <div
              className={cn(
                'absolute inset-x-[12%] top-[42%] flex h-[30%] flex-col items-center justify-center rounded-[2px]',
                creamLabel,
              )}
            >
              <span className="font-display text-[12px] leading-none text-[#2a241a]">{label}</span>
              <span className="mt-0.5 text-[6px] font-medium uppercase tracking-[0.16em] text-[#8a7757]">
                {sub}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {kind === 'dropper' ? (
        <div className="relative h-[54%] w-[30%]">
          <div className="absolute left-1/2 top-0 h-[20%] w-[46%] -translate-x-1/2 rounded-t-[4px] bg-[#171411]" />
          <div className="absolute left-1/2 top-[18%] h-[8%] w-[30%] -translate-x-1/2 bg-[#0f0e0c]" />
          <div
            className="absolute inset-x-0 bottom-0 top-[25%] overflow-hidden rounded-[8px_8px_10px_10px]"
            style={{
              background: 'linear-gradient(90deg,#231d16 0%,#3b2f22 35%,#1d1812 70%,#100e0b 100%)',
            }}
          >
            <div className="absolute left-[12%] top-[10%] h-[78%] w-[7%] rounded-full bg-white/15 blur-[2px]" />
            <div
              className={cn(
                'absolute inset-x-[14%] top-[38%] flex h-[34%] flex-col items-center justify-center rounded-[2px]',
                creamLabel,
              )}
            >
              <span className="font-display text-[11px] leading-none text-[#2a241a]">{label}</span>
              <span className="mt-0.5 text-[6px] font-medium uppercase tracking-[0.16em] text-[#8a7757]">
                {sub}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {kind === 'beer' ? (
        <div className="relative h-[72%] w-[26%]">
          <div className="absolute left-1/2 top-0 h-[4%] w-[34%] -translate-x-1/2 rounded-t-[2px] bg-[#c8974a]" />
          <div
            className="absolute left-1/2 top-[3%] h-[27%] w-[34%] -translate-x-1/2"
            style={{
              background: 'linear-gradient(90deg,#1d3a24 0%,#3f6b45 42%,#1a3020 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 top-[28%] overflow-hidden rounded-[6px_6px_8px_8px]"
            style={{
              background: 'linear-gradient(90deg,#15291a 0%,#3f6b45 34%,#284a31 68%,#101d13 100%)',
            }}
          >
            <div className="absolute left-[10%] top-[6%] h-[86%] w-[7%] rounded-full bg-white/15 blur-[2px]" />
            <div
              className={cn(
                'absolute inset-x-[6%] top-[33%] flex h-[38%] flex-col items-center justify-center rounded-[2px]',
                creamLabel,
              )}
            >
              <span className="font-display text-[13px] leading-none text-[#6a1f1a]">{label}</span>
              <span className="mt-0.5 text-[6px] font-medium uppercase tracking-[0.18em] text-[#8a7757]">
                {sub}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
