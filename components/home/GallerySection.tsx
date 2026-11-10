import Image from 'next/image'

import { SectionLabel } from '@/components/ui/SectionLabel'
import { getGalleryImages } from '@/lib/home/gallery'
import { cn } from '@/lib/utils'

export async function GallerySection() {
  const images = await getGalleryImages()

  return (
    <section className="border-b border-border py-20 lg:py-28">
      <div className="mx-auto w-full max-w-shell px-6 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4">
            <SectionLabel>Galeria</SectionLabel>
            <h2 className="font-display text-[34px] font-semibold leading-[1.1] text-text lg:text-[44px]">
              Capricho que dá pra ver.
            </h2>
          </div>
          <p className="max-w-[340px] text-body leading-relaxed text-muted">
            Confira alguns resultados do nosso trabalho.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:mt-12">
          {images.map((image, index) => (
            <figure
              key={image.src}
              className={cn(
                'group relative overflow-hidden rounded-lg border border-border bg-surface-subtle',
                index === 0
                  ? 'col-span-2 aspect-[16/10] lg:col-span-2 lg:aspect-[16/9]'
                  : 'aspect-square',
              )}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={
                  index === 0 ? '(max-width: 1023px) 100vw, 66vw' : '(max-width: 1023px) 50vw, 33vw'
                }
                className="object-cover saturate-[0.85] transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-background/35 transition-colors duration-500 group-hover:bg-background/20"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
