"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, GripVertical } from "lucide-react"

// Template shapes for object_list fields so "Add Item" on empty lists creates
// usable fields (matches SECTION_SCHEMA key-paths in the parent page).
const OBJECT_LIST_TEMPLATES: Record<string, Record<string, any>> = {
    "promo_banner.items": { text: "", link: "" },
    "trust_badges.items": { text: "", icon: "" },
    "trust_banner.items": { text: "", icon: "" },
    "trust_story.points": { title: "", description: "" },
    "testimonials.items": { name: "", text: "", rating: 5 },
    "about.values": { title: "", description: "" },
}

export interface FieldDef {
    key: string
    label: string
    type: "text" | "textarea" | "list" | "object_list" | "stat_list"
}

interface FieldEditorProps {
    field: FieldDef
    section: string
    value: any
    onChange: (val: any) => void
    isModified?: boolean
}

// Shared wrapper for text/textarea: clean label + input with a subtle
// "modified" dot on the side.
function FieldShell({
    label,
    isModified,
    children,
}: {
    label: string
    isModified?: boolean
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <Label className="text-[13px] font-medium text-foreground/90">{label}</Label>
                {isModified && (
                    <span
                        className="h-1.5 w-1.5 rounded-full bg-pop-pink"
                        title="Modified"
                        aria-label="Modified"
                    />
                )}
            </div>
            {children}
        </div>
    )
}

// Shared wrapper for list-style fields (list, stat_list, object_list): replaces
// the heavier Card component with a cleaner, subtler container.
function ListShell({
    label,
    description,
    isModified,
    children,
}: {
    label: string
    description?: string
    isModified?: boolean
    children: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-border/70 bg-card/50 overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/30">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-semibold text-foreground/90">{label}</h3>
                        {isModified && (
                            <span
                                className="h-1.5 w-1.5 rounded-full bg-pop-pink"
                                title="Modified"
                                aria-label="Modified"
                            />
                        )}
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            <div className="p-4 space-y-3">{children}</div>
        </div>
    )
}

export function FieldEditor({
    field,
    section,
    value,
    onChange,
    isModified,
}: FieldEditorProps) {
    if (field.type === "text") {
        return (
            <FieldShell label={field.label} isModified={isModified}>
                <Input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="bg-background"
                />
            </FieldShell>
        )
    }

    if (field.type === "textarea") {
        return (
            <FieldShell label={field.label} isModified={isModified}>
                <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                />
            </FieldShell>
        )
    }

    if (field.type === "list") {
        const items: string[] = Array.isArray(value) ? value : []
        return (
            <ListShell
                label={field.label}
                description={`${items.length} item${items.length !== 1 ? "s" : ""}`}
                isModified={isModified}
            >
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                        <span className="text-[10px] font-mono text-muted-foreground w-5 text-center flex-shrink-0">
                            {i + 1}
                        </span>
                        <Input
                            value={item}
                            onChange={(e) => {
                                const next = [...items]
                                next[i] = e.target.value
                                onChange(next)
                            }}
                            className="bg-background"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onChange(items.filter((_, j) => j !== i))}
                            className="flex-shrink-0 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                            title="Remove item"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-1">No items yet.</p>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...items, ""])}
                    className="gap-1.5 h-8 text-xs"
                >
                    <Plus className="h-3 w-3" />
                    Add item
                </Button>
            </ListShell>
        )
    }

    if (field.type === "stat_list") {
        const items: { value: string; label: string }[] = Array.isArray(value) ? value : []
        return (
            <ListShell
                label={field.label}
                description={`${items.length} stat${items.length !== 1 ? "s" : ""}`}
                isModified={isModified}
            >
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                        <span className="text-[10px] font-mono text-muted-foreground w-5 text-center flex-shrink-0">
                            {i + 1}
                        </span>
                        <Input
                            value={item.value}
                            onChange={(e) => {
                                const next = [...items]
                                next[i] = { ...next[i], value: e.target.value }
                                onChange(next)
                            }}
                            placeholder="2,500+"
                            className="w-32 bg-background font-semibold"
                        />
                        <Input
                            value={item.label}
                            onChange={(e) => {
                                const next = [...items]
                                next[i] = { ...next[i], label: e.target.value }
                                onChange(next)
                            }}
                            placeholder="Happy customers"
                            className="bg-background"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onChange(items.filter((_, j) => j !== i))}
                            className="flex-shrink-0 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                            title="Remove stat"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-1">No stats yet.</p>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange([...items, { value: "", label: "" }])}
                    className="gap-1.5 h-8 text-xs"
                >
                    <Plus className="h-3 w-3" />
                    Add stat
                </Button>
            </ListShell>
        )
    }

    if (field.type === "object_list") {
        const items: Record<string, any>[] = Array.isArray(value) ? value : []

        if (items.length === 0) {
            return (
                <ListShell label={field.label} description="Empty" isModified={isModified}>
                    <p className="text-xs text-muted-foreground italic py-1">No items yet.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const templateKey = `${section}.${field.key}`
                            const template = OBJECT_LIST_TEMPLATES[templateKey] || {}
                            onChange([{ ...template }])
                        }}
                        className="gap-1.5 h-8 text-xs"
                    >
                        <Plus className="h-3 w-3" />
                        Add item
                    </Button>
                </ListShell>
            )
        }

        // Infer fields from the first item
        const objectKeys = Object.keys(items[0]).filter((k) => k !== "icon" && k !== "color")

        return (
            <ListShell
                label={field.label}
                description={`${items.length} item${items.length !== 1 ? "s" : ""}`}
                isModified={isModified}
            >
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="rounded-lg border border-border/60 bg-background p-3.5 space-y-3 relative group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center h-5 w-5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                                    {i + 1}
                                </div>
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onChange(items.filter((_, j) => j !== i))}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        {objectKeys.map((k) => (
                            <div key={k} className="space-y-1.5">
                                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider capitalize font-medium">
                                    {k.replace(/_/g, " ")}
                                </Label>
                                {typeof item[k] === "string" && item[k].length > 80 ? (
                                    <textarea
                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-background transition-colors"
                                        value={item[k] ?? ""}
                                        onChange={(e) => {
                                            const next = [...items]
                                            next[i] = { ...next[i], [k]: e.target.value }
                                            onChange(next)
                                        }}
                                    />
                                ) : typeof item[k] === "number" ? (
                                    <Input
                                        type="number"
                                        value={item[k] ?? 0}
                                        onChange={(e) => {
                                            const next = [...items]
                                            next[i] = { ...next[i], [k]: parseInt(e.target.value) || 0 }
                                            onChange(next)
                                        }}
                                        className="bg-muted/30 focus:bg-background transition-colors"
                                    />
                                ) : (
                                    <Input
                                        value={item[k] ?? ""}
                                        onChange={(e) => {
                                            const next = [...items]
                                            next[i] = { ...next[i], [k]: e.target.value }
                                            onChange(next)
                                        }}
                                        className="bg-muted/30 focus:bg-background transition-colors"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const template: Record<string, any> = {}
                        for (const k of objectKeys) {
                            template[k] = typeof items[0]?.[k] === "number" ? 0 : ""
                        }
                        // Preserve icon/color if present
                        if (items[0]?.icon) template.icon = items[0].icon
                        if (items[0]?.color) template.color = items[0].color
                        onChange([...items, template])
                    }}
                    className="gap-1.5 h-8 text-xs w-full"
                >
                    <Plus className="h-3 w-3" />
                    Add item
                </Button>
            </ListShell>
        )
    }

    return null
}
