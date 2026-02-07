import { Header } from "@/components/header"
import { PromoBanner } from "@/components/promo-banner"
import { Hero } from "@/components/hero"
import { CategoryGrid } from "@/components/category-grid"
import { FeaturedProducts } from "@/components/featured-products"
import { AnimatedCategories } from "@/components/animated-categories"
import { TestimonialsSection } from "@/components/testimonials-section"
import { TrustStory } from "@/components/trust-story"
import { TrustBanner } from "@/components/trust-banner"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"
import { getSectionContent } from "@/lib/content"

export const revalidate = 60 // Revalidate every 60 seconds

export default async function Home() {
  // Fetch all CMS content in parallel
  const [hero, promoBanner, trustBadges, trustBanner, trustStory, testimonials, newsletter, footer] =
    await Promise.all([
      getSectionContent("hero"),
      getSectionContent("promo_banner"),
      getSectionContent("trust_badges"),
      getSectionContent("trust_banner"),
      getSectionContent("trust_story"),
      getSectionContent("testimonials"),
      getSectionContent("newsletter"),
      getSectionContent("footer"),
    ])

  return (
    <main className="min-h-screen bg-background">
      <PromoBanner cms={promoBanner} />
      <Header />
      <Hero cms={hero} />
      <CategoryGrid />
      <FeaturedProducts />
      <AnimatedCategories />
      <TestimonialsSection cms={testimonials} />
      <TrustStory cms={trustStory} />
      <TrustBanner cms={trustBanner} />
      <Newsletter cms={newsletter} />
      <Footer cms={footer} />
    </main>
  )
}
