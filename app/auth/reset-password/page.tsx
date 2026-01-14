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
import { Lock, Check, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"

type PageState = "loading" | "invalid" | "ready" | "success"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageState, setPageState] = useState<PageState>("loading")
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const initializeAuth = async () => {
      console.log("[ResetPassword] Initializing...")

      // Listen for auth events - Supabase will process the URL hash tokens
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("[ResetPassword] Auth event:", event, "Session:", !!session)

        if (!mounted) return

        if (event === "PASSWORD_RECOVERY") {
          // Recovery token was processed, user can now update password
          console.log("[ResetPassword] PASSWORD_RECOVERY event - ready to update password")
          setPageState("ready")
        } else if (event === "SIGNED_IN" && session) {
          // User is signed in (recovery session established)
          setPageState("ready")
        } else if (event === "SIGNED_OUT") {
          // Session ended
          setPageState("invalid")
        }
      })

      // Check if there's already a session (for page refreshes during recovery)
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        console.log("[ResetPassword] Existing session found")
        setPageState("ready")
      } else {
        // Check if there are tokens in the URL hash
        const hash = window.location.hash
        if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
          console.log("[ResetPassword] Tokens in URL, waiting for Supabase to process...")
          // Supabase will process these and fire PASSWORD_RECOVERY event
          // Give it a moment
          setTimeout(() => {
            if (mounted && pageState === "loading") {
              // If still loading after timeout, check session again
              supabase.auth.getSession().then(({ data: { session: s } }) => {
                if (mounted) {
                  setPageState(s ? "ready" : "invalid")
                }
              })
            }
          }, 3000)
        } else {
          console.log("[ResetPassword] No tokens or session - invalid access")
          setPageState("invalid")
        }
      }

      return () => {
        mounted = false
        subscription.unsubscribe()
      }
    }

    initializeAuth()

    return () => {
      mounted = false
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

      // Password updated successfully
      setPageState("success")

      // Sign out so they can log in with new password
      await supabase.auth.signOut()

      // Redirect to login after a moment
      setTimeout(() => {
        router.push("/auth/login")
      }, 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (pageState === "loading") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
            <p className="mt-4 text-muted-foreground">Verifying your reset link...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  // Invalid/expired link
  if (pageState === "invalid") {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl text-center">
              <CardHeader className="pb-2">
                <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-7 w-7 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Invalid or Expired Link</CardTitle>
                <CardDescription>
                  This password reset link is no longer valid.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Password reset links expire after 24 hours for security. Please request a new one.
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild className="rounded-xl">
                    <Link href="/auth/forgot-password">Request New Link</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/auth/login">Back to Sign In</Link>
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

  // Success state
  if (pageState === "success") {
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
                <CardTitle className="text-2xl">Password Updated!</CardTitle>
                <CardDescription>
                  Your password has been changed successfully.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to sign in...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  // Ready to update password
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
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
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
                      autoFocus
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
                      placeholder="Re-enter your password"
                    />
                  </div>
                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl">
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
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
