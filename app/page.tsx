import { Header } from "@/components/header"
import { PromoBanner } from "@/components/promo-banner"
import { Hero } from "@/components/hero"
import { ProductSlider } from "@/components/product-slider"
import { AnimatedCategories } from "@/components/animated-categories"
import { TestimonialsSection } from "@/components/testimonials-section"
import { TrustStory } from "@/components/trust-story"
import { TrustBanner } from "@/components/trust-banner"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"
import { getSectionContent } from "@/lib/content"
import { getStripeProducts } from "@/lib/stripe-products"

export const revalidate = 60 // Revalidate every 60 seconds

export default async function Home() {
  // Fetch all CMS content + products in parallel (server-side — no client waterfall)
  const [hero, promoBanner, trustBadges, trustBanner, trustStory, testimonials, newsletter, footer, products] =
    await Promise.all([
      getSectionContent("hero"),
      getSectionContent("promo_banner"),
      getSectionContent("trust_badges"),
      getSectionContent("trust_banner"),
      getSectionContent("trust_story"),
      getSectionContent("testimonials"),
      getSectionContent("newsletter"),
      getSectionContent("footer"),
      getStripeProducts(),
    ])

  const bestSellers = products.filter((p) => p.isBestseller || p.isTrending)

  return (
    <main className="min-h-screen bg-background">
      <PromoBanner cms={promoBanner} />
      <Header />
      <Hero cms={hero} />
      <ProductSlider eyebrow="Just Dropped" title="New Arrivals" products={products} />
      <AnimatedCategories products={products} />
      {bestSellers.length > 0 && (
        <ProductSlider eyebrow="Fan Favorites" title="Best Sellers" products={bestSellers} />
      )}
      <TestimonialsSection cms={testimonials} />
      <TrustStory cms={trustStory} />
      <TrustBanner cms={trustBanner} />
      <Newsletter cms={newsletter} />
      <Footer cms={footer} />
    </main>
  )
}
