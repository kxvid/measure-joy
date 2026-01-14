"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * This component handles password recovery redirects globally.
 * It checks both the Supabase auth events AND the URL hash for recovery tokens,
 * and redirects to /auth/reset-password when detected.
 */
export function AuthRecoveryHandler() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Skip if already on reset-password page
        if (pathname === "/auth/reset-password") {
            return
        }

        const supabase = createClient()

        // Check URL hash for recovery tokens (Supabase puts them in the fragment)
        const checkHashForRecovery = () => {
            if (typeof window !== "undefined") {
                const hash = window.location.hash
                console.log("[AuthRecoveryHandler] Checking URL hash:", hash)

                // Supabase recovery URLs contain type=recovery in the hash
                if (hash.includes("type=recovery") || hash.includes("access_token")) {
                    console.log("[AuthRecoveryHandler] Recovery tokens detected in URL, redirecting...")
                    router.push("/auth/reset-password" + hash)
                    return true
                }
            }
            return false
        }

        // Check immediately on mount
        const hasRecoveryTokens = checkHashForRecovery()

        // Also listen for auth state changes as backup
        if (!hasRecoveryTokens) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                console.log("[AuthRecoveryHandler] Auth event:", event)

                if (event === "PASSWORD_RECOVERY") {
                    console.log("[AuthRecoveryHandler] PASSWORD_RECOVERY event, redirecting...")
                    router.push("/auth/reset-password")
                }
            })

            return () => {
                subscription.unsubscribe()
            }
        }
    }, [router, pathname])

    return null
}
