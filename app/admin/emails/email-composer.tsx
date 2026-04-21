"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Send, FlaskConical, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { sendBroadcastEmail, sendTestEmail } from "@/app/actions/emails"

const TEMPLATES = [
    {
        name: "Blank",
        subject: "",
        body: "",
    },
    {
        name: "New Drop",
        subject: "New Camera Drop \u{1F4F7}",
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 28px; font-weight: 800; margin: 0; color: #1a1a1a;">MEASURE JOY</h1>
    <p style="color: #666; margin-top: 8px;">Y2K Digital Cameras & Retro Tech</p>
  </div>
  <h2 style="font-size: 24px; font-weight: 700; color: #1a1a1a;">Fresh Drop Alert</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #444;">We just added some rare finds to the shop. These won't last long.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://measurejoy.org/shop" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Shop Now</a>
  </div>
  <p style="font-size: 14px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 24px;">&copy; ${new Date().getFullYear()} Measure Joy</p>
</div>`,
    },
    {
        name: "Sale",
        subject: "Limited Time Sale - Don't Miss Out",
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 28px; font-weight: 800; margin: 0; color: #1a1a1a;">MEASURE JOY</h1>
    <p style="color: #666; margin-top: 8px;">Y2K Digital Cameras & Retro Tech</p>
  </div>
  <h2 style="font-size: 24px; font-weight: 700; color: #1a1a1a;">Sale Is Live</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #444;">For a limited time, select cameras are marked down. Once they're gone, they're gone.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://measurejoy.org/shop" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">View Sale</a>
  </div>
  <p style="font-size: 14px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 24px;">&copy; ${new Date().getFullYear()} Measure Joy</p>
</div>`,
    },
    {
        name: "Update",
        subject: "What's New at Measure Joy",
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 28px; font-weight: 800; margin: 0; color: #1a1a1a;">MEASURE JOY</h1>
    <p style="color: #666; margin-top: 8px;">Y2K Digital Cameras & Retro Tech</p>
  </div>
  <h2 style="font-size: 24px; font-weight: 700; color: #1a1a1a;">Quick Update</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #444;">Hey! Just wanted to share some updates from the shop.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #444;">Write your update here...</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://measurejoy.org" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Visit Site</a>
  </div>
  <p style="font-size: 14px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 24px;">&copy; ${new Date().getFullYear()} Measure Joy</p>
</div>`,
    },
]

interface EmailComposerProps {
    subscriberCount: number
}

export function EmailComposer({ subscriberCount }: EmailComposerProps) {
    const [subject, setSubject] = useState("")
    const [body, setBody] = useState("")
    const [audience, setAudience] = useState<"active" | "all">("active")
    const [testTo, setTestTo] = useState("")
    const [sending, setSending] = useState(false)
    const [sendingTest, setSendingTest] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    function applyTemplate(name: string) {
        const t = TEMPLATES.find((t) => t.name === name)
        if (t) {
            setSubject(t.subject)
            setBody(t.body)
        }
    }

    async function handleSendTest() {
        if (!testTo.trim()) {
            toast.error("Enter a test email address")
            return
        }
        setSendingTest(true)
        const result = await sendTestEmail(testTo.trim(), subject, body)
        setSendingTest(false)
        if (result.success) {
            toast.success(`Test email sent to ${testTo}`)
        } else {
            toast.error(result.error || "Failed to send test email")
        }
    }

    async function handleBroadcast() {
        setSending(true)
        const result = await sendBroadcastEmail(subject, body, audience)
        setSending(false)
        setConfirmOpen(false)
        if (result.success) {
            toast.success(`Broadcast sent to ${result.sent} subscriber${result.sent !== 1 ? "s" : ""}`)
            setSubject("")
            setBody("")
        } else {
            toast.error(result.error || "Broadcast failed")
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Compose Email
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium w-20 shrink-0">Template</label>
                        <Select onValueChange={applyTemplate}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Start from template..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPLATES.map((t) => (
                                    <SelectItem key={t.name} value={t.name}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium w-20 shrink-0">Subject</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject line..."
                        />
                    </div>

                    <div className="flex items-start gap-3">
                        <label className="text-sm font-medium w-20 shrink-0 pt-2">Body</label>
                        <Textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="HTML email body..."
                            className="min-h-[200px] font-mono text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium w-20 shrink-0">Audience</label>
                        <Select value={audience} onValueChange={(v) => setAudience(v as "active" | "all")}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active subscribers</SelectItem>
                                <SelectItem value="all">All subscribers</SelectItem>
                            </SelectContent>
                        </Select>
                        <Badge variant="secondary">{subscriberCount} active</Badge>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t">
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                value={testTo}
                                onChange={(e) => setTestTo(e.target.value)}
                                placeholder="test@example.com"
                                className="max-w-64"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSendTest}
                                disabled={sendingTest || !subject.trim() || !body.trim()}
                                className="gap-2"
                            >
                                {sendingTest ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <FlaskConical className="h-3.5 w-3.5" />
                                )}
                                Send Test
                            </Button>
                        </div>
                        <Button
                            onClick={() => setConfirmOpen(true)}
                            disabled={!subject.trim() || !body.trim() || subscriberCount === 0}
                            className="gap-2"
                        >
                            <Send className="h-4 w-4" />
                            Send Broadcast
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send broadcast email?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will send &ldquo;{subject}&rdquo; to{" "}
                            <strong>{subscriberCount}</strong> {audience} subscriber
                            {subscriberCount !== 1 ? "s" : ""}. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBroadcast} disabled={sending} className="gap-2">
                            {sending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Send to {subscriberCount}
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
