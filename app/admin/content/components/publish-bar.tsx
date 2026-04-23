"use client"

import { Button } from "@/components/ui/button"
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
        <div
            className={`relative border-t flex-shrink-0 px-6 py-3 flex items-center gap-4 transition-colors ${
                errorMessage
                    ? "bg-red-50/50 border-red-200"
                    : hasChanges
                      ? "bg-background"
                      : "bg-background"
            }`}
        >
            {/* Left: status */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {errorMessage ? (
                    <span className="flex items-center gap-2 text-sm text-red-700 truncate">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate font-medium">{errorMessage}</span>
                    </span>
                ) : hasChanges ? (
                    <>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-pop-pink opacity-75 animate-ping" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-pop-pink" />
                            </span>
                            <span>
                                {changedCount} unpublished change{changedCount !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <span className="h-4 w-px bg-border" aria-hidden />
                        {syncing ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Saving draft…
                            </span>
                        ) : lastSaved ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                Draft saved {lastSaved}
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Autosaves as you type
                            </span>
                        )}
                    </>
                ) : (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        All changes published
                    </span>
                )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDiscard}
                    disabled={!hasChanges || discarding}
                    className="gap-2 text-muted-foreground hover:text-destructive"
                >
                    {discarding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Discard
                </Button>
                <Button
                    onClick={onPreviewDiff}
                    disabled={!hasChanges}
                    className="gap-2 shadow-sm"
                >
                    <Eye className="h-4 w-4" />
                    Review &amp; publish
                </Button>
            </div>
        </div>
    )
}
