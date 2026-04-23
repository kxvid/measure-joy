"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import {
    Send,
    FlaskConical,
    Loader2,
    Eye,
    Pencil,
    Plus,
    Trash2,
    GripVertical,
    Type,
    Image,
    SeparatorHorizontal,
    Link2,
} from "lucide-react"
import { toast } from "sonner"
import { sendBroadcastEmail, sendTestEmail } from "@/app/actions/emails"

// --- Block types ---

type BlockType = "text" | "heading" | "image" | "button" | "divider"

interface TextBlock {
    type: "text"
    id: string
    content: string
}

interface HeadingBlock {
    type: "heading"
    id: string
    content: string
}

interface ImageBlock {
    type: "image"
    id: string
    src: string
    alt: string
}

interface ButtonBlock {
    type: "button"
    id: string
    label: string
    url: string
}

interface DividerBlock {
    type: "divider"
    id: string
}

type EmailBlock = TextBlock | HeadingBlock | ImageBlock | ButtonBlock | DividerBlock

// --- Templates as structured blocks ---

interface EmailTemplate {
    name: string
    subject: string
    blocks: EmailBlock[]
}

let blockCounter = 0
function newId() {
    return `blk_${++blockCounter}_${Date.now()}`
}

const TEMPLATES: EmailTemplate[] = [
    {
        name: "Blank",
        subject: "",
        blocks: [
            { type: "heading", id: "t0h", content: "" },
            { type: "text", id: "t0t", content: "" },
            { type: "button", id: "t0b", label: "Shop Now", url: "https://measurejoy.org/shop" },
        ],
    },
    {
        name: "New Drop",
        subject: "New Camera Drop",
        blocks: [
            { type: "heading", id: "t1h", content: "Fresh Drop Alert" },
            { type: "text", id: "t1t", content: "We just added some rare finds to the shop. These won't last long." },
            { type: "button", id: "t1b", label: "Shop Now", url: "https://measurejoy.org/shop" },
        ],
    },
    {
        name: "Sale",
        subject: "Limited Time Sale - Don't Miss Out",
        blocks: [
            { type: "heading", id: "t2h", content: "Sale Is Live" },
            { type: "text", id: "t2t1", content: "For a limited time, select cameras are marked down. Once they're gone, they're gone." },
            { type: "button", id: "t2b", label: "View Sale", url: "https://measurejoy.org/shop" },
        ],
    },
    {
        name: "Update",
        subject: "What's New at Measure Joy",
        blocks: [
            { type: "heading", id: "t3h", content: "Quick Update" },
            { type: "text", id: "t3t1", content: "Hey! Just wanted to share some updates from the shop." },
            { type: "text", id: "t3t2", content: "Write your update here..." },
            { type: "button", id: "t3b", label: "Visit Site", url: "https://measurejoy.org" },
        ],
    },
    {
        name: "Product Feature",
        subject: "Check This Out",
        blocks: [
            { type: "heading", id: "t4h", content: "Featured Camera" },
            { type: "image", id: "t4i", src: "", alt: "Product image" },
            { type: "text", id: "t4t", content: "Describe the featured product here. What makes it special, condition, unique features..." },
            { type: "button", id: "t4b", label: "View Product", url: "https://measurejoy.org/shop" },
        ],
    },
]

// --- HTML generator ---

