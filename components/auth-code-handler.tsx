"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * This component handles Supabase PKCE auth code exchange.
 * When Supabase redirects to the app with a `code` parameter (for password reset, email confirm, etc.),
 * this component exchanges the code for a session and redirects appropriately.
 */
export function AuthCodeHandler() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        const code = searchParams.get("code")

        if (!code || isProcessing) {
            return
        }

        const handleCodeExchange = async () => {
            setIsProcessing(true)
            console.log("[AuthCodeHandler] Found auth code, exchanging for session...")

            const supabase = createClient()

            try {
                // Exchange the code for a session
                const { data, error } = await supabase.auth.exchangeCodeForSession(code)

                if (error) {
                    console.error("[AuthCodeHandler] Code exchange error:", error.message)
                    // Clear the code from URL and redirect to login with error
                    router.replace("/auth/login?error=auth_failed")
                    return
                }

                console.log("[AuthCodeHandler] Session established:", data.session?.user?.email)

                // Check the type of auth event
                // For password recovery, the session will have a specific recovery type
                // We can also check if we came from a password reset by looking at the session

                // Listen for the PASSWORD_RECOVERY event
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    console.log("[AuthCodeHandler] Auth state change:", event)

                    if (event === "PASSWORD_RECOVERY") {
                        console.log("[AuthCodeHandler] PASSWORD_RECOVERY detected, redirecting to reset-password")
                        // Clear the code from URL and redirect to reset password
                        router.replace("/auth/reset-password")
                        subscription.unsubscribe()
                    } else if (event === "SIGNED_IN") {
                        // Regular sign in (email confirmation, etc.)
                        console.log("[AuthCodeHandler] SIGNED_IN detected, redirecting to account")
                        router.replace("/account")
                        subscription.unsubscribe()
                    }
                })

                // Also check immediately if this is a recovery session
                // by trying to detect if we came from a password reset flow
                const { data: { session } } = await supabase.auth.getSession()

                if (session) {
                    // If we have a session, check if the URL indicates recovery
                    // Supabase uses different mechanisms, but we can redirect to reset-password
                    // and let that page handle the session validation

                    // Check the session's aal (Authenticator Assurance Level)
                    // For recovery sessions, this indicates a different flow

                    // For now, if we have a fresh session from code exchange, 
                    // check if user needs password reset by trying to get user
                    const { data: { user } } = await supabase.auth.getUser()

                    if (user) {
                        // We have a valid session - the user can now reset their password
                        // Since this came from a password reset email, redirect to reset-password
                        console.log("[AuthCodeHandler] User authenticated, redirecting to reset-password")
                        router.replace("/auth/reset-password")
                    }
                }

            } catch (err) {
                console.error("[AuthCodeHandler] Error:", err)
                router.replace("/auth/login?error=auth_failed")
            }
        }

        handleCodeExchange()
    }, [searchParams, router, isProcessing])

    // This component renders nothing - it just handles the redirect
    return null
}
