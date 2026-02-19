"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    FileText,
    Megaphone,
    Shield,
    Star,
    Quote,
    Mail,
    Info,
    Layout,
    Plus,
    Trash2,
    Database,
    RefreshCw,
} from "lucide-react"

// Section definitions for the CMS
const SECTIONS = [
    { id: "hero", label: "Hero Section", icon: Layout, description: "Main homepage hero banner" },
    { id: "promo_banner", label: "Promo Banner", icon: Megaphone, description: "Top announcement bar" },
    { id: "trust_badges", label: "Trust Badges", icon: Shield, description: "Checkout trust indicators" },
    { id: "trust_banner", label: "Trust Banner", icon: Shield, description: "Feature highlights strip" },
    { id: "trust_story", label: "Trust Story", icon: Star, description: "Why Choose Us section" },
    { id: "testimonials", label: "Testimonials", icon: Quote, description: "Customer reviews" },
    { id: "newsletter", label: "Newsletter", icon: Mail, description: "Newsletter signup section" },
    { id: "footer", label: "Footer", icon: FileText, description: "Footer content" },
    { id: "about", label: "About Page", icon: Info, description: "About page content" },
] as const

// Schema: defines what fields each section has and their types
const SECTION_SCHEMA: Record<string, { key: string; label: string; type: "text" | "textarea" | "list" | "object_list" | "stat_list" }[]> = {
    hero: [
        { key: "badge", label: "Badge Text", type: "text" },
        { key: "heading_line1", label: "Heading Line 1", type: "text" },
        { key: "heading_line2", label: "Heading Line 2 (accent)", type: "text" },
        { key: "heading_line3", label: "Heading Line 3", type: "text" },
        { key: "subtitle", label: "Subtitle", type: "textarea" },
        { key: "cta_primary", label: "Primary Button Text", type: "text" },
        { key: "cta_secondary", label: "Secondary Button Text", type: "text" },
        { key: "marquee_items", label: "Marquee Items", type: "list" },
    ],
    promo_banner: [
        { key: "items", label: "Banner Items (text + link)", type: "object_list" },
    ],
    trust_badges: [
        { key: "items", label: "Badge Items", type: "object_list" },
    ],
    trust_banner: [
        { key: "items", label: "Feature Items", type: "object_list" },
    ],
    trust_story: [
        { key: "badge", label: "Badge Text", type: "text" },
        { key: "heading", label: "Section Heading", type: "text" },
        { key: "subtitle", label: "Section Subtitle", type: "textarea" },
        { key: "points", label: "Trust Points", type: "object_list" },
        { key: "stats", label: "Statistics", type: "stat_list" },
        { key: "quote", label: "Customer Quote", type: "textarea" },
        { key: "quote_attribution", label: "Quote Attribution", type: "text" },
    ],
    testimonials: [
        { key: "heading", label: "Section Heading", type: "text" },
        { key: "subtitle", label: "Section Subtitle", type: "textarea" },
        { key: "items", label: "Testimonials", type: "object_list" },
    ],
    newsletter: [
        { key: "badge", label: "Badge Text", type: "text" },
        { key: "heading", label: "Heading", type: "text" },
        { key: "subtitle", label: "Subtitle", type: "textarea" },
        { key: "disclaimer", label: "Disclaimer Text", type: "text" },
    ],
    footer: [
        { key: "tagline", label: "Brand Tagline", type: "textarea" },
        { key: "bottom_text", label: "Bottom Text", type: "text" },
    ],
    about: [
        { key: "hero_heading", label: "Hero Heading", type: "text" },
        { key: "hero_subtitle", label: "Hero Subtitle", type: "textarea" },
        { key: "story_p1", label: "Story Paragraph 1", type: "textarea" },
        { key: "story_p2", label: "Story Paragraph 2", type: "textarea" },
        { key: "story_p3", label: "Story Paragraph 3", type: "textarea" },
        { key: "values", label: "Values", type: "object_list" },
        { key: "stats", label: "Statistics", type: "stat_list" },
    ],
}

// Template shapes for object_list fields so "Add Item" on empty lists creates usable fields
const OBJECT_LIST_TEMPLATES: Record<string, Record<string, any>> = {
    "promo_banner.items": { text: "", link: "" },
    "trust_badges.items": { text: "", icon: "" },
    "trust_banner.items": { text: "", icon: "" },
    "trust_story.points": { title: "", description: "" },
    "testimonials.items": { name: "", text: "", rating: 5 },
    "about.values": { title: "", description: "" },
}

