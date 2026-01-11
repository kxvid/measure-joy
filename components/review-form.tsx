"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/star-rating"
import { submitReview } from "@/lib/reviews"
import { Loader2, CheckCircle2 } from "lucide-react"

interface ReviewFormProps {
  productId: string
  onSuccess: () => void
  onCancel: () => void
}

export function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    if (!content.trim()) {
      setError("Please enter your review")
      return
    }

    setIsSubmitting(true)

    const result = await submitReview(productId, rating, title.trim(), content.trim())

    setIsSubmitting(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } else {
      setError(result.error || "Failed to submit review")
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-green-800">Thank you for your review!</h3>
        <p className="text-green-700 mt-2">Your feedback helps other customers make informed decisions.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-secondary/50 rounded-2xl p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-3">Your Rating</label>
        <StarRating rating={rating} size="lg" interactive onRatingChange={setRating} />
      </div>

      <div>
        <label htmlFor="review-title" className="block text-sm font-medium mb-2">
          Review Title
        </label>
        <Input
          id="review-title"
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div>
        <label htmlFor="review-content" className="block text-sm font-medium mb-2">
          Your Review
        </label>
        <Textarea
          id="review-content"
          placeholder="Tell others about your experience with this product..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="rounded-xl resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl bg-transparent">
          Cancel
        </Button>
      </div>
    </form>
  )
}