function blocksToHtml(blocks: EmailBlock[]): string {
    const year = new Date().getFullYear()

    const innerHtml = blocks
        .map((block) => {
            switch (block.type) {
                case "heading":
                    return `    <h2 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px 0;">${escapeHtml(block.content)}</h2>`
                case "text":
                    return `    <p style="font-size: 16px; line-height: 1.6; color: #444; margin: 0 0 16px 0;">${escapeHtml(block.content).replace(/\n/g, "<br>")}</p>`
                case "image":
                    if (!block.src) return ""
                    return `    <div style="text-align: center; margin: 24px 0;">
      <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" style="max-width: 100%; height: auto; border-radius: 8px;" />
    </div>`
                case "button":
                    return `    <div style="text-align: center; margin: 32px 0;">
      <a href="${escapeHtml(block.url)}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px;">${escapeHtml(block.label)}</a>
    </div>`
                case "divider":
                    return `    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />`
                default:
                    return ""
            }
        })
        .filter(Boolean)
        .join("\n")

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #f5f5f5;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; font-weight: 800; margin: 0; color: #1a1a1a;">MEASURE JOY</h1>
      <p style="color: #666; margin-top: 8px; font-size: 14px;">Y2K Digital Cameras & Retro Tech</p>
    </div>

    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
${innerHtml}
    </div>

    <p style="font-size: 12px; color: #999; text-align: center; margin-top: 32px;">
      &copy; ${year} Measure Joy. Curated Y2K tech with love.
    </p>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

// --- Block icons ---

const BLOCK_ICONS: Record<BlockType, typeof Type> = {
    text: Type,
    heading: Type,
    image: Image,
    button: Link2,
    divider: SeparatorHorizontal,
}

const BLOCK_LABELS: Record<BlockType, string> = {
    text: "Text",
    heading: "Heading",
    image: "Image",
    button: "Button",
    divider: "Divider",
}

// --- Component ---

interface EmailComposerProps {
    subscriberCount: number
}

export function EmailComposer({ subscriberCount }: EmailComposerProps) {
    const [subject, setSubject] = useState("")
    const [blocks, setBlocks] = useState<EmailBlock[]>(TEMPLATES[0].blocks)
    const [audience, setAudience] = useState<"active" | "all">("active")
    const [testTo, setTestTo] = useState("")
    const [sending, setSending] = useState(false)
    const [sendingTest, setSendingTest] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [tab, setTab] = useState<"edit" | "preview">("edit")

    const html = useMemo(() => blocksToHtml(blocks), [blocks])
    const hasContent = subject.trim() && blocks.some((b) => {
        if (b.type === "divider") return false
        if (b.type === "text" || b.type === "heading") return b.content.trim().length > 0
        if (b.type === "button") return b.label.trim().length > 0
        if (b.type === "image") return b.src.trim().length > 0
        return false
    })

    function applyTemplate(name: string) {
        const t = TEMPLATES.find((t) => t.name === name)
        if (t) {
            setSubject(t.subject)
            setBlocks(t.blocks.map((b) => ({ ...b, id: newId() })))
        }
    }

    function updateBlock(id: string, updates: Partial<EmailBlock>) {
        setBlocks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, ...updates } as EmailBlock : b))
        )
    }

    function addBlock(type: BlockType) {
        const id = newId()
        let block: EmailBlock
        switch (type) {
            case "text":
                block = { type: "text", id, content: "" }
                break
            case "heading":
                block = { type: "heading", id, content: "" }
                break
            case "image":
                block = { type: "image", id, src: "", alt: "" }
                break
            case "button":
                block = { type: "button", id, label: "Shop Now", url: "https://measurejoy.org/shop" }
                break
            case "divider":
                block = { type: "divider", id }
                break
        }
        setBlocks((prev) => [...prev, block])
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

    async function handleSendTest() {
        if (!testTo.trim()) {
            toast.error("Enter a test email address")
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
            toast.success(`Broadcast sent to ${result.sent} subscriber${result.sent !== 1 ? "s" : ""}`)
            setSubject("")
            setBlocks(TEMPLATES[0].blocks.map((b) => ({ ...b, id: newId() })))
        } else {
            toast.error(result.error || "Broadcast failed")
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Compose Email
                        </CardTitle>
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                            <Button
                                size="sm"
                                variant={tab === "edit" ? "default" : "ghost"}
                                onClick={() => setTab("edit")}
                                className="h-7 px-3 gap-1.5 text-xs"
                            >
                                <Pencil className="h-3 w-3" />
                                Editor
                            </Button>
                            <Button
                                size="sm"
                                variant={tab === "preview" ? "default" : "ghost"}
                                onClick={() => setTab("preview")}
                                className="h-7 px-3 gap-1.5 text-xs"
                            >
                                <Eye className="h-3 w-3" />
                                Preview
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Subject + Template */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Subject</Label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject line..."
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Template</Label>
                            <Select onValueChange={applyTemplate}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Load template..." />
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
                    </div>

                    {/* Editor / Preview */}
                    {tab === "edit" ? (
                        <div className="space-y-3">
                            <div className="border rounded-lg divide-y">
                                {blocks.map((block, idx) => (
                                    <BlockEditor
                                        key={block.id}
                                        block={block}
                                        isFirst={idx === 0}
                                        isLast={idx === blocks.length - 1}
                                        onUpdate={(updates) => updateBlock(block.id, updates)}
                                        onRemove={() => removeBlock(block.id)}
                                        onMove={(dir) => moveBlock(block.id, dir)}
                                    />
                                ))}
                                {blocks.length === 0 && (
                                    <div className="p-8 text-center text-sm text-muted-foreground">
                                        Add content blocks below to start building your email.
                                    </div>
                                )}
                            </div>

                            {/* Add block row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground font-medium">Add:</span>
                                {(["heading", "text", "image", "button", "divider"] as BlockType[]).map(
                                    (type) => {
                                        const Icon = BLOCK_ICONS[type]
                                        return (
                                            <Button
                                                key={type}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addBlock(type)}
                                                className="h-8 gap-1.5 text-xs"
                                            >
                                                <Icon className="h-3 w-3" />
                                                {BLOCK_LABELS[type]}
                                            </Button>
                                        )
                                    }
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden bg-[#f5f5f5]">
                            <iframe
                                srcDoc={html}
                                title="Email preview"
                                className="w-full border-0"
                                style={{ height: "500px" }}
                            />
                        </div>
                    )}

                    {/* Audience + Send row */}
                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Label className="text-sm font-medium w-20 shrink-0">Audience</Label>
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

                        <div className="flex items-center gap-3">
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
                                    disabled={sendingTest || !hasContent}
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
                                disabled={!hasContent || subscriberCount === 0}
                                className="gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Send Broadcast
                            </Button>
                        </div>
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

// --- Block editor ---

function BlockEditor({
    block,
    isFirst,
    isLast,
    onUpdate,
    onRemove,
    onMove,
}: {
    block: EmailBlock
    isFirst: boolean
    isLast: boolean
    onUpdate: (updates: Partial<EmailBlock>) => void
    onRemove: () => void
    onMove: (dir: "up" | "down") => void
}) {
    const Icon = BLOCK_ICONS[block.type]

    return (
        <div className="flex items-start gap-2 p-3 group">
            {/* Drag handle + reorder */}
            <div className="flex flex-col items-center gap-0.5 pt-1">
                <button
                    onClick={() => onMove("up")}
                    disabled={isFirst}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none"
                    title="Move up"
                >
                    ▲
                </button>
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                <button
                    onClick={() => onMove("down")}
                    disabled={isLast}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none"
                    title="Move down"
                >
                    ▼
                </button>
            </div>

            {/* Block content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {BLOCK_LABELS[block.type]}
                    </span>
                </div>

                {block.type === "heading" && (
                    <Input
                        value={block.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        placeholder="Heading text..."
                        className="font-semibold"
                    />
                )}

                {block.type === "text" && (
                    <Textarea
                        value={block.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        placeholder="Write your paragraph here..."
                        className="min-h-[80px] text-sm"
                    />
                )}

                {block.type === "image" && (
                    <div className="space-y-2">
                        <Input
                            value={block.src}
                            onChange={(e) => onUpdate({ src: e.target.value })}
                            placeholder="Image URL (https://...)"
                            className="text-sm"
                        />
                        <Input
                            value={block.alt}
                            onChange={(e) => onUpdate({ alt: e.target.value })}
                            placeholder="Alt text (for accessibility)"
                            className="text-sm"
                        />
                        {block.src && (
                            <div className="rounded border overflow-hidden bg-muted/30 max-w-[300px]">
                                <img
                                    src={block.src}
                                    alt={block.alt}
                                    className="w-full h-auto"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none"
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {block.type === "button" && (
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            value={block.label}
                            onChange={(e) => onUpdate({ label: e.target.value })}
                            placeholder="Button text..."
                            className="text-sm"
                        />
                        <Input
                            value={block.url}
                            onChange={(e) => onUpdate({ url: e.target.value })}
                            placeholder="https://measurejoy.org/..."
                            className="text-sm"
                        />
                    </div>
                )}

                {block.type === "divider" && (
                    <hr className="border-dashed" />
                )}
            </div>

            {/* Remove */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                title="Remove block"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    )
}
