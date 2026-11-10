'use client'

import { useState } from 'react'

import { GalleryForm } from '@/components/admin/settings/GalleryForm'
import { HoursForm } from '@/components/admin/settings/HoursForm'
import { ShopForm } from '@/components/admin/settings/ShopForm'
import { TeamManager } from '@/components/admin/settings/TeamManager'
import { TimeBlockManager } from '@/components/admin/settings/TimeBlockManager'
import type {
  AdminBarber,
  AdminGalleryImage,
  AdminShopHours,
  AdminTimeBlock,
  ShopSettings,
} from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type Tab = 'shop' | 'gallery' | 'hours' | 'team' | 'blocks'

const tabs: { id: Tab; label: string }[] = [
  { id: 'shop', label: 'Barbearia' },
  { id: 'gallery', label: 'Galeria' },
  { id: 'hours', label: 'Horários' },
  { id: 'team', label: 'Equipe' },
  { id: 'blocks', label: 'Bloqueios' },
]

export function SettingsManager({
  shop,
  gallery,
  hours,
  barbers,
  blocks,
}: {
  shop: ShopSettings | null
  gallery: AdminGalleryImage[]
  hours: AdminShopHours[]
  barbers: AdminBarber[]
  blocks: AdminTimeBlock[]
}) {
  const [tab, setTab] = useState<Tab>('shop')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'cursor-pointer rounded-lg px-4 py-2 text-caption font-bold transition',
              tab === item.id
                ? 'bg-primary text-accent-ink'
                : 'bg-surface text-muted hover:text-text',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'shop' ? <ShopForm shop={shop} /> : null}
      {tab === 'gallery' ? <GalleryForm images={gallery} /> : null}
      {tab === 'hours' ? <HoursForm hours={hours} /> : null}
      {tab === 'team' ? <TeamManager barbers={barbers} /> : null}
      {tab === 'blocks' ? (
        <TimeBlockManager
          barbers={barbers}
          blocks={blocks}
        />
      ) : null}
    </div>
  )
}
