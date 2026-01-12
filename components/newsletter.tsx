"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Sparkles, Loader2 } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "newsletter" }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || "Something went wrong")
      }
    } catch {
      setError("Failed to subscribe. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-12 lg:py-20 bg-pop-yellow">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block px-4 py-1 bg-foreground text-pop-yellow text-xs font-bold uppercase tracking-wider mb-4">
            Join The List
          </span>

          <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-foreground mb-4">
            Get First Access
          </h2>
          <p className="text-foreground/70 text-base lg:text-lg leading-relaxed mb-8">
            New finds drop almost daily. Don't miss out on rare cameras and exclusive deals.
          </p>

          {submitted ? (
            <div className="p-6 bg-foreground inline-block">
              <Sparkles className="h-8 w-8 text-pop-yellow mx-auto mb-3" />
              <p className="font-bold text-xl text-background">You're on the list!</p>
              <p className="text-sm text-background/70 mt-1">Check your inbox for a welcome surprise.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="flex-1 h-12 lg:h-14 bg-background border-2 border-foreground text-foreground placeholder:text-foreground/50 focus-visible:ring-foreground px-4 text-base"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 lg:h-14 px-6 lg:px-8 gap-2 group bg-foreground hover:bg-foreground/90 text-background text-sm font-bold uppercase tracking-wide"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-3 font-medium">{error}</p>
          )}

          <p className="text-xs text-foreground/50 mt-5 uppercase tracking-wide">No spam, ever. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  )
}
