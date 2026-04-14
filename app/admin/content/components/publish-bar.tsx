"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Eye, RotateCcw, Loader2, AlertCircle } from "lucide-react"

interface PublishBarProps {
    changedCount: number
    lastSaved: string | null // "2m ago", etc.
    onDiscard: () => void
    onPreviewDiff: () => void
    discarding: boolean
    syncing: boolean
    errorMessage: string | null
}

export function PublishBar({
    changedCount,
    lastSaved,
    onDiscard,
    onPreviewDiff,
    discarding,
    syncing,
    errorMessage,
}: PublishBarProps) {
    const hasChanges = changedCount > 0

    return (
        <div className="border-t bg-background flex-shrink-0 px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {errorMessage ? (
                    <span className="flex items-center gap-2 text-sm text-red-600 truncate">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{errorMessage}</span>
                    </span>
                ) : hasChanges ? (
                    <>
                        <Badge variant="secondary" className="gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-pop-pink animate-pulse" />
                            {changedCount} unpublished change{changedCount !== 1 ? "s" : ""}
                        </Badge>
                        {syncing ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Saving draft…
                            </span>
                        ) : lastSaved ? (
                            <span className="text-xs text-muted-foreground">
                                Draft saved {lastSaved}
                            </span>
                        ) : null}
                    </>
                ) : (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        All changes published
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDiscard}
                    disabled={!hasChanges || discarding}
                    className="gap-2"
                >
                    {discarding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RotateCcw className="h-4 w-4" />
                    )}
                    Discard drafts
                </Button>
                <Button
                    onClick={onPreviewDiff}
                    disabled={!hasChanges}
                    className="gap-2"
                >
                    <Eye className="h-4 w-4" />
                    Review &amp; publish
                </Button>
            </div>
        </div>
    )
}
