"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Lock, Check, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Supabase password reset flow:
    // 1. User clicks link in email
    // 2. Supabase redirects to this page with tokens in URL hash
    // 3. onAuthStateChange fires with PASSWORD_RECOVERY event
    // 4. User can then update their password

    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[ResetPassword] Auth event:", event)

      if (event === "PASSWORD_RECOVERY") {
        // User clicked the reset link and we have a valid recovery session
        setIsValidSession(true)
      } else if (event === "SIGNED_IN" && session) {
        // Already signed in with valid session (recovery complete)
        setIsValidSession(true)
      }
    })

    // Also check if there's already a valid session (in case of page refresh)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsValidSession(true)
      } else {
        // Give the auth listener a moment to catch the recovery event
        setTimeout(() => {
          if (isValidSession === null) {
            setIsValidSession(false)
          }
        }, 2000)
      }
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)

      // Sign out after password reset so they can log in fresh
      await supabase.auth.signOut()

      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidSession === null) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Verifying reset link...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!isValidSession) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Invalid or expired link</CardTitle>
                <CardDescription>This password reset link is no longer valid or has expired.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Password reset links expire after 24 hours. Please request a new one.
                </p>
                <Button asChild className="rounded-xl">
                  <a href="/auth/forgot-password">Request a new link</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (success) {
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
                <CardTitle className="text-2xl">Password updated!</CardTitle>
                <CardDescription>Redirecting you to sign in...</CardDescription>
              </CardHeader>
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
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="h-7 w-7 text-accent" />
              </div>
              <CardTitle className="text-2xl">Set new password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl"
                      placeholder="Re-enter your password"
                    />
                  </div>
                  {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">{error}</div>}
                  <Button type="submit" className="w-full h-12 rounded-xl" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update password"}
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
