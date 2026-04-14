"use client"

import { useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight, Plus, Minus, Pencil } from "lucide-react"

type SectionContent = Record<string, any>
type AllContent = Record<string, SectionContent>

interface DiffModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    liveContent: AllContent  // what's in the DB
    draftContent: AllContent // what the admin has staged
    publishing: boolean
}

interface Change {
    section: string
    key: string
    kind: "added" | "removed" | "modified"
    oldValue: any
    newValue: any
}

function stringify(v: any): string {
    if (v === undefined || v === null) return ""
    if (typeof v === "string") return v
    try {
        return JSON.stringify(v, null, 2)
    } catch {
        return String(v)
    }
}

function computeChanges(live: AllContent, draft: AllContent): Change[] {
    const changes: Change[] = []
    const allSections = new Set([...Object.keys(live), ...Object.keys(draft)])

    for (const section of allSections) {
        const liveSection = live[section] || {}
        const draftSection = draft[section] || {}
        const allKeys = new Set([...Object.keys(liveSection), ...Object.keys(draftSection)])

        for (const key of allKeys) {
            const oldV = liveSection[key]
            const newV = draftSection[key]
            const oldStr = stringify(oldV)
            const newStr = stringify(newV)

            if (oldStr === newStr) continue

            if (oldV === undefined) {
                changes.push({ section, key, kind: "added", oldValue: oldV, newValue: newV })
            } else if (newV === undefined) {
                changes.push({ section, key, kind: "removed", oldValue: oldV, newValue: newV })
            } else {
                changes.push({ section, key, kind: "modified", oldValue: oldV, newValue: newV })
            }
        }
    }

    // Sort: by section, then by kind
    return changes.sort((a, b) => {
        if (a.section !== b.section) return a.section.localeCompare(b.section)
        return a.key.localeCompare(b.key)
    })
}

export function DiffModal({
    open,
    onClose,
    onConfirm,
    liveContent,
    draftContent,
    publishing,
}: DiffModalProps) {
    const changes = useMemo(
        () => computeChanges(liveContent, draftContent),
        [liveContent, draftContent]
    )

    const bySection = useMemo((): Record<string, Change[]> => {
        const grouped: Record<string, Change[]> = {}
        for (const c of changes) {
            if (!grouped[c.section]) grouped[c.section] = []
            grouped[c.section].push(c)
        }
        return grouped
    }, [changes])

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Review changes
                        <Badge variant="secondary">
                            {changes.length} change{changes.length !== 1 ? "s" : ""}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Confirm what will go live. Publish will write these values to the CMS and refresh the site.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5 min-h-0">
                    {changes.length === 0 && (
                        <div className="text-center py-12 text-sm text-muted-foreground">
                            No changes to publish.
                        </div>
                    )}

                    {(Object.entries(bySection) as [string, Change[]][]).map(
                        ([section, sectionChanges]) => (
                            <div key={section}>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    {section}
                                </h3>
                                <div className="space-y-2">
                                    {sectionChanges.map((change) => (
                                        <DiffRow key={`${section}.${change.key}`} change={change} />
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2 border-t pt-4 flex-shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={publishing}>
                        Back to editing
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={publishing || changes.length === 0}
                        className="gap-2"
                    >
                        {publishing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Publishing…
                            </>
                        ) : (
                            <>Publish {changes.length} change{changes.length !== 1 ? "s" : ""}</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DiffRow({ change }: { change: Change }) {
    const { key, kind, oldValue, newValue } = change

    const KindIcon =
        kind === "added" ? Plus : kind === "removed" ? Minus : Pencil

    const kindBadge = {
        added: { label: "Added", cls: "bg-green-100 text-green-800 border-green-200" },
        removed: { label: "Removed", cls: "bg-red-100 text-red-800 border-red-200" },
        modified: { label: "Changed", cls: "bg-amber-100 text-amber-900 border-amber-200" },
    }[kind]

    return (
        <div className="border rounded-lg p-3 bg-background">
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`gap-1 ${kindBadge.cls}`}>
                    <KindIcon className="h-3 w-3" />
                    {kindBadge.label}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">{key}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                {/* Old */}
                <div className={kind === "added" ? "opacity-40" : ""}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        Current
                    </div>
                    <pre className={`text-xs whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono max-h-32 overflow-auto ${kind === "removed" ? "line-through" : ""}`}>
                        {kind === "added" ? "(empty)" : stringify(oldValue)}
                    </pre>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground mt-6 flex-shrink-0" />

                {/* New */}
                <div className={kind === "removed" ? "opacity-40" : ""}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        New
                    </div>
                    <pre className="text-xs whitespace-pre-wrap break-words rounded bg-green-50 border border-green-200 p-2 font-mono max-h-32 overflow-auto">
                        {kind === "removed" ? "(deleted)" : stringify(newValue)}
                    </pre>
                </div>
            </div>
        </div>
    )
}
