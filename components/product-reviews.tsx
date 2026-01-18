import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import { ReviewForm } from "@/components/review-form"
import { getReviews, getReviewsStats } from "@/app/actions/reviews"
import { type Review, type ReviewStats } from "@/lib/reviews"
import { useAuth, useUser } from "@clerk/nextjs" // Use useUser to detect login state more easily for hydration
import { User, MessageSquare, ThumbsUp, Shield } from "lucide-react"
import Link from "next/link"

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const { isSignedIn, user } = useUser()
  const userId = user?.id
  const [hasReviewed, setHasReviewed] = useState(false)

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const [data, reviewStats] = await Promise.all([
        getReviews(productId),
        getReviewsStats(productId)
      ])

      setReviews(data)
      setStats(reviewStats)

      if (userId) {
        setHasReviewed(data.some((r) => r.user_id === userId))
      }
    } catch (err) {
      console.error("Failed to load reviews", err)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [productId, userId])

  const handleReviewSuccess = () => {
    setShowForm(false)
    setHasReviewed(true)
    fetchReviews()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <section className="mt-16 lg:mt-24">
      <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-16">
        {/* Stats sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Customer Reviews</h2>

          {stats && stats.totalReviews > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold">{stats.averageRating}</span>
                <div>
                  <StarRating rating={stats.averageRating} size="md" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Rating breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.ratingCounts[star as keyof typeof stats.ratingCounts]
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm w-3">{star}</span>
                      <StarRating rating={1} maxRating={1} size="sm" />
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-secondary/50 rounded-2xl">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to review!</p>
            </div>
          )}

          {/* Write review button */}
          <div className="mt-6">
            {isSignedIn ? (
              hasReviewed ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm text-center">
                  You've already reviewed this product
                </div>
              ) : (
                <Button onClick={() => setShowForm(true)} className="w-full rounded-xl" disabled={showForm}>
                  Write a Review
                </Button>
              )
            ) : (
              <div className="space-y-3">
                <Button asChild className="w-full rounded-xl">
                  <Link href="/sign-in">Sign in to Review</Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground">You need an account to leave a review</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews list */}
        <div className="flex-1">
          {showForm && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Write Your Review</h3>
              <ReviewForm productId={productId} onSuccess={handleReviewSuccess} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-secondary" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-secondary rounded" />
                      <div className="h-3 w-24 bg-secondary rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-48 bg-secondary rounded mb-2" />
                  <div className="h-16 bg-secondary rounded" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                        <User className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.user_name}</span>
                          {review.verified_purchase && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <Shield className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>

                  <h4 className="font-semibold mt-4">{review.title}</h4>
                  <p className="text-muted-foreground mt-2 leading-relaxed">{review.content}</p>

                  <div className="flex items-center gap-4 mt-4">
                    <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      Helpful ({review.helpful_count})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showForm ? (
            <div className="text-center py-12 bg-secondary/30 rounded-2xl">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg">No reviews yet</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                This product hasn't been reviewed yet. Be the first to share your experience!
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
