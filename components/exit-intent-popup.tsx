"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Gift, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ExitIntentPopup() {
    const [showPopup, setShowPopup] = useState(false)
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        // Check if we've already shown the popup in this session
        if (sessionStorage.getItem("exitPopupShown")) return

        const handleMouseLeave = (e: MouseEvent) => {
            // Only trigger when mouse leaves toward the top of the page
            if (e.clientY <= 10) {
                setShowPopup(true)
                sessionStorage.setItem("exitPopupShown", "true")
            }
        }

        // Add slight delay before enabling to prevent immediate trigger
        const timer = setTimeout(() => {
            document.addEventListener("mouseleave", handleMouseLeave)
        }, 5000) // 5 second delay

        return () => {
            clearTimeout(timer)
            document.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsLoading(true)
        setError("")

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "exit_intent" }),
            })

            const data = await res.json()

            if (res.ok) {
                setSubmitted(true)
                // Auto-close after success
                setTimeout(() => setShowPopup(false), 3000)
            } else {
                setError(data.error || "Something went wrong")
            }
        } catch {
            setError("Failed to subscribe. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setShowPopup(false)
    }

    if (!showPopup) return null

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Popup */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] animate-in zoom-in-95 fade-in duration-300">
                <div className="bg-background border-4 border-foreground shadow-2xl relative overflow-hidden">
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-8 h-8 bg-pop-yellow" />
                    <div className="absolute top-0 right-0 w-8 h-8 bg-pop-pink" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 bg-pop-pink" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-pop-yellow" />

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-1 hover:bg-secondary rounded-full transition-colors z-10"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="p-8 text-center">
                        {submitted ? (
                            <div className="py-8">
                                <div className="w-16 h-16 bg-pop-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="h-8 w-8 text-foreground" />
                                </div>
                                <h3 className="text-2xl font-black uppercase mb-2">You're In!</h3>
                                <p className="text-muted-foreground">Check your inbox for your 10% off code.</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-pop-pink rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Gift className="h-8 w-8 text-white" />
                                </div>

                                <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tight mb-2">
                                    Wait! Get <span className="text-pop-pink">10% Off</span>
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    Don't leave empty-handed! Join our list and get a discount on your first camera.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="h-12 border-2 border-foreground text-center"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 gap-2 font-bold uppercase tracking-wide"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Claiming...
                                            </>
                                        ) : (
                                            "Claim My 10% Off"
                                        )}
                                    </Button>
                                </form>

                                {error && (
                                    <p className="text-sm text-red-600 mt-3 font-medium">{error}</p>
                                )}

                                <button
                                    onClick={handleClose}
                                    className="text-xs text-muted-foreground mt-4 hover:underline"
                                >
                                    No thanks, I'll pay full price
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
