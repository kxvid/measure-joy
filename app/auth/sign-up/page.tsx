"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArrowLeft, Camera, Check } from "lucide-react"

function getSiteUrl() {
  // In production, use the Vercel URL or custom domain
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  // For Vercel deployments
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  // Fallback to window.location.origin (works in production)
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "http://localhost:3000"
}

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [signUpComplete, setSignUpComplete] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const siteUrl = getSiteUrl()
      const redirectUrl = `${siteUrl}/auth/callback`

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user && data.session) {
        // User was auto-confirmed (email confirmation disabled in Supabase)
        // Create profile immediately
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
        })

        router.push("/account")
      } else if (data.user && !data.session) {
        // Email confirmation required
        setSignUpComplete(true)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (signUpComplete) {
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
                <CardTitle className="text-2xl">Check your email!</CardTitle>
                <CardDescription>We sent a confirmation link to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-mono text-sm bg-muted px-3 py-2 rounded-lg">{email}</p>
                <p className="text-sm text-muted-foreground">
                  Click the link in your email to verify your account and start shopping for vintage cameras.
                </p>
                <div className="pt-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Didn&apos;t receive an email? Check your spam folder or
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl bg-transparent"
                    onClick={() => setSignUpComplete(false)}
                  >
                    Try again with a different email
                  </Button>
                </div>
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
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
            Back to store
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="h-7 w-7 text-accent" />
              </div>
              <CardTitle className="text-2xl">Create an account</CardTitle>
              <CardDescription>Join Measure Joy and start collecting</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
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
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>}
                  <Button type="submit" className="w-full h-12 rounded-xl" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
                <div className="mt-6 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-accent hover:underline underline-offset-4 font-medium">
                    Sign in
                  </Link>
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
