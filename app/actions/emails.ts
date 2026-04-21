"use server"

import { Resend } from "resend"
import { checkAdminAccess } from "@/app/actions/auth-admin"
import { createAdminClient } from "@/lib/supabase/admin"

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

export interface Subscriber {
    id: string
    email: string
    source: string
    subscribed_at: string
    is_active: boolean
}

export interface SentEmail {
    id: string
    to: string
    subject: string
    created_at: string
}

export interface EmailStats {
    totalSubscribers: number
    activeSubscribers: number
    resendConfigured: boolean
}

export async function getEmailStats(): Promise<EmailStats> {
    if (!(await checkAdminAccess())) {
        return { totalSubscribers: 0, activeSubscribers: 0, resendConfigured: false }
    }

    const supabase = createAdminClient()
    const { count: total } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })

    const { count: active } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

    return {
        totalSubscribers: total ?? 0,
        activeSubscribers: active ?? 0,
        resendConfigured: !!resend,
    }
}

export async function getSubscribers(): Promise<Subscriber[]> {
    if (!(await checkAdminAccess())) return []

    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from("subscribers")
        .select("id, email, source, subscribed_at, is_active")
        .order("subscribed_at", { ascending: false })
        .limit(500)

    if (error) {
        console.error("[Emails] Error fetching subscribers:", error)
        return []
    }

    return data ?? []
}

export async function getRecentEmails(): Promise<SentEmail[]> {
    if (!(await checkAdminAccess())) return []
    if (!resend) return []

    try {
        const { data } = await resend.emails.list()
        return (data?.data ?? []).slice(0, 50).map((e: any) => ({
            id: e.id,
            to: Array.isArray(e.to) ? e.to.join(", ") : e.to,
            subject: e.subject ?? "(no subject)",
            created_at: e.created_at,
        }))
    } catch (error) {
        console.error("[Emails] Error fetching recent emails:", error)
        return []
    }
}

export async function sendBroadcastEmail(
    subject: string,
    htmlBody: string,
    recipientFilter: "all" | "active"
): Promise<{ success: boolean; sent: number; error?: string }> {
    if (!(await checkAdminAccess())) {
        return { success: false, sent: 0, error: "Unauthorized" }
    }
    if (!resend) {
        return { success: false, sent: 0, error: "Resend is not configured. Set RESEND_API_KEY." }
    }
    if (!subject.trim() || !htmlBody.trim()) {
        return { success: false, sent: 0, error: "Subject and body are required." }
    }

    const supabase = createAdminClient()
    let query = supabase
        .from("subscribers")
        .select("email")
    if (recipientFilter === "active") {
        query = query.eq("is_active", true)
    }

    const { data: subscribers, error: dbError } = await query
    if (dbError) {
        return { success: false, sent: 0, error: "Failed to fetch subscribers." }
    }
    if (!subscribers || subscribers.length === 0) {
        return { success: false, sent: 0, error: "No subscribers found." }
    }

    const emails = subscribers.map((s) => s.email)

    // Resend batch API supports up to 100 per call
    let sentCount = 0
    const batchSize = 100
    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize)
        try {
            await resend.batch.send(
                batch.map((to) => ({
                    from: "Measure Joy <hello@measurejoy.org>",
                    to,
                    subject,
                    html: htmlBody,
                }))
            )
            sentCount += batch.length
        } catch (err) {
            console.error(`[Emails] Batch send error (offset ${i}):`, err)
        }
    }

    return { success: sentCount > 0, sent: sentCount }
}

export async function sendTestEmail(
    to: string,
    subject: string,
    htmlBody: string
): Promise<{ success: boolean; error?: string }> {
    if (!(await checkAdminAccess())) {
        return { success: false, error: "Unauthorized" }
    }
    if (!resend) {
        return { success: false, error: "Resend is not configured. Set RESEND_API_KEY." }
    }

    try {
        await resend.emails.send({
            from: "Measure Joy <hello@measurejoy.org>",
            to,
            subject,
            html: htmlBody,
        })
        return { success: true }
    } catch (err: any) {
        console.error("[Emails] Test send error:", err)
        return { success: false, error: err?.message ?? "Send failed" }
    }
}

export async function removeSubscriber(
    id: string
): Promise<{ success: boolean; error?: string }> {
    if (!(await checkAdminAccess())) {
        return { success: false, error: "Unauthorized" }
    }

    const supabase = createAdminClient()
    const { error } = await supabase
        .from("subscribers")
        .update({ is_active: false })
        .eq("id", id)

    if (error) {
        return { success: false, error: error.message }
    }
    return { success: true }
}