export default function ContentEditorPage() {
    const [activeSection, setActiveSection] = useState("hero")
    const [content, setContent] = useState<Record<string, Record<string, any>>>({})
    const [editState, setEditState] = useState<Record<string, Record<string, any>>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [setupRunning, setSetupRunning] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [needsSetup, setNeedsSetup] = useState(false)

    useEffect(() => {
        loadContent()
    }, [])

    async function loadContent() {
        setLoading(true)
        try {
            const resp = await fetch("/api/admin/content")
            if (resp.ok) {
                const data = await resp.json()
                setContent(data)
                setEditState(JSON.parse(JSON.stringify(data)))
                if (Object.keys(data).length === 0) {
                    setNeedsSetup(true)
                }
            }
        } catch {
            setMessage({ type: "error", text: "Failed to load content" })
        }
        setLoading(false)
    }

    async function runSetup() {
        setSetupRunning(true)
        try {
            const resp = await fetch("/api/admin/setup-cms", { method: "POST" })
            const data = await resp.json()
            if (resp.ok) {
                setMessage({ type: "success", text: data.message })
                setNeedsSetup(false)
                await loadContent()
            } else {
                if (data.migration_url) {
                    setMessage({
                        type: "error",
                        text: `Table not found. Please create it first: Go to the Supabase SQL Editor and run the migration file.`
                    })
                } else {
                    setMessage({ type: "error", text: data.error })
                }
            }
        } catch {
            setMessage({ type: "error", text: "Setup failed" })
        }
        setSetupRunning(false)
    }

    async function saveSection(section: string) {
        setSaving(true)
        setMessage(null)
        try {
            const sectionData = editState[section] || {}
            const resp = await fetch("/api/admin/content", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ section, entries: sectionData }),
            })
            if (resp.ok) {
                setContent(prev => ({ ...prev, [section]: { ...sectionData } }))
                setMessage({ type: "success", text: `${section} saved successfully` })
                setTimeout(() => setMessage(null), 3000)
            } else {
                const err = await resp.json()
                setMessage({ type: "error", text: err.error || "Save failed" })
            }
        } catch {
            setMessage({ type: "error", text: "Save failed" })
        }
        setSaving(false)
    }

    function updateField(section: string, key: string, value: any) {
        setEditState(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }))
    }

    function hasChanges(section: string): boolean {
        return JSON.stringify(content[section]) !== JSON.stringify(editState[section])
    }

    const sectionFields = SECTION_SCHEMA[activeSection] || []
    const sectionInfo = SECTIONS.find(s => s.id === activeSection)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-3.5rem)]">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-background overflow-y-auto flex-shrink-0">
                <div className="p-4">
                    <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Sections</h2>
                    <nav className="space-y-1">
                        {SECTIONS.map((section) => {
                            const Icon = section.icon
                            const isActive = activeSection === section.id
                            const changed = hasChanges(section.id)
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-foreground text-background"
                                            : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{section.label}</span>
                                    {changed && (
                                        <span className="ml-auto w-2 h-2 rounded-full bg-pop-pink flex-shrink-0" />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    <Separator className="my-4" />

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={runSetup}
                        disabled={setupRunning}
                    >
                        {setupRunning ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Database className="h-3 w-3" />
                        )}
                        {needsSetup ? "Initialize CMS" : "Re-seed Defaults"}
                    </Button>
                </div>
            </aside>

            {/* Main Editor */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-8">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">{sectionInfo?.label}</h1>
                            <p className="text-muted-foreground text-sm">{sectionInfo?.description}</p>
                        </div>
                        <Button
                            onClick={() => saveSection(activeSection)}
                            disabled={saving || !hasChanges(activeSection)}
                            className="gap-2"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                            message.type === "success"
                                ? "bg-green-50 border border-green-200 text-green-800"
                                : "bg-red-50 border border-red-200 text-red-800"
                        }`}>
                            {message.type === "success" ? (
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            )}
                            <p className="text-sm">{message.text}</p>
                        </div>
                    )}

                    {/* Fields */}
                    <div className="space-y-6">
                        {sectionFields.map((field) => (
                            <FieldEditor
                                key={field.key}
                                field={field}
                                section={activeSection}
                                value={editState[activeSection]?.[field.key]}
                                onChange={(val) => updateField(activeSection, field.key, val)}
                            />
                        ))}

                        {sectionFields.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    No editable fields defined for this section.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

// Field Editor component
function FieldEditor({
    field,
    section,
    value,
    onChange,
}: {
    field: { key: string; label: string; type: string }
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
