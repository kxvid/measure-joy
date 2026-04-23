"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus } from "lucide-react"
import {
    BLOCK_GROUPS,
    BLOCK_ICONS,
    BLOCK_LABELS,
    BLOCK_DESCRIPTIONS,
    type BlockType,
} from "./email-blocks"

interface BlockPickerProps {
    onAdd: (type: BlockType) => void
    /**
     * If false, renders a subtle inline "insert" button (used between blocks).
     * If true, renders the main "Add block" button shown at the bottom.
     */
    primary?: boolean
}

export function BlockPicker({ onAdd, primary = false }: BlockPickerProps) {
    const [open, setOpen] = useState(false)

    function handlePick(type: BlockType) {
        onAdd(type)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {primary ? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 h-10 border-dashed hover:border-solid hover:bg-accent/5 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add block
                    </Button>
                ) : (
                    <button
                        className="group w-full flex items-center justify-center py-1.5 opacity-0 hover:opacity-100 transition-opacity"
                        aria-label="Insert block"
                    >
                        <span className="h-px flex-1 bg-border" />
                        <span className="mx-2 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm group-hover:border-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                            <Plus className="h-3 w-3" />
                        </span>
                        <span className="h-px flex-1 bg-border" />
                    </button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align={primary ? "start" : "center"}>
                <div className="space-y-3">
                    {BLOCK_GROUPS.map((group) => (
                        <div key={group.label}>
                            <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 px-1">
                                {group.label}
                            </h4>
                            <div className="grid grid-cols-2 gap-1">
                                {group.types.map((type) => {
                                    const Icon = BLOCK_ICONS[type]
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => handlePick(type)}
                                            className="flex items-start gap-2.5 p-2 rounded-md hover:bg-muted text-left transition-colors group"
                                        >
                                            <div className="h-7 w-7 rounded-md bg-muted group-hover:bg-background flex items-center justify-center flex-shrink-0 transition-colors">
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-semibold leading-tight">
                                                    {BLOCK_LABELS[type]}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                                                    {BLOCK_DESCRIPTIONS[type]}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
