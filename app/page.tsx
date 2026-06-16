import { Header } from "@/components/header"
import { PromoBanner } from "@/components/promo-banner"
import { Hero } from "@/components/hero"
import { CategoryShowcase } from "@/components/category-showcase"
import { ProductSlider } from "@/components/product-slider"
import { AnimatedCategories } from "@/components/animated-categories"
import { CustomerReviews } from "@/components/customer-reviews"
import { TrustStory } from "@/components/trust-story"
import { TrustBanner } from "@/components/trust-banner"
import { SocialFeed } from "@/components/social-feed"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"
import { getSectionContent } from "@/lib/content"
import { getStripeProducts } from "@/lib/stripe-products"
import { getLatestReviews } from "@/app/actions/reviews"

export const revalidate = 60 // Revalidate every 60 seconds

export default async function Home() {
  // Fetch all CMS content + products in parallel (server-side — no client waterfall)
  const [hero, promoBanner, trustBadges, trustBanner, trustStory, newsletter, footer, products, latestReviews, social, categories] =
    await Promise.all([
      getSectionContent("hero"),
      getSectionContent("promo_banner"),
      getSectionContent("trust_badges"),
      getSectionContent("trust_banner"),
      getSectionContent("trust_story"),
      getSectionContent("newsletter"),
      getSectionContent("footer"),
      getStripeProducts(),
      getLatestReviews(6),
      getSectionContent("social"),
      getSectionContent("categories"),
    ])

  const bestSellers = products.filter((p) => p.isBestseller || p.isTrending)

  // Attach product names to real reviews for the homepage showcase
  const productNameMap = new Map(products.map((p) => [p.id, p.name]))
  const reviewsWithNames = latestReviews.map((r) => ({ ...r, productName: productNameMap.get(r.product_id) }))

  return (
    <main className="min-h-screen bg-background">
      <PromoBanner cms={promoBanner} />
      <Header />
      <Hero cms={hero} />
      <CategoryShowcase cms={categories} />
      <ProductSlider eyebrow="Just Dropped" title="New Arrivals" products={products} />
      <AnimatedCategories products={products} />
      {bestSellers.length > 0 && (
        <ProductSlider eyebrow="Fan Favorites" title="Best Sellers" products={bestSellers} />
      )}
      <CustomerReviews reviews={reviewsWithNames} />
      <TrustStory cms={trustStory} />
      <TrustBanner cms={trustBanner} />
      <SocialFeed cms={social} />
      <Newsletter cms={newsletter} />
      <Footer cms={footer} />
    </main>
  )
}
