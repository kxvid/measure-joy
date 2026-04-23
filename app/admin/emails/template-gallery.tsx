"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LayoutTemplate, Check } from "lucide-react"
import { useState } from "react"
import { TEMPLATES, type EmailTemplate } from "./email-blocks"

interface TemplateGalleryProps {
    currentTemplate: string | null
    onSelect: (template: EmailTemplate) => void
}

export function TemplateGallery({ currentTemplate, onSelect }: TemplateGalleryProps) {
    const [open, setOpen] = useState(false)

    function handlePick(template: EmailTemplate) {
        onSelect(template)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Templates
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Choose a template</DialogTitle>
                    <DialogDescription>
                        Start from a pre-built design. You can tweak every block after applying.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    {TEMPLATES.map((template) => {
                        const isActive = currentTemplate === template.name
                        return (
                            <button
                                key={template.name}
                                onClick={() => handlePick(template)}
                                className={`group text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                                    isActive
                                        ? "border-foreground shadow-md"
                                        : "border-border hover:border-foreground/40"
                                }`}
                            >
                                {/* Thumbnail banner */}
                                <div
                                    className={`relative h-24 ${template.accent} flex items-center justify-center`}
                                >
                                    <span className="text-4xl filter drop-shadow-sm">
                                        {template.thumbnail}
                                    </span>
                                    {isActive && (
                                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background flex items-center justify-center shadow">
                                            <Check className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-3.5 bg-background">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-bold">{template.name}</h3>
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                            {template.blocks.length} blocks
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                                        {template.description}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
