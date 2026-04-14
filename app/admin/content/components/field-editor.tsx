"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"

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

export function FieldEditor({
    field,
    section,
    value,
    onChange,
}: {
    field: FieldDef
    section: string
    value: any
    onChange: (val: any) => void
}) {
    if (field.type === "text") {
        return (
            <div className="space-y-2">
                <Label className="text-sm font-medium">{field.label}</Label>
                <Input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                />
            </div>
        )
    }

    if (field.type === "textarea") {
        return (
            <div className="space-y-2">
                <Label className="text-sm font-medium">{field.label}</Label>
                <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                />
            </div>
        )
    }

    if (field.type === "list") {
        const items: string[] = Array.isArray(value) ? value : []
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
                    <CardDescription>Add or remove items from this list</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                value={item}
                                onChange={(e) => {
                                    const next = [...items]
                                    next[i] = e.target.value
                                    onChange(next)
                                }}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onChange(items.filter((_, j) => j !== i))}
                                className="flex-shrink-0 text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onChange([...items, ""])}
                        className="gap-1"
                    >
                        <Plus className="h-3 w-3" />
                        Add Item
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (field.type === "stat_list") {
        const items: { value: string; label: string }[] = Array.isArray(value) ? value : []
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
                    <CardDescription>Edit stat values and labels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                value={item.value}
                                onChange={(e) => {
                                    const next = [...items]
                                    next[i] = { ...next[i], value: e.target.value }
                                    onChange(next)
                                }}
                                placeholder="Value (e.g. 2,500+)"
                                className="w-32"
                            />
                            <Input
                                value={item.label}
                                onChange={(e) => {
                                    const next = [...items]
                                    next[i] = { ...next[i], label: e.target.value }
                                    onChange(next)
                                }}
                                placeholder="Label (e.g. Happy Customers)"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onChange(items.filter((_, j) => j !== i))}
                                className="flex-shrink-0 text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onChange([...items, { value: "", label: "" }])}
                        className="gap-1"
                    >
                        <Plus className="h-3 w-3" />
                        Add Stat
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (field.type === "object_list") {
        const items: Record<string, any>[] = Array.isArray(value) ? value : []
        if (items.length === 0) {
            return (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">No items yet.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const templateKey = `${section}.${field.key}`
                                const template = OBJECT_LIST_TEMPLATES[templateKey] || {}
                                onChange([{ ...template }])
                            }}
                            className="gap-1"
                        >
                            <Plus className="h-3 w-3" />
                            Add Item
                        </Button>
                    </CardContent>
                </Card>
            )
        }

        // Infer fields from the first item
        const objectKeys = Object.keys(items[0]).filter(k => k !== "icon" && k !== "color")

        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
                    <CardDescription>{items.length} item{items.length !== 1 ? "s" : ""}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {items.map((item, i) => (
                        <div key={i} className="p-4 border rounded-lg space-y-3 relative">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">Item {i + 1}</Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                                    className="h-7 w-7 text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            {objectKeys.map((k) => (
                                <div key={k} className="space-y-1">
                                    <Label className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}</Label>
                                    {typeof item[k] === "string" && item[k].length > 80 ? (
                                        <textarea
                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                        />
                                    ) : (
                                        <Input
                                            value={item[k] ?? ""}
                                            onChange={(e) => {
                                                const next = [...items]
                                                next[i] = { ...next[i], [k]: e.target.value }
                                                onChange(next)
                                            }}
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
                        className="gap-1"
                    >
                        <Plus className="h-3 w-3" />
                        Add Item
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return null
}
