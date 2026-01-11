import { Header } from "@/components/header"
import { PromoBanner } from "@/components/promo-banner"
import { Hero } from "@/components/hero"
import { CategoryGrid } from "@/components/category-grid"
import { FeaturedProducts } from "@/components/featured-products"
import { AnimatedCategories } from "@/components/animated-categories"
import { TestimonialsSection } from "@/components/testimonials-section"
import { TrustBanner } from "@/components/trust-banner"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <PromoBanner />
      <Header />
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      <AnimatedCategories />
      <TestimonialsSection />
      <TrustBanner />
      <Newsletter />
      <Footer />
    </main>
  )
}
