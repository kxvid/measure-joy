"use client"

import { CheckCircle2, Shield, RefreshCw } from "lucide-react"

interface TrustStoryProps {
  cms?: Record<string, any>
}

const DEFAULT_POINTS = [
  { title: "12-Point Inspection", description: "Every camera is thoroughly tested for sensor quality, lens clarity, battery health, and more." },
  { title: "90-Day Guarantee", description: "Not happy? Full refund within 90 days, no questions asked. We stand behind every camera." },
  { title: "Professionally Restored", description: "Cleaned, calibrated, and restored to peak performance by our Y2K tech specialists." },
]

const DEFAULT_STATS = [
  { value: "2,500+", label: "Happy Customers" },
  { value: "99%", label: "Positive Reviews" },
  { value: "5,000+", label: "Cameras Sold" },
]

const POINT_ICONS = [CheckCircle2, Shield, RefreshCw]

export function TrustStory({ cms = {} }: TrustStoryProps) {
  const badge = cms.badge || "Why Choose Us"
  const heading = cms.heading || "Trusted by Thousands"
  const subtitle =
    cms.subtitle ||
    "We're not just reselling old cameras. We're curators, technicians, and fellow Y2K enthusiasts dedicated to bringing vintage tech back to life."
  const points = Array.isArray(cms.points) ? cms.points : DEFAULT_POINTS
  const stats = Array.isArray(cms.stats) ? cms.stats : DEFAULT_STATS

  return (
    <section className="border-b border-border py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <div className="mb-12 text-center lg:mb-16">
          <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{badge}</span>
          <h2 className="mt-2 font-display text-3xl lg:text-5xl font-extrabold uppercase tracking-tight">{heading}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mb-16 grid gap-px bg-border md:grid-cols-3">
          {points.map((point: any, i: number) => {
            const Icon = POINT_ICONS[i % POINT_ICONS.length]
            return (
              <div key={point.title} className="bg-background p-7 lg:p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center bg-foreground">
                  <Icon className="h-6 w-6 text-background" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 font-display text-base font-semibold uppercase tracking-[0.06em]">{point.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{point.description}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-px bg-border">
          {stats.map((stat: any) => (
            <div key={stat.label} className="bg-foreground px-4 py-8 text-center text-background lg:py-10">
              <p className="font-display text-2xl lg:text-4xl font-extrabold tabular-nums">{stat.value}</p>
              <p className="mt-1 font-display text-[10px] lg:text-[11px] uppercase tracking-[0.14em] text-background/60">{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
