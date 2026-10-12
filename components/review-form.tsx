"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitReviewAction } from "@/app/actions/reviews";
import { Loader2, CheckCircle2, Star } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReviewForm({
  productId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!title.trim() || content.trim().length < 10) {
      setError("Add a title and a review of at least 10 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitReviewAction(
        productId,
        rating,
        title.trim(),
        content.trim(),
      );
      if (result.success) {
        setWarning(result.warning || null);
        setSuccess(true);
      } else {
        setError(
          result.error || "We couldn't save your review. Please try again.",
        );
      }
    } catch {
      setError(
        "We couldn't confirm that your review was saved. Refresh the reviews before trying again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/50 p-7">
        <div role="status">
          <CheckCircle2
            className="mb-4 h-8 w-8 text-success"
            aria-hidden="true"
          />
          <h3 className="text-xl font-semibold">Your review is saved.</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Thank you for sharing your experience with other camera lovers.
          </p>
        </div>
        {warning && (
          <p
            role="alert"
            className="mt-4 border-l-2 border-brand pl-3 text-sm leading-relaxed"
          >
            {warning}
          </p>
        )}
        <Button
          type="button"
          onClick={onSuccess}
          className="button button-dark mt-6"
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border bg-card p-6"
      aria-busy={isSubmitting}
    >
      <fieldset disabled={isSubmitting}>
        <legend className="mb-3 text-sm font-medium">Your rating</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="relative cursor-pointer rounded-md p-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
            >
              <input
                type="radio"
                name="review-rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <span className="sr-only">{value} out of 5 stars</span>
              <Star
                aria-hidden="true"
                className={`h-7 w-7 ${value <= rating ? "fill-brand text-brand" : "text-muted-foreground"}`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label
          htmlFor="review-title"
          className="mb-2 block text-sm font-medium"
        >
          Review title
        </label>
        <Input
          id="review-title"
          placeholder="A few words about your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={160}
          disabled={isSubmitting}
          className="rounded-lg"
        />
      </div>
      <div>
        <label
          htmlFor="review-content"
          className="mb-2 block text-sm font-medium"
        >
          Your review
        </label>
        <Textarea
          id="review-content"
          placeholder="How has your camera been treating you?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          disabled={isSubmitting}
          className="resize-y rounded-lg"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="button button-dark"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Saving…
            </>
          ) : (
            "Submit review"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="button button-outline"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
