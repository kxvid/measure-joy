"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * This component listens for Supabase auth events globally.
 * It handles PASSWORD_RECOVERY events by redirecting to the reset-password page,
 * which is needed because Supabase sometimes strips the redirect path from emails.
 */
export function AuthRecoveryHandler() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const supabase = createClient()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[AuthRecoveryHandler] Auth event:", event)

            // If we detect a password recovery event and we're NOT already on the reset-password page,
            // redirect there
            if (event === "PASSWORD_RECOVERY" && pathname !== "/auth/reset-password") {
                console.log("[AuthRecoveryHandler] Redirecting to reset-password page")
                router.push("/auth/reset-password")
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router, pathname])

    // This component renders nothing
    return null
}
