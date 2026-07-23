import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"
import { permanentRedirect } from "next/navigation"
import { ProductDetailClient } from "./product-detail-client"
import { getStripeProductById, getStripeProducts } from "@/lib/stripe-products"
import { productJsonLd, productPath, resolveProductParam, SITE_URL } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getStripeProductById(resolveProductParam(id))

  if (!product) {
    return { title: "Product Not Found" }
  }

  const title = product.brand ? `${product.name} — ${product.brand}` : product.name
  const description =
    product.description ||
    `${product.name} — tested Y2K digital camera from Measure Joy. Ships with battery and 90-day warranty.`
  const image = product.images?.[0]
  const canonical = productPath(product)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch product from Stripe — the param may be a raw prod_ id or a slug path
  const product = await getStripeProductById(resolveProductParam(id))

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="text-muted-foreground mt-2">The product you're looking for doesn't exist.</p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/shop">Browse all products</Link>
          </Button>
        </div>
        <Footer />
      </main>
    )
  }

  // 301 old raw-id URLs (and stale slugs) to the canonical descriptive slug —
  // Google recommends readable ecommerce URLs, and the redirect preserves
  // any link equity pointing at the legacy /product/prod_XXX addresses.
  const canonical = productPath(product)
  if (`/product/${id}` !== canonical) {
    permanentRedirect(canonical)
  }

  // Similar cameras — shown on every page, and essential on sold-out
  // one-of-one listings so the page keeps converting after the sale.
  let relatedProducts: any[] = []
  try {
    const all = await getStripeProducts({ category: product.category })
    const brand = product.brand?.toLowerCase()
    relatedProducts = all
      .filter((p) => p.id !== product.id && p.inStock)
      .sort((a, b) => {
        const aBrand = brand && a.brand?.toLowerCase() === brand ? 1 : 0
        const bBrand = brand && b.brand?.toLowerCase() === brand ? 1 : 0
        return bBrand - aBrand
      })
      .slice(0, 4)
  } catch {
    relatedProducts = []
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, canonical)) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  )
}
