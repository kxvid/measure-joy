"use client"

import { CheckCircle2, Shield, RefreshCw, Package, Star, Users } from "lucide-react"

const trustPoints = [
    {
        icon: CheckCircle2,
        title: "12-Point Inspection",
        description: "Every camera is thoroughly tested for sensor quality, lens clarity, battery health, and more.",
        color: "bg-pop-teal",
    },
    {
        icon: Shield,
        title: "30-Day Guarantee",
        description: "Not happy? Full refund within 30 days, no questions asked. We stand behind every camera.",
        color: "bg-pop-pink",
    },
    {
        icon: RefreshCw,
        title: "Professionally Restored",
        description: "Cleaned, calibrated, and restored to peak performance by our Y2K tech specialists.",
        color: "bg-pop-yellow",
    },
]

const stats = [
    { value: "2,500+", label: "Happy Customers" },
    { value: "99%", label: "Positive Reviews" },
    { value: "5,000+", label: "Cameras Sold" },
]

export function TrustStory() {
    return (
        <section className="py-16 lg:py-24 bg-secondary/30">
            <div className="mx-auto max-w-7xl px-4 lg:px-6">
                {/* Header */}
                <div className="text-center mb-12 lg:mb-16">
                    <span className="inline-block px-4 py-1 bg-pop-pink text-white text-xs font-bold uppercase tracking-wider mb-4">
                        Why Choose Us
                    </span>
                    <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight mb-4">
                        Trusted by <span className="text-pop-pink">Thousands</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        We're not just reselling old cameras. We're curators, technicians, and fellow Y2K enthusiasts dedicated to bringing vintage tech back to life.
                    </p>
                </div>

                {/* Trust Points */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
                    {trustPoints.map((point) => (
                        <div
                            key={point.title}
                            className="bg-background p-6 lg:p-8 rounded-2xl border-2 border-border hover:border-accent transition-colors"
                        >
                            <div className={`w-14 h-14 ${point.color} rounded-xl flex items-center justify-center mb-5`}>
                                <point.icon className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="font-black text-lg uppercase tracking-tight mb-2">{point.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{point.description}</p>
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div className="bg-foreground text-background p-8 lg:p-12">
                    <div className="grid grid-cols-3 gap-4 lg:gap-8 text-center">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <p className="text-2xl lg:text-4xl font-black text-pop-yellow">{stat.value}</p>
                                <p className="text-xs lg:text-sm uppercase tracking-wider mt-1 text-background/70">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer Trust Quote */}
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-pop-yellow text-pop-yellow" />
                        ))}
                    </div>
                    <blockquote className="text-lg lg:text-xl font-medium max-w-2xl mx-auto mb-4">
                        "The camera arrived in better condition than described. You can tell they actually test and care for these vintage gems. Will definitely buy again!"
                    </blockquote>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">— Verified Buyer, via email</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
