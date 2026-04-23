"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Sparkles, Loader2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { TEMPLATES, type EmailTemplate } from "./email-blocks"

interface GenerateResult {
    subject: string
    headings: string[]
    texts: string[]
    button: string
    templateName: string
}

interface AIDialogProps {
    onApply: (result: GenerateResult) => void
    currentTemplate: string | null
}

export function AIDialog({ onApply, currentTemplate }: AIDialogProps) {
    const [open, setOpen] = useState(false)
    const [brief, setBrief] = useState("")
    const [templateName, setTemplateName] = useState<string>(
        currentTemplate || TEMPLATES[0].name
    )
    const [tone, setTone] = useState<"nostalgic" | "trendy" | "minimalist">("trendy")
    const [loading, setLoading] = useState(false)

    async function handleGenerate() {
        if (!brief.trim()) {
            toast.error("Describe what this email is about")
            return
        }

        setLoading(true)
        try {
            const resp = await fetch("/api/admin/generate-email-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "full",
                    brief: brief.trim(),
                    templateType: templateName,
                    tone,
                }),
            })

            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}))
                throw new Error(data.error || "Generation failed")
            }

            const data = await resp.json()
            onApply({
                subject: data.subject || "",
                headings: Array.isArray(data.headings) ? data.headings : [],
                texts: Array.isArray(data.texts) ? data.texts : [],
                button: data.button || "",
                templateName,
            })

            toast.success("Copy generated — apply the template to see it")
            setOpen(false)
            setBrief("")
        } catch (err: any) {
            toast.error(err?.message || "Generation failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="gap-2 h-9 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0 shadow-sm"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Generate email copy with AI
                    </DialogTitle>
                    <DialogDescription>
                        Describe your campaign and AI will write the subject line, headings, and paragraphs in Measure Joy's brand voice.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                            What's this email about?
                        </Label>
                        <Textarea
                            value={brief}
                            onChange={(e) => setBrief(e.target.value)}
                            placeholder="e.g. New Canon PowerShot A530 drop, mint condition, $79. It's from 2006, has a 2.5&quot; LCD, perfect for creators wanting that Y2K digital grain."
                            className="min-h-[100px] text-sm"
                            disabled={loading}
                        />
                        <p className="text-[11px] text-muted-foreground">
                            The more specific you are, the better the copy. Include product names, prices, dates, or anything unique.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Template</Label>
                            <Select
                                value={templateName}
                                onValueChange={setTemplateName}
                                disabled={loading}
                            >
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEMPLATES.map((t) => (
                                        <SelectItem key={t.name} value={t.name}>
                                            {t.thumbnail} {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Tone</Label>
                            <Select
                                value={tone}
                                onValueChange={(v) => setTone(v as typeof tone)}
                                disabled={loading}
                            >
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nostalgic">Nostalgic</SelectItem>
                                    <SelectItem value="trendy">Trendy</SelectItem>
                                    <SelectItem value="minimalist">Minimalist</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !brief.trim()}
                        className="gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating…
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Smaller inline AI button used on individual text/heading blocks.
 * Generates copy for a single block based on subject + surrounding context.
 */
interface InlineAIButtonProps {
    blockType: "heading" | "text"
    subject: string
    surroundingContext: string
    onGenerated: (content: string) => void
}

export function InlineAIButton({
    blockType,
    subject,
    surroundingContext,
    onGenerated,
}: InlineAIButtonProps) {
    const [loading, setLoading] = useState(false)

    async function handleClick() {
        setLoading(true)
        try {
            const resp = await fetch("/api/admin/generate-email-copy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "single",
                    blockType,
                    subject,
                    surroundingContext,
                    tone: "trendy",
                }),
            })
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}))
                throw new Error(data.error || "Generation failed")
            }
            const data = await resp.json()
            if (data.content) {
                onGenerated(data.content)
                toast.success("Copy generated")
            }
        } catch (err: any) {
            toast.error(err?.message || "Generation failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={loading}
            className="h-7 w-7 text-pink-600 hover:text-pink-700 hover:bg-pink-50"
            title={`Generate ${blockType} with AI`}
        >
            {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
                <Sparkles className="h-3.5 w-3.5" />
            )}
        </Button>
    )
}
