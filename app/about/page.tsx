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
  hero_subtitle: "Measure Joy started from a simple love for the unique aesthetic of early digital cameras. We believe these devices capture something special—a warmth and authenticity that modern smartphones just can't replicate.",
  story_p1: "It all began in 2019 when our founder discovered their grandmother's old Sony Cybershot in a dusty drawer. The photos it produced—slightly soft, beautifully saturated—sparked a deep appreciation for the era.",
  story_p2: "What started as a personal collection quickly grew into a mission: to rescue these forgotten gems and share them with a new generation who crave authenticity in an age of AI filters and computational photography.",
  story_p3: "Today, Measure Joy is home to hundreds of carefully tested and refurbished cameras from the golden era of digital photography (2003-2010). Each camera tells a story, and we're here to help you write yours.",
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

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8 lg:py-12">
        <Breadcrumbs items={[{ label: "About" }]} />

        {/* Hero */}
        <section className="py-8 lg:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">{c.hero_heading}</h1>
            <p className="text-lg text-muted-foreground mt-6 leading-relaxed">
              {c.hero_subtitle}
            </p>
          </div>
        </section>

        {/* Story section */}
        <section className="py-8 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center bg-secondary rounded-2xl p-8 lg:p-12">
            <div>
              <h2 className="text-3xl font-bold">Our Story</h2>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>{c.story_p1}</p>
                <p>{c.story_p2}</p>
                <p>{c.story_p3}</p>
              </div>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-background">
              <img
                src="/vintage-camera-collection-aesthetic.jpg"
                alt="Our camera collection"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-8 lg:py-16">
          <h2 className="text-3xl font-bold text-center mb-12">What We Stand For</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value: any, i: number) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length]
              return (
                <div key={value.title} className="text-center p-6 bg-card border border-border rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-bold mt-4">{value.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{value.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Stats */}
        <section className="py-8 lg:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center bg-secondary rounded-2xl p-8 lg:p-12">
            {stats.map((stat: any) => (
              <div key={stat.label}>
                <span className="font-mono text-4xl lg:text-5xl font-bold">{stat.value}</span>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
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
