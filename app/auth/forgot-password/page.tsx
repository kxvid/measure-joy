"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft, Mail, Check } from "lucide-react"

function getSiteUrl() {
  // Production URL for Measure Joy
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  // Default to production domain
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return window.location.origin
  }
  // Hardcoded production URL for password reset emails
  return "https://www.measurejoy.org"
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const siteUrl = getSiteUrl()
      const redirectUrl = `${siteUrl}/auth/reset-password`
      console.log("[Password Reset] Sending redirect URL:", redirectUrl)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      if (error) throw error
      setEmailSent(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl text-center">
              <CardHeader className="pb-2">
                <div className="w-14 h-14 bg-pop-green/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Check className="h-7 w-7 text-pop-green" />
                </div>
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription>Password reset link sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-mono text-sm bg-muted px-3 py-2 rounded-lg">{email}</p>
                <p className="text-sm text-muted-foreground">
                  Click the link in your email to reset your password. The link will expire in 24 hours.
                </p>
                <Button asChild variant="outline" className="rounded-xl bg-transparent">
                  <Link href="/auth/login">Back to sign in</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
            Back to sign in
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-7 w-7 text-accent" />
              </div>
              <CardTitle className="text-2xl">Forgot password?</CardTitle>
              <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>}
                  <Button type="submit" className="w-full h-12 rounded-xl" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send reset link"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  )
}
