import { checkAdminAccess } from "@/app/actions/auth-admin"
import { getEmailStats, getSubscribers, getRecentEmails } from "@/app/actions/emails"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Mail, Users, CheckCircle, AlertTriangle } from "lucide-react"
import { EmailComposer } from "./email-composer"
import { SubscriberTable } from "./subscriber-table"
import { RecentEmailsTable } from "./recent-emails-table"

export default async function AdminEmailsPage() {
    if (!(await checkAdminAccess())) redirect("/admin")

    const [stats, subscribers, recentEmails] = await Promise.all([
        getEmailStats(),
        getSubscribers(),
        getRecentEmails(),
    ])

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Page header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Email Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Send beautiful emails to your subscribers via Resend
                    </p>
                </div>
                {!stats.resendConfigured && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-lg text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Resend not configured — set <code className="font-mono text-xs">RESEND_API_KEY</code>
                    </div>
                )}
            </div>

            {/* Compact stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    label="Total"
                    value={stats.totalSubscribers}
                    icon={<Users className="h-3.5 w-3.5" />}
                />
                <StatCard
                    label="Active"
                    value={stats.activeSubscribers}
                    icon={<CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                />
                <StatCard
                    label="Recent Sends"
                    value={recentEmails.length}
                    icon={<Mail className="h-3.5 w-3.5" />}
                />
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-background">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Resend
                    </div>
                    <Badge
                        variant={stats.resendConfigured ? "default" : "destructive"}
                        className="ml-auto text-[10px]"
                    >
                        {stats.resendConfigured ? "Connected" : "Not configured"}
                    </Badge>
                </div>
            </div>

            {/* Composer (full width) */}
            <EmailComposer subscriberCount={stats.activeSubscribers} />

            {/* Subscribers + Recent Sends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubscriberTable subscribers={subscribers} />
                <RecentEmailsTable emails={recentEmails} />
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon,
}: {
    label: string
    value: number
    icon: React.ReactNode
}) {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-background">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {label}
                </div>
                <div className="text-xl font-bold tabular-nums">{value}</div>
            </div>
        </div>
    )
}
