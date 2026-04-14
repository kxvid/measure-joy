"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
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
    Database,
    Eye,
    Edit3,
} from "lucide-react"
import { FieldEditor, type FieldDef } from "./components/field-editor"
import { LivePreview } from "./components/live-preview"
import { PublishBar } from "./components/publish-bar"
import { DiffModal } from "./components/diff-modal"

// Section definitions for the CMS
const SECTIONS = [
    { id: "hero", label: "Hero", icon: Layout, description: "Main homepage hero banner" },
    { id: "promo_banner", label: "Promo Banner", icon: Megaphone, description: "Top announcement bar" },
    { id: "trust_badges", label: "Trust Badges", icon: Shield, description: "Checkout trust indicators" },
    { id: "trust_banner", label: "Trust Banner", icon: Shield, description: "Feature highlights strip" },
    { id: "trust_story", label: "Trust Story", icon: Star, description: "Why Choose Us section" },
    { id: "testimonials", label: "Testimonials", icon: Quote, description: "Customer reviews" },
    { id: "newsletter", label: "Newsletter", icon: Mail, description: "Newsletter signup" },
    { id: "footer", label: "Footer", icon: FileText, description: "Footer content" },
    { id: "about", label: "About Page", icon: Info, description: "About page content" },
] as const

// Schema: defines what fields each section has and their types
const SECTION_SCHEMA: Record<string, FieldDef[]> = {
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
    promo_banner: [{ key: "items", label: "Banner Items (text + link)", type: "object_list" }],
    trust_badges: [{ key: "items", label: "Badge Items", type: "object_list" }],
    trust_banner: [{ key: "items", label: "Feature Items", type: "object_list" }],
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

type ContentMap = Record<string, Record<string, any>>

export default function ContentEditorPage() {
    const [activeSection, setActiveSection] = useState<string>("hero")
    // Live content — the DB state, used as the baseline for diffing
    const [liveContent, setLiveContent] = useState<ContentMap>({})
    // Edit state — draft values being worked on (may differ from live)
    const [editState, setEditState] = useState<ContentMap>({})

    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [discarding, setDiscarding] = useState(false)
    const [needsSetup, setNeedsSetup] = useState(false)
    const [setupRunning, setSetupRunning] = useState(false)

    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
    const [refreshToken, setRefreshToken] = useState(0)
    const [showDiff, setShowDiff] = useState(false)

    // Narrow-viewport mode: toggle between "edit" and "preview" rather than
    // showing both side-by-side (xl: breakpoint handles the split).
    const [narrowView, setNarrowView] = useState<"edit" | "preview">("edit")

    // Debounced sync: writes drafts to the server cookie 500ms after the
    // last keystroke, then bumps refreshToken to reload the iframe.
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const latestEditRef = useRef(editState)
    latestEditRef.current = editState

    // -----------------------------------------------------------------
    // Load live content + any in-progress drafts on mount
    // -----------------------------------------------------------------
    useEffect(() => {
        loadAll()
    }, [])

    async function loadAll() {
        setLoading(true)
        try {
            // 1. Load live content from DB
            const contentResp = await fetch("/api/admin/content")
            if (!contentResp.ok) throw new Error("Failed to load content")
            const contentData: ContentMap = await contentResp.json()
            setLiveContent(contentData)

            if (Object.keys(contentData).length === 0) {
                setNeedsSetup(true)
                setEditState({})
                return
            }

            // 2. Load any active drafts for this admin
            let drafts: ContentMap = {}
            try {
                const draftResp = await fetch("/api/admin/preview")
                if (draftResp.ok) {
                    const { drafts: d } = await draftResp.json()
                    if (d && typeof d === "object") drafts = d
                }
            } catch {
                // Drafts are best-effort — fall through to live content only
            }

            // 3. Merge: drafts override live on a per-key basis
            const merged: ContentMap = {}
            const allSections = new Set([...Object.keys(contentData), ...Object.keys(drafts)])
            for (const section of allSections) {
                merged[section] = {
                    ...(contentData[section] || {}),
                    ...(drafts[section] || {}),
                }
            }
            setEditState(merged)

            if (Object.keys(drafts).length > 0) {
                setRefreshToken((t) => t + 1) // Show drafts in preview
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to load content")
        } finally {
            setLoading(false)
        }
    }

    async function runSetup() {
        setSetupRunning(true)
        setErrorMessage(null)
        try {
            const resp = await fetch("/api/admin/setup-cms", { method: "POST" })
            const data = await resp.json()
            if (resp.ok) {
                setSuccessMessage(data.message || "CMS initialized")
                setNeedsSetup(false)
                await loadAll()
            } else {
                setErrorMessage(data.error || "Setup failed")
            }
        } catch {
            setErrorMessage("Setup failed")
        } finally {
            setSetupRunning(false)
        }
    }

    // -----------------------------------------------------------------
    // Draft sync: debounced POST to /api/admin/preview
    // -----------------------------------------------------------------
    const scheduleDraftSync = useCallback(() => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = setTimeout(async () => {
            const drafts = computeDrafts(liveContent, latestEditRef.current)
            setSyncing(true)
            setErrorMessage(null)
            try {
                if (Object.keys(drafts).length === 0) {
                    // Nothing changed — ensure cookie is cleared
                    await fetch("/api/admin/preview", { method: "DELETE" })
                } else {
                    const resp = await fetch("/api/admin/preview", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ drafts }),
                    })
                    if (!resp.ok) {
                        const data = await resp.json().catch(() => ({}))
                        throw new Error(data.error || "Failed to sync drafts")
                    }
                }
                setLastSavedAt(Date.now())
                // Force iframe reload so preview reflects latest drafts
                setRefreshToken((t) => t + 1)
            } catch (err: any) {
                setErrorMessage(err.message || "Draft sync failed")
            } finally {
                setSyncing(false)
            }
        }, 500)
    }, [liveContent])

    function updateField(section: string, key: string, value: any) {
        setEditState((prev) => ({
            ...prev,
            [section]: { ...prev[section], [key]: value },
        }))
        scheduleDraftSync()
    }

    // -----------------------------------------------------------------
    // Publish: commit all drafts to DB, clear cookie
    // -----------------------------------------------------------------
    async function publishAll() {
        const drafts = computeDrafts(liveContent, editState)
        const changedSections = Object.keys(drafts)
        if (changedSections.length === 0) return

        setPublishing(true)
        setErrorMessage(null)

        try {
            // Publish each changed section. If one fails, we bail and leave
            // the rest as drafts — the admin can retry.
            for (const section of changedSections) {
                const entries = { ...(liveContent[section] || {}), ...drafts[section] }
                const resp = await fetch("/api/admin/content", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ section, entries }),
                })
                if (!resp.ok) {
                    const data = await resp.json().catch(() => ({}))
                    throw new Error(`Failed to publish "${section}": ${data.error || resp.statusText}`)
                }
            }

            // Clear draft cookie — everything is now live
            await fetch("/api/admin/preview", { method: "DELETE" })

            // Resync local state: the editState is now the new liveContent
            setLiveContent((prev) => {
                const next = { ...prev }
                for (const section of changedSections) {
                    next[section] = { ...(next[section] || {}), ...drafts[section] }
                }
                return next
            })
            setLastSavedAt(null)
            setRefreshToken((t) => t + 1)
            setShowDiff(false)
            setSuccessMessage(`Published ${changedSections.length} section${changedSections.length !== 1 ? "s" : ""}`)
            setTimeout(() => setSuccessMessage(null), 4000)
        } catch (err: any) {
            setErrorMessage(err.message || "Publish failed")
        } finally {
            setPublishing(false)
        }
    }

    // -----------------------------------------------------------------
    // Discard: clear drafts cookie + reset form to live
    // -----------------------------------------------------------------
    async function discardDrafts() {
        const count = countChanges(liveContent, editState)
        if (count === 0) return
        if (!confirm(`Discard ${count} unpublished change${count !== 1 ? "s" : ""}? This can't be undone.`)) return

        setDiscarding(true)
        setErrorMessage(null)
        try {
            await fetch("/api/admin/preview", { method: "DELETE" })
            setEditState(deepClone(liveContent))
            setLastSavedAt(null)
            setRefreshToken((t) => t + 1)
        } catch (err: any) {
            setErrorMessage(err.message || "Discard failed")
        } finally {
            setDiscarding(false)
        }
    }

    const changedCount = useMemo(
        () => countChanges(liveContent, editState),
        [liveContent, editState]
    )

    const sectionFields = SECTION_SCHEMA[activeSection] || []
    const sectionInfo = SECTIONS.find((s) => s.id === activeSection)

    const lastSavedLabel = useLastSavedLabel(lastSavedAt)

    // -----------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            {/* Top area: sidebar + (editor + preview) */}
            <div className="flex flex-1 min-h-0">
                {/* Sidebar */}
                <aside className="w-56 border-r bg-background overflow-y-auto flex-shrink-0 hidden md:block">
                    <div className="p-3">
                        <h2 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-3 px-2">
                            Sections
                        </h2>
                        <nav className="space-y-0.5">
                            {SECTIONS.map((section) => {
                                const Icon = section.icon
                                const isActive = activeSection === section.id
                                const sectionChanges = countSectionChanges(
                                    liveContent[section.id] || {},
                                    editState[section.id] || {}
                                )
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                                            isActive
                                                ? "bg-foreground text-background"
                                                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{section.label}</span>
                                        {sectionChanges > 0 && (
                                            <span
                                                className={`ml-auto text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0 ${
                                                    isActive
                                                        ? "bg-background/20 text-background"
                                                        : "bg-pop-pink text-background"
                                                }`}
                                                title={`${sectionChanges} unpublished`}
                                            >
                                                {sectionChanges}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </nav>

                        <Separator className="my-4" />

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 text-xs"
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

                {/* Right of sidebar: tab switcher + main/preview row */}
                <div className="flex flex-col flex-1 min-w-0">
                    {/* Mobile/tablet view toggle — hidden on xl: */}
                    <div className="xl:hidden border-b bg-background flex items-center gap-2 px-3 py-2 flex-shrink-0">
                        {/* Mobile-only section selector (sidebar is hidden below md:) */}
                        <select
                            className="md:hidden border rounded-md px-2 py-1 text-sm bg-background"
                            value={activeSection}
                            onChange={(e) => setActiveSection(e.target.value)}
                        >
                            {SECTIONS.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        <Button
                            size="sm"
                            variant={narrowView === "edit" ? "default" : "ghost"}
                            onClick={() => setNarrowView("edit")}
                            className="h-8 gap-1.5"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant={narrowView === "preview" ? "default" : "ghost"}
                            onClick={() => setNarrowView("preview")}
                            className="h-8 gap-1.5"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                        </Button>
                    </div>

                    <div className="flex flex-1 min-h-0">
                        {/* Editor form */}
                        <main
                            className={`flex-1 min-w-0 overflow-y-auto ${
                                narrowView === "preview" ? "hidden xl:block" : "block"
                            }`}
                        >
                            <div className="max-w-2xl mx-auto p-6 xl:p-8">
                                {/* Section Header */}
                                <div className="mb-6">
                                    <h1 className="text-xl font-bold tracking-tight">
                                        {sectionInfo?.label}
                                    </h1>
                                    <p className="text-muted-foreground text-sm">
                                        {sectionInfo?.description}
                                    </p>
                                </div>

                                {successMessage && (
                                    <div className="mb-5 p-3 rounded-lg flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-800 text-sm">
                                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                        <p>{successMessage}</p>
                                    </div>
                                )}

                                {/* Fields */}
                                <div className="space-y-5">
                                    {sectionFields.map((field) => (
                                        <FieldEditor
                                            key={field.key}
                                            field={field}
                                            section={activeSection}
                                            value={editState[activeSection]?.[field.key]}
                                            onChange={(val) =>
                                                updateField(activeSection, field.key, val)
                                            }
                                        />
                                    ))}
                                    {sectionFields.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground border rounded-lg">
                                            No editable fields defined for this section.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>

                        {/* Live Preview pane */}
                        <div
                            className={`flex-1 min-w-0 xl:block ${
                                narrowView === "preview" ? "block" : "hidden"
                            }`}
                        >
                            <LivePreview refreshToken={refreshToken} syncing={syncing} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky publish bar */}
            <PublishBar
                changedCount={changedCount}
                lastSaved={lastSavedLabel}
                onDiscard={discardDrafts}
                onPreviewDiff={() => setShowDiff(true)}
                discarding={discarding}
                syncing={syncing}
                errorMessage={errorMessage}
            />

            {/* Diff modal */}
            <DiffModal
                open={showDiff}
                onClose={() => setShowDiff(false)}
                onConfirm={publishAll}
                liveContent={liveContent}
                draftContent={editState}
                publishing={publishing}
            />
        </div>
    )
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

// Return only the sections+keys where edit state differs from live content.
function computeDrafts(live: ContentMap, edit: ContentMap): ContentMap {
    const drafts: ContentMap = {}
    for (const section of Object.keys(edit)) {
        const liveSection = live[section] || {}
        const editSection = edit[section] || {}
        for (const key of Object.keys(editSection)) {
            if (JSON.stringify(liveSection[key]) !== JSON.stringify(editSection[key])) {
                if (!drafts[section]) drafts[section] = {}
                drafts[section][key] = editSection[key]
            }
        }
    }
    return drafts
}

function countChanges(live: ContentMap, edit: ContentMap): number {
    let n = 0
    for (const section of Object.keys(edit)) {
        n += countSectionChanges(live[section] || {}, edit[section] || {})
    }
    return n
}

function countSectionChanges(live: Record<string, any>, edit: Record<string, any>): number {
    let n = 0
    for (const key of Object.keys(edit)) {
        if (JSON.stringify(live[key]) !== JSON.stringify(edit[key])) n++
    }
    return n
}

// "12s ago" / "3m ago" — ticks every 10s so the label stays fresh
function useLastSavedLabel(timestamp: number | null): string | null {
    const [, setTick] = useState(0)
    useEffect(() => {
        if (!timestamp) return
        const id = setInterval(() => setTick((t) => t + 1), 10000)
        return () => clearInterval(id)
    }, [timestamp])

    if (!timestamp) return null
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 5) return "just now"
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
}
