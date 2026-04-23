"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Trash2, GripVertical, ChevronUp, ChevronDown, Plus } from "lucide-react"
import {
    BLOCK_ICONS,
    BLOCK_LABELS,
    type EmailBlock,
    type HeadingBlock,
    type TextBlock,
    type ImageBlock,
    type ButtonBlock,
    type HeroBlock,
    type TwoColumnBlock,
    type FeatureGridBlock,
    type SpacerBlock,
} from "./email-blocks"
import { InlineAIButton } from "./ai-dialog"

// ---------------------------------------------------------------------------
// Shared block chrome
// ---------------------------------------------------------------------------

interface BlockChromeProps {
    block: EmailBlock
    isFirst: boolean
    isLast: boolean
    onRemove: () => void
    onMove: (dir: "up" | "down") => void
    aiButton?: React.ReactNode
    children: React.ReactNode
}

function BlockChrome({
    block,
    isFirst,
    isLast,
    onRemove,
    onMove,
    aiButton,
    children,
}: BlockChromeProps) {
    const Icon = BLOCK_ICONS[block.type]
    return (
        <div className="group rounded-lg border border-border/70 bg-card overflow-hidden hover:border-border hover:shadow-sm transition-all">
            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/40">
                <div className="flex items-center gap-1.5">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {BLOCK_LABELS[block.type]}
                    </span>
                </div>
                <div className="flex items-center gap-0.5">
                    {aiButton}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMove("up")}
                        disabled={isFirst}
                        className="h-6 w-6 text-muted-foreground"
                        title="Move up"
                    >
                        <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onMove("down")}
                        disabled={isLast}
                        className="h-6 w-6 text-muted-foreground"
                        title="Move down"
                    >
                        <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Remove"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
            <div className="p-3">{children}</div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Individual block editors
// ---------------------------------------------------------------------------

interface EditorProps<T extends EmailBlock> {
    block: T
    update: (updates: Partial<T>) => void
    subject: string
    surroundingContext: string
}

function HeadingEditor({ block, update, subject, surroundingContext }: EditorProps<HeadingBlock>) {
    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={block.content}
                    onChange={(e) => update({ content: e.target.value })}
                    placeholder="Section heading..."
                    className="font-semibold"
                />
                <Select
                    value={String(block.level)}
                    onValueChange={(v) => update({ level: Number(v) as 1 | 2 | 3 })}
                >
                    <SelectTrigger className="w-20 shrink-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">H1</SelectItem>
                        <SelectItem value="2">H2</SelectItem>
                        <SelectItem value="3">H3</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

function TextEditor({ block, update }: EditorProps<TextBlock>) {
    return (
        <Textarea
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            placeholder="Write your paragraph..."
            className="min-h-[80px] text-sm"
        />
    )
}

function ImageEditor({ block, update }: EditorProps<ImageBlock>) {
    return (
        <div className="space-y-2">
            <Input
                value={block.src}
                onChange={(e) => update({ src: e.target.value })}
                placeholder="Image URL (https://...)"
                className="text-sm"
            />
            <Input
                value={block.alt}
                onChange={(e) => update({ alt: e.target.value })}
                placeholder="Alt text (for accessibility)"
                className="text-sm"
            />
            {block.src && (
                <div className="rounded-md border overflow-hidden bg-muted/20">
                    <img
                        src={block.src}
                        alt={block.alt}
                        className="max-h-32 w-full object-contain"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                </div>
            )}
        </div>
    )
}

function ButtonEditor({ block, update }: EditorProps<ButtonBlock>) {
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px] gap-2">
                <Input
                    value={block.label}
                    onChange={(e) => update({ label: e.target.value })}
                    placeholder="Button label"
                    className="text-sm font-semibold"
                />
                <Select
                    value={block.color}
                    onValueChange={(v) => update({ color: v as ButtonBlock["color"] })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pink">Pink</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="teal">Teal</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Input
                value={block.url}
                onChange={(e) => update({ url: e.target.value })}
                placeholder="https://measurejoy.org/..."
                className="text-sm font-mono text-xs"
            />
        </div>
    )
}

