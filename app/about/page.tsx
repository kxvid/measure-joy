import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Newsletter } from "@/components/newsletter"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Camera, Heart, Sparkles, Users } from "lucide-react"
import { getSectionContent } from "@/lib/content"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "About Us - Measure Joy | Y2K Digital Camera Specialists",
  description:
    "Learn about Measure Joy's mission to preserve the magic of Y2K photography. Discover our story, values, and commitment to quality vintage cameras.",
}

const VALUE_ICONS = [Camera, Heart, Sparkles, Users]

const DEFAULTS = {
  hero_heading: "Preserving the magic of Y2K photography",
  hero_subtitle:
    "Measure Joy started from a simple love for the unique aesthetic of early digital cameras. We believe these devices capture something special—a warmth and authenticity that modern smartphones just can't replicate.",
  story_p1:
    "It all began in 2019 when our founder discovered their grandmother's old Sony Cybershot in a dusty drawer. The photos it produced—slightly soft, beautifully saturated—sparked a deep appreciation for the era.",
  story_p2:
    "What started as a personal collection quickly grew into a mission: to rescue these forgotten gems and share them with a new generation who crave authenticity in an age of AI filters and computational photography.",
  story_p3:
    "Today, Measure Joy is home to hundreds of carefully tested and refurbished cameras from the golden era of digital photography (2003-2010). Each camera tells a story, and we're here to help you write yours.",
  values: [
    { title: "Quality First", description: "Every camera is thoroughly tested and comes with a 90-day warranty." },
    { title: "Passion Driven", description: "We're collectors ourselves—we only sell cameras we'd proudly own." },
    { title: "Authentic Experience", description: "Embrace imperfection. The quirks are what make these cameras special." },
    { title: "Community", description: "Join thousands of Y2K photography enthusiasts sharing their captures." },
  ],
  stats: [
    { value: "2,500+", label: "Happy Customers" },
    { value: "50+", label: "Camera Models" },
    { value: "4.9", label: "Average Rating" },
    { value: "2019", label: "Est." },
  ],
}

export default async function AboutPage() {
  const cms = await getSectionContent("about")
  const c = { ...DEFAULTS, ...cms }
  const values = Array.isArray(c.values) ? c.values : DEFAULTS.values
  const stats = Array.isArray(c.stats) ? c.stats : DEFAULTS.stats

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-8 lg:py-12">
        <Breadcrumbs items={[{ label: "About" }]} />

        {/* Hero */}
        <section className="border-b border-border py-10 lg:py-20">
          <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Our Mission
          </span>
          <h1 className="mt-3 max-w-4xl font-display text-4xl lg:text-6xl font-extrabold uppercase leading-[0.98] tracking-tight">
            {c.hero_heading}
          </h1>
          <p className="mt-6 max-w-2xl text-base lg:text-lg leading-relaxed text-muted-foreground">{c.hero_subtitle}</p>
        </section>

        {/* Story */}
        <section className="grid items-center gap-10 border-b border-border py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Est. 2019
            </span>
            <h2 className="mt-3 font-display text-2xl lg:text-4xl font-extrabold uppercase tracking-tight">Our Story</h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
              <p>{c.story_p1}</p>
              <p>{c.story_p2}</p>
              <p>{c.story_p3}</p>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
            <Image
              src="/vintage-camera-collection-aesthetic.jpg"
              alt="Our camera collection"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* Values */}
        <section className="border-b border-border py-12 lg:py-20">
          <div className="mb-10 text-center">
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Values
            </span>
            <h2 className="mt-2 font-display text-2xl lg:text-4xl font-extrabold uppercase tracking-tight">
              What We Stand For
            </h2>
          </div>
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value: any, i: number) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length]
              return (
                <div key={value.title} className="bg-background p-7 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border">
                    <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 font-display text-sm font-semibold uppercase tracking-[0.08em]">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 lg:py-20">
          <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
            {stats.map((stat: any) => (
              <div key={stat.label} className="bg-foreground px-6 py-10 text-center text-background">
                <span className="font-display text-4xl lg:text-5xl font-extrabold tabular-nums">{stat.value}</span>
                <p className="mt-2 font-display text-[11px] uppercase tracking-[0.14em] text-background/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Newsletter />
      <Footer />
    </main>
  )
}
