import { checkAdminAccess } from "@/app/actions/auth-admin"
import { getEmailStats, getSubscribers, getRecentEmails } from "@/app/actions/emails"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Email Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage subscribers and send emails via Resend
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSubscribers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Recent Sends</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recentEmails.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Resend Status</CardTitle>
                        {stats.resendConfigured ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <Badge variant={stats.resendConfigured ? "default" : "destructive"}>
                            {stats.resendConfigured ? "Connected" : "Not configured"}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Compose */}
            <EmailComposer subscriberCount={stats.activeSubscribers} />

            {/* Two-column: Subscribers + Recent Sends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubscriberTable subscribers={subscribers} />
                <RecentEmailsTable emails={recentEmails} />
            </div>
        </div>
    )
}
