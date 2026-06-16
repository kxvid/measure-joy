"use client"

import { Star } from "lucide-react"
import { type Review } from "@/lib/reviews"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"

type ShowcaseReview = Review & { productName?: string }

interface CustomerReviewsProps {
  reviews: ShowcaseReview[]
  heading?: string
}

/**
 * Homepage review showcase backed by the real reviews database.
 * Renders nothing when there are no real reviews yet — no fabricated content.
 */
export function CustomerReviews({ reviews, heading = "What customers are saying" }: CustomerReviewsProps) {
  if (!reviews || reviews.length === 0) return null

  return (
    <section className="border-b border-border bg-secondary/40 py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <Reveal>
          <div className="mb-10 text-center">
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Real Reviews
            </span>
            <h2 className="mt-2 font-display text-3xl lg:text-4xl font-extrabold uppercase tracking-tight">{heading}</h2>
          </div>
        </Reveal>

        <Stagger className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <StaggerItem key={review.id}>
              <div className="flex h-full flex-col bg-background p-6 lg:p-8">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-pop-yellow text-pop-yellow" : "text-muted-foreground/25"}`} />
                  ))}
                </div>

                {review.title && (
                  <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.04em]">{review.title}</h3>
                )}
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-5">"{review.content}"</p>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[12px] font-semibold uppercase tracking-[0.06em]">
                      {review.user_name || "Verified Customer"}
                    </span>
                    {review.verified_purchase && (
                      <span className="font-display text-[10px] uppercase tracking-[0.08em] text-pop-teal">Verified</span>
                    )}
                  </div>
                  {review.productName && (
                    <p className="mt-1 font-display text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                      on {review.productName}
                    </p>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
