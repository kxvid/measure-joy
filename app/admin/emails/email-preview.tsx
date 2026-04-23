"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Monitor, Smartphone } from "lucide-react"

interface EmailPreviewProps {
    html: string
    subject: string
    fromName?: string
    fromEmail?: string
}

export function EmailPreview({
    html,
    subject,
    fromName = "Measure Joy",
    fromEmail = "hello@measurejoy.org",
}: EmailPreviewProps) {
    const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
    const width = device === "mobile" ? 375 : 600

    return (
        <div className="flex flex-col h-full bg-muted/40">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-background/80 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Preview
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                        size="sm"
                        variant={device === "desktop" ? "default" : "ghost"}
                        onClick={() => setDevice("desktop")}
                        className="h-7 px-2.5 gap-1.5 text-xs"
                        title="Desktop (600px)"
                    >
                        <Monitor className="h-3.5 w-3.5" />
                        Desktop
                    </Button>
                    <Button
                        size="sm"
                        variant={device === "mobile" ? "default" : "ghost"}
                        onClick={() => setDevice("mobile")}
                        className="h-7 px-2.5 gap-1.5 text-xs"
                        title="Mobile (375px)"
                    >
                        <Smartphone className="h-3.5 w-3.5" />
                        Mobile
                    </Button>
                </div>
            </div>

            {/* Preview container */}
            <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
                <div
                    className="bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 border border-border/50"
                    style={{ width: `${width}px`, maxWidth: "100%" }}
                >
                    {/* Fake email client chrome */}
                    <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 text-center text-[11px] font-mono text-neutral-500 truncate">
                            Inbox — Mail
                        </div>
                    </div>

                    {/* Fake email header */}
                    <div className="bg-white border-b border-neutral-200 px-5 py-3 flex-shrink-0">
                        <div className="text-xs font-semibold text-neutral-900 truncate mb-1">
                            {subject || <span className="text-neutral-400 italic">(no subject)</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                            <div className="h-5 w-5 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-neutral-500">
                                {fromName.charAt(0)}
                            </div>
                            <span className="font-medium text-neutral-700 truncate">{fromName}</span>
                            <span className="font-mono text-neutral-400 truncate">
                                &lt;{fromEmail}&gt;
                            </span>
                        </div>
                    </div>

                    {/* The actual email iframe */}
                    <iframe
                        srcDoc={html}
                        title="Email preview"
                        className="w-full border-0 bg-white"
                        style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}
                    />
                </div>
            </div>
        </div>
    )
}