function HeroEditor({ block, update }: EditorProps<HeroBlock>) {
    return (
        <div className="space-y-2">
            <Input
                value={block.heading}
                onChange={(e) => update({ heading: e.target.value })}
                placeholder="Hero heading (big, uppercase)"
                className="font-bold text-sm"
            />
            <Input
                value={block.subheading}
                onChange={(e) => update({ subheading: e.target.value })}
                placeholder="Subheading / tagline"
                className="text-sm"
            />
            <div className="grid grid-cols-[1fr_110px] gap-2">
                <Input
                    value={block.backgroundImage}
                    onChange={(e) => update({ backgroundImage: e.target.value })}
                    placeholder="Background image URL (optional)"
                    className="text-xs"
                />
                <Select
                    value={block.background}
                    onValueChange={(v) => update({ background: v as HeroBlock["background"] })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="pink">Pink</SelectItem>
                        <SelectItem value="teal">Teal</SelectItem>
                        <SelectItem value="yellow">Yellow</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

function TwoColumnEditor({ block, update }: EditorProps<TwoColumnBlock>) {
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
                <Input
                    value={block.imageSrc}
                    onChange={(e) => update({ imageSrc: e.target.value })}
                    placeholder="Image URL"
                    className="text-xs"
                />
                <Select
                    value={block.imagePosition}
                    onValueChange={(v) =>
                        update({ imagePosition: v as TwoColumnBlock["imagePosition"] })
                    }
                >
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Image Left</SelectItem>
                        <SelectItem value="right">Image Right</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Input
                value={block.imageAlt}
                onChange={(e) => update({ imageAlt: e.target.value })}
                placeholder="Image alt text"
                className="text-xs"
            />
            <Input
                value={block.heading}
                onChange={(e) => update({ heading: e.target.value })}
                placeholder="Section heading"
                className="font-semibold text-sm"
            />
            <Textarea
                value={block.text}
                onChange={(e) => update({ text: e.target.value })}
                placeholder="Paragraph..."
                className="text-sm min-h-[60px]"
            />
        </div>
    )
}

function FeatureGridEditor({ block, update }: EditorProps<FeatureGridBlock>) {
    const updateItem = (idx: number, patch: Partial<FeatureGridBlock["items"][0]>) => {
        const next = [...block.items]
        next[idx] = { ...next[idx], ...patch }
        update({ items: next })
    }

    const removeItem = (idx: number) => {
        update({ items: block.items.filter((_, i) => i !== idx) })
    }

    const addItem = () => {
        update({ items: [...block.items, { icon: "✨", label: "New item", description: "" }] })
    }

    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-2">
                <Label className="text-[11px] text-muted-foreground">Columns:</Label>
                <Select
                    value={String(block.columns)}
                    onValueChange={(v) => update({ columns: Number(v) as 2 | 3 })}
                >
                    <SelectTrigger className="w-20 h-7 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground ml-auto">
                    {block.items.length} item{block.items.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="space-y-1.5">
                {block.items.map((item, idx) => (
                    <div
                        key={idx}
                        className="grid grid-cols-[40px_1fr_1.5fr_28px] gap-1.5 items-start"
                    >
                        <Input
                            value={item.icon}
                            onChange={(e) => updateItem(idx, { icon: e.target.value })}
                            placeholder="✨"
                            className="text-center text-base h-9 px-1"
                            maxLength={4}
                        />
                        <Input
                            value={item.label}
                            onChange={(e) => updateItem(idx, { label: e.target.value })}
                            placeholder="Label"
                            className="text-xs h-9 font-semibold"
                        />
                        <Input
                            value={item.description}
                            onChange={(e) => updateItem(idx, { description: e.target.value })}
                            placeholder="Short description"
                            className="text-xs h-9"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(idx)}
                            className="h-9 w-7 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                className="w-full h-7 text-xs gap-1"
            >
                <Plus className="h-3 w-3" />
                Add feature
            </Button>
        </div>
    )
}

function SpacerEditor({ block, update }: EditorProps<SpacerBlock>) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                    Height:
                </Label>
                <Input
                    type="number"
                    min={8}
                    max={120}
                    step={4}
                    value={block.height}
                    onChange={(e) => update({ height: Math.max(8, Math.min(120, parseInt(e.target.value) || 32)) })}
                    className="h-8 w-20 text-xs"
                />
                <span className="text-[11px] text-muted-foreground">px</span>
                <div className="flex gap-1 ml-auto">
                    {[16, 32, 48, 64].map((preset) => (
                        <Button
                            key={preset}
                            variant={block.height === preset ? "default" : "outline"}
                            size="sm"
                            onClick={() => update({ height: preset })}
                            className="h-7 px-2 text-[11px]"
                        >
                            {preset}
                        </Button>
                    ))}
                </div>
            </div>
            <div
                className="bg-muted/40 rounded border-2 border-dashed border-border/60"
                style={{ height: `${block.height}px`, minHeight: "16px" }}
            />
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main block editor (delegates to per-type editor)
// ---------------------------------------------------------------------------

interface BlockEditorProps {
    block: EmailBlock
    isFirst: boolean
    isLast: boolean
    subject: string
    surroundingContext: string
    onUpdate: (updates: Partial<EmailBlock>) => void
    onRemove: () => void
    onMove: (dir: "up" | "down") => void
}

export function BlockEditor({
    block,
    isFirst,
    isLast,
    subject,
    surroundingContext,
    onUpdate,
    onRemove,
    onMove,
}: BlockEditorProps) {
    const aiButton =
        block.type === "heading" || block.type === "text" ? (
            <InlineAIButton
                blockType={block.type}
                subject={subject}
                surroundingContext={surroundingContext}
                onGenerated={(content) => onUpdate({ content } as Partial<EmailBlock>)}
            />
        ) : null

    const commonProps = {
        subject,
        surroundingContext,
    }

    return (
        <BlockChrome
            block={block}
            isFirst={isFirst}
            isLast={isLast}
            onRemove={onRemove}
            onMove={onMove}
            aiButton={aiButton}
        >
            {block.type === "heading" && (
                <HeadingEditor
                    block={block}
                    update={(u) => onUpdate(u as Partial<EmailBlock>)}
                    {...commonProps}
                />
            )}
            {block.type === "text" && (
                <TextEditor
                    block={block}
                    update={(u) => onUpdate(u as Partial<EmailBlock>)}
                    {...commonProps}
                />
            )}
            {block.type === "image" && (
                <ImageEditor
                    block={block}
                    update={(u) => onUpdate(u as Partial<EmailBlock>)}
                    {...commonProps}
                />
            )}
            {block.type === "button" && (
                <ButtonEditor
                    block={block}
                    update={(u) => onUpdate(u as Partial<EmailBlock>)}
                    {...commonProps}
                />
            )}
            {block.type === "divider" && (
                <div className="py-2">
                    <hr className="border-border border-t-2" />
                </div>
            )}
            {block.type === "hero" && (
                <HeroEditor
                    block={block}
                    update={(u) => onUpdate(u as Partial<EmailBlock>)}
                    {...commonProps}
                />
            )}
            {block.type === "two_column" && (
                <TwoColumnEditor
                    block={block}
                    update={(u) => onUpdate(u as Partial<EmailBlock>)}
                    {...commonProps}
                />
            )}
            {block.type === "feature_grid" && (
                <FeatureGridEditor
                    block={block}
                    update={(u) => onUpdate(u as Partial<EmailBlock>)}
                    {...commonProps}
                />
            )}
            {block.type === "spacer" && (
                <SpacerEditor
                    block={block}
                    update={(u) => onUpdate(u as Partial<EmailBlock>)}
                    {...commonProps}
                />
            )}
        </BlockChrome>
    )
}
