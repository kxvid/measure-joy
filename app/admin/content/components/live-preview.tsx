"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone, Tablet, Monitor, RefreshCcw, ExternalLink, Loader2 } from "lucide-react"

type DeviceMode = "mobile" | "tablet" | "desktop"

const DEVICE_WIDTHS: Record<DeviceMode, number | null> = {
    mobile: 375,
    tablet: 768,
    desktop: null, // fills container
}

const PAGES = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/shop", label: "Shop" },
    { path: "/faq", label: "FAQ" },
]

interface LivePreviewProps {
    /** Bumps on every successful draft sync — forces iframe reload */
    refreshToken: number
    /** True while a draft save is in flight (shows a subtle indicator) */
    syncing: boolean
}

export function LivePreview({ refreshToken, syncing }: LivePreviewProps) {
    const [device, setDevice] = useState<DeviceMode>("desktop")
    const [page, setPage] = useState<string>("/")
    const [loading, setLoading] = useState(true)
    // Separate manual-refresh counter so the Reload button doesn't depend
    // on parent-triggered refreshToken bumps.
    const [manualRefresh, setManualRefresh] = useState(0)

    // Combined key: any change (draft sync OR manual reload OR page switch)
    // remounts the iframe which forces a fresh cookie read + re-render.
    const iframeKey = `${page}-${refreshToken}-${manualRefresh}`
    const src = `${page}?preview=1&_r=${refreshToken}-${manualRefresh}`

    const width = DEVICE_WIDTHS[device]

    function forceReload() {
        setLoading(true)
        setManualRefresh((n) => n + 1)
    }

    return (
        <div className="flex flex-col h-full bg-muted/20 border-l">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-background flex-shrink-0">
                <div className="flex items-center gap-1">
                    {PAGES.map((p) => (
                        <Button
                            key={p.path}
                            size="sm"
                            variant={page === p.path ? "default" : "ghost"}
                            onClick={() => setPage(p.path)}
                            className="h-8 px-3 text-xs"
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>

                <div className="mx-3 h-6 w-px bg-border" />

                <div className="flex items-center gap-1" role="group" aria-label="Device size">
                    <Button
                        size="icon"
                        variant={device === "mobile" ? "default" : "ghost"}
                        onClick={() => setDevice("mobile")}
                        className="h-8 w-8"
                        title="Mobile (375px)"
                    >
                        <Smartphone className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={device === "tablet" ? "default" : "ghost"}
                        onClick={() => setDevice("tablet")}
                        className="h-8 w-8"
                        title="Tablet (768px)"
                    >
                        <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant={device === "desktop" ? "default" : "ghost"}
                        onClick={() => setDevice("desktop")}
                        className="h-8 w-8"
                        title="Desktop"
                    >
                        <Monitor className="h-4 w-4" />
                    </Button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {syncing && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Syncing draft…
                        </span>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={forceReload}
                        className="h-8 w-8"
                        title="Reload preview"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        asChild
                        className="h-8 w-8"
                        title="Open in new tab"
                    >
                        <a href={src} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>

            {/* Iframe container */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/30">
                <div
                    className="bg-background shadow-xl rounded-lg overflow-hidden transition-all duration-300 flex-shrink-0"
                    style={{
                        width: width ? `${width}px` : "100%",
                        maxWidth: "100%",
                        height: "calc(100% - 8px)",
                        minHeight: "600px",
                    }}
                >
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    <iframe
                        // Composite key remounts iframe on any relevant change
                        key={iframeKey}
                        src={src}
                        className="w-full h-full border-0"
                        title="Live preview"
                        onLoad={() => setLoading(false)}
                    />
                </div>
            </div>
        </div>
    )
}
