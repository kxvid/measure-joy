"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
    TEMPLATES,
    createDefaultBlock,
    newId,
    type EmailBlock,
    type BlockType,
    type EmailTemplate,
} from "./email-blocks"
import { blocksToHtml } from "./email-html"
import { BlockEditor } from "./block-editors"
import { BlockPicker } from "./block-picker"
import { TemplateGallery } from "./template-gallery"
import { EmailPreview } from "./email-preview"
import { AIDialog } from "./ai-dialog"

interface EmailComposerProps {
    subscriberCount: number
}

export function EmailComposer({ subscriberCount }: EmailComposerProps) {
    const [subject, setSubject] = useState(TEMPLATES[0].subject)
    const [blocks, setBlocks] = useState<EmailBlock[]>(() =>
        TEMPLATES[0].blocks.map((b) => ({ ...b, id: newId() }))
    )
    const [currentTemplate, setCurrentTemplate] = useState<string | null>(
        TEMPLATES[0].name
    )
    const [audience, setAudience] = useState<"active" | "all">("active")
    const [testTo, setTestTo] = useState("")
    const [sending, setSending] = useState(false)
    const [sendingTest, setSendingTest] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const html = useMemo(() => blocksToHtml(blocks), [blocks])

    const hasContent =
        subject.trim().length > 0 &&
        blocks.some((b) => {
            if (b.type === "divider" || b.type === "spacer") return false
            if (b.type === "text" || b.type === "heading") return b.content.trim().length > 0
            if (b.type === "button") return b.label.trim().length > 0
            if (b.type === "image") return b.src.trim().length > 0
            if (b.type === "hero") return b.heading.trim().length > 0
            if (b.type === "two_column") return b.heading.trim().length > 0 || b.text.trim().length > 0
            if (b.type === "feature_grid") return b.items.length > 0
            return false
        })

    // --- Block mutators ---

    function applyTemplate(template: EmailTemplate) {
        setSubject(template.subject)
        setBlocks(template.blocks.map((b) => ({ ...b, id: newId() })))
        setCurrentTemplate(template.name)
        toast.success(`${template.name} template loaded`)
    }

    function addBlock(type: BlockType) {
        setBlocks((prev) => [...prev, createDefaultBlock(type)])
    }

    function updateBlock(id: string, updates: Partial<EmailBlock>) {
        setBlocks((prev) =>
            prev.map((b) => (b.id === id ? ({ ...b, ...updates } as EmailBlock) : b))
        )
    }

    function removeBlock(id: string) {
        setBlocks((prev) => prev.filter((b) => b.id !== id))
    }

    function moveBlock(id: string, direction: "up" | "down") {
        setBlocks((prev) => {
            const idx = prev.findIndex((b) => b.id === id)
            if (idx < 0) return prev
            const target = direction === "up" ? idx - 1 : idx + 1
            if (target < 0 || target >= prev.length) return prev
            const next = [...prev]
            ;[next[idx], next[target]] = [next[target], next[idx]]
            return next
        })
    }

    // --- AI full-email apply ---

    function applyAIResult(result: {
        subject: string
        headings: string[]
        texts: string[]
        button: string
        templateName: string
    }) {
        const template = TEMPLATES.find((t) => t.name === result.templateName)
        if (!template) return

        // Start from the chosen template, then fill text/heading/button content
        // from the AI result in order.
        const freshBlocks = template.blocks.map((b) => ({ ...b, id: newId() }))
        let hIdx = 0
        let tIdx = 0
        const filled = freshBlocks.map((b) => {
            if (b.type === "heading" && result.headings[hIdx]) {
                return { ...b, content: result.headings[hIdx++] } as EmailBlock
            }
            if (b.type === "hero" && result.headings[hIdx]) {
                return { ...b, heading: result.headings[hIdx++] } as EmailBlock
            }
            if (b.type === "text" && result.texts[tIdx]) {
                return { ...b, content: result.texts[tIdx++] } as EmailBlock
            }
            if (b.type === "button" && result.button) {
                return { ...b, label: result.button } as EmailBlock
            }
            return b
        })

        setSubject(result.subject || template.subject)
        setBlocks(filled)
        setCurrentTemplate(template.name)
    }

    // --- Send handlers ---

    async function handleSendTest() {
        if (!testTo.trim()) {
            toast.error("Enter a test email address")
            return
        }
        if (!hasContent) {
            toast.error("Add some content first")
            return
        }
        setSendingTest(true)
        const result = await sendTestEmail(testTo.trim(), subject, html)
        setSendingTest(false)
        if (result.success) {
            toast.success(`Test email sent to ${testTo}`)
        } else {
            toast.error(result.error || "Failed to send test email")
        }
    }

    async function handleBroadcast() {
        setSending(true)
        const result = await sendBroadcastEmail(subject, html, audience)
        setSending(false)
        setConfirmOpen(false)
        if (result.success) {
            toast.success(
                `Broadcast sent to ${result.sent} subscriber${result.sent !== 1 ? "s" : ""}`
            )
        } else {
            toast.error(result.error || "Broadcast failed")
        }
    }

    // --- Surrounding context for AI (inline buttons) ---

    function surroundingContextFor(blockId: string): string {
        const contextBlocks = blocks.filter((b) => b.id !== blockId)
        return contextBlocks
            .map((b) => {
                if (b.type === "heading") return `Heading: ${b.content}`
                if (b.type === "text") return `Text: ${b.content}`
                if (b.type === "hero") return `Hero: ${b.heading} — ${b.subheading}`
                if (b.type === "button") return `Button: ${b.label}`
                return null
            })
            .filter(Boolean)
            .join("\n")
    }

    return (
        <div className="rounded-2xl border bg-background overflow-hidden shadow-sm">
            {/* Top toolbar: subject + template + AI */}
            <div className="px-5 py-4 border-b bg-muted/30">
                <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                            Subject line
                        </Label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Fresh drop: Just landed..."
                            className="h-10 font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <TemplateGallery
                            currentTemplate={currentTemplate}
                            onSelect={applyTemplate}
                        />
                        <AIDialog currentTemplate={currentTemplate} onApply={applyAIResult} />
                    </div>
                </div>
                {currentTemplate && (
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Template:</span>
                        <Badge variant="secondary" className="text-[10px] h-5">
                            {currentTemplate}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Split screen: editor | preview */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                {/* Editor panel */}
                <div className="border-r bg-background flex flex-col">
                    <div className="px-5 py-3 border-b bg-background/80 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Editor
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                            {blocks.length} block{blocks.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <div
                        className="overflow-y-auto p-4 space-y-2"
                        style={{ maxHeight: "calc(100vh - 380px)", minHeight: "500px" }}
                    >
                        {blocks.map((block, idx) => (
                            <BlockEditor
                                key={block.id}
                                block={block}
                                isFirst={idx === 0}
                                isLast={idx === blocks.length - 1}
                                subject={subject}
                                surroundingContext={surroundingContextFor(block.id)}
                                onUpdate={(updates) => updateBlock(block.id, updates)}
                                onRemove={() => removeBlock(block.id)}
                                onMove={(dir) => moveBlock(block.id, dir)}
                            />
                        ))}

                        {blocks.length === 0 && (
                            <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                                <p className="text-sm">No blocks yet.</p>
                                <p className="text-xs mt-1">Click "Add block" to get started.</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <BlockPicker onAdd={addBlock} primary />
                        </div>
                    </div>
                </div>

                {/* Preview panel */}
                <div className="bg-muted/20">
                    <EmailPreview html={html} subject={subject} />
                </div>
            </div>

            {/* Bottom: audience + send controls */}
            <div className="border-t bg-muted/20 px-5 py-4 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                        Send to:
                    </Label>
                    <Select
                        value={audience}
                        onValueChange={(v) => setAudience(v as "active" | "all")}
                    >
                        <SelectTrigger className="w-44 h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active subscribers</SelectItem>
                            <SelectItem value="all">All subscribers</SelectItem>
                        </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="font-mono">
                        {subscriberCount}
                    </Badge>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    <Input
                        value={testTo}
                        onChange={(e) => setTestTo(e.target.value)}
                        placeholder="test@example.com"
                        className="h-9 w-52 text-sm"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendTest}
                        disabled={sendingTest || !hasContent}
                        className="h-9 gap-2"
                    >
                        {sendingTest ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <FlaskConical className="h-3.5 w-3.5" />
                        )}
                        Send Test
                    </Button>
                    <Button
                        onClick={() => setConfirmOpen(true)}
                        disabled={!hasContent || subscriberCount === 0}
                        className="h-9 gap-2 shadow-sm"
                    >
                        <Send className="h-4 w-4" />
                        Send Broadcast
                    </Button>
                </div>
            </div>

            {/* Confirm dialog */}
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
                        <AlertDialogAction
                            onClick={handleBroadcast}
                            disabled={sending}
                            className="gap-2"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending…
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
        </div>
    )
}
