import { SectionLabel } from '@/components/ui/SectionLabel'
import type { HomeReview } from '@/lib/home/queries'

export function ReviewsSection({ reviews }: { reviews: HomeReview[] }) {
  if (reviews.length === 0) return null

  return (
    <section className="bg-[#efe9dd] py-20 text-[#211d17] lg:py-28">
      <div className="mx-auto grid w-full max-w-shell gap-10 px-6 lg:grid-cols-[0.8fr_2fr] lg:gap-16 lg:px-10">
        <div className="flex flex-col gap-4">
          <SectionLabel tone="paper">Avaliações</SectionLabel>
          <h2 className="font-display text-[34px] font-semibold leading-[1.1] lg:text-[44px]">
            O que dizem os clientes
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {reviews.map((review) => (
            <figure
              key={review.id}
              className="flex flex-col gap-5 border-t border-[#211d17]/15 pt-5"
            >
              <blockquote className="text-body leading-relaxed text-[#211d17]">
                “{review.comment}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 text-caption text-[#6b6255]">
                <span
                  aria-hidden
                  className="h-px w-5 bg-[#a8792f]"
                />
                {review.customerName}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
