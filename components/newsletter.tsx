"use client";

import type React from "react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Loader2 } from "lucide-react";

interface NewsletterProps {
  cms?: Record<string, string | undefined>;
}

export function Newsletter({ cms = {} }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [welcomeSent, setWelcomeSent] = useState(false);
  const requestToken = useRef<string | null>(null);
  const fieldId = useId();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !email.trim()) return;
    const form = new FormData(event.currentTarget);
    setIsLoading(true);
    setError("");
    try {
      requestToken.current ||= crypto.randomUUID();
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "newsletter",
          website: form.get("website") || "",
          requestToken: requestToken.current,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success === true) {
        setWelcomeSent(data.welcomeSent === true);
        setSubmitted(true);
      } else {
        setError(
          data.subscriptionSaved
            ? "Your email is saved, but we couldn't confirm Christian's notification. Please retry to finish."
            : data.error || "We couldn't sign you up. Please try again.",
        );
      }
    } catch {
      setError(
        "We couldn't confirm your signup. Please retry this submission.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      className="border-t border-border bg-secondary/60 py-14 lg:py-20"
      aria-labelledby={`${fieldId}-heading`}
    >
      <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {cms.badge || "A little more joy in your inbox"}
          </p>
          <h2
            id={`${fieldId}-heading`}
            className="font-display text-3xl font-semibold tracking-tight lg:text-4xl"
          >
            {cms.heading || "Good cameras. First dibs."}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {cms.subtitle ||
              "Fresh finds, favorite cameras, and occasional notes from the shop."}
          </p>
        </div>
        <div>
          {submitted ? (
            <div
              role="status"
              className="rounded-2xl border border-border bg-background p-6"
            >
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" aria-hidden="true" />
                <p className="font-semibold">You're on the list.</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {welcomeSent
                  ? "A welcome email is on its way. Thanks for joining us."
                  : "Thanks for joining us. We'll be in touch with shop news."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} aria-busy={isLoading}>
              <label
                htmlFor={`${fieldId}-email`}
                className="mb-2 block text-sm font-medium"
              >
                Your email
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id={`${fieldId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    requestToken.current = null;
                  }}
                  required
                  maxLength={254}
                  disabled={isLoading}
                  className="h-12 flex-1 rounded-full border-border bg-background px-5"
                  aria-describedby={error ? `${fieldId}-error` : undefined}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="button button-dark h-12"
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Joining…
                    </>
                  ) : (
                    <>
                      Count me in{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
              <div className="hidden" aria-hidden="true">
                <label htmlFor={`${fieldId}-website`}>Website</label>
                <input
                  id={`${fieldId}-website`}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
            </form>
          )}
          {error && (
            <p
              id={`${fieldId}-error`}
              role="alert"
              className="mt-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {cms.disclaimer ||
              "Only the good stuff. Unsubscribe anytime by replying to an email."}
          </p>
        </div>
      </div>
    </section>
  );
}
