"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wand2, RefreshCcw, CheckCircle, AlertCircle } from "lucide-react"

export default function AdminProductsPage() {
    const [isRationalizing, setIsRationalizing] = useState(false)
    const [results, setResults] = useState<any>(null)
    const [status, setStatus] = useState<any>(null)

    const handleRationalize = async () => {
        setIsRationalizing(true)
        setResults(null)
        try {
            const res = await fetch("/api/admin/rationalizer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dryRun: false }),
            })
            const data = await res.json()
            setResults(data)
        } catch (error) {
            console.error("Rationalization failed", error)
        } finally {
            setIsRationalizing(false)
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products & Data Tools</h1>
                    <p className="text-muted-foreground mt-2">Manage product data and fix "Unknown" fields.</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={handleRationalize}
                        disabled={isRationalizing}
                        size="lg"
                        className="gap-2 bg-pop-pink hover:bg-pop-pink/90"
                    >
                        {isRationalizing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Rationalizing...
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-4 w-4" />
                                Fix Unknown Data
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {results && (
                <div className="bg-secondary/20 border rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Rationalization Complete
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-background rounded-lg border">
                            <div className="text-sm text-muted-foreground mb-1">Processed</div>
                            <div className="text-2xl font-bold">{results.summary.total}</div>
                        </div>
                        <div className="p-4 bg-background rounded-lg border">
                            <div className="text-sm text-muted-foreground mb-1">Updated</div>
                            <div className="text-2xl font-bold text-pop-pink">{results.summary.updated}</div>
                        </div>
                        <div className="p-4 bg-background rounded-lg border">
                            <div className="text-sm text-muted-foreground mb-1">Copy Generated</div>
                            <div className="text-2xl font-bold text-pop-blue">{results.summary.copyGenerated}</div>
                        </div>
                        <div className="p-4 bg-background rounded-lg border">
                            <div className="text-sm text-muted-foreground mb-1">Errors</div>
                            <div className="text-2xl font-bold text-red-500">{results.summary.errors}</div>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {results.results.filter((r: any) => Object.keys(r.changes).length > 0).map((r: any) => (
                            <div key={r.productId} className="flex items-start gap-4 p-3 bg-background border rounded-lg text-sm">
                                <div className="font-medium min-w-[200px]">{r.name}</div>
                                <div className="flex-1 space-y-1">
                                    {Object.entries(r.changes).map(([field, change]: [string, any]) => (
                                        <div key={field} className="grid grid-cols-[100px_1fr_20px_1fr] gap-2 items-center">
                                            <span className="text-muted-foreground capitalize">{field}:</span>
                                            <span className="bg-red-50 text-red-700 px-2 rounded line-through text-xs truncate">
                                                {change.before || "Empty"}
                                            </span>
                                            <span className="text-center text-muted-foreground">→</span>
                                            <span className="bg-green-50 text-green-700 px-2 rounded font-medium text-xs">
                                                {change.after}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {results.summary.updated === 0 && (
                            <p className="text-muted-foreground italic text-center py-4">No data needed fixing!</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
