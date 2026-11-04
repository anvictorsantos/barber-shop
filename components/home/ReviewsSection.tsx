import type { HomeReview } from '@/lib/home/queries'

export function ReviewsSection({ reviews }: { reviews: HomeReview[] }) {
  if (reviews.length === 0) return null

  return (
    <section className="bg-[#f4f1ec] py-16 lg:py-20">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-5 lg:gap-14 lg:px-10">
        <h2 className="text-center text-2xl font-black uppercase tracking-[0.15em] text-[#1c1d22] lg:text-[32px]">
          Avaliações dos nossos clientes
        </h2>

        <div className="flex flex-wrap justify-center gap-10 lg:gap-14">
          {reviews.map((review) => (
            <figure
              key={review.id}
              className="flex w-full max-w-[320px] flex-col items-center gap-6 text-center sm:w-[300px]"
            >
              <blockquote className="text-sm leading-relaxed text-[#1c1d22] lg:text-[15px]">
                “{review.comment}”
              </blockquote>
              <figcaption className="text-label font-bold uppercase tracking-[1.5px] text-[#c9a24a]">
                {review.customerName}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
