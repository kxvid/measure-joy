import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"
import { ProductDetailClient } from "./product-detail-client"
import { getStripeProductById } from "@/lib/stripe-products"
import { productJsonLd, SITE_URL } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getStripeProductById(id)

  if (!product) {
    return { title: "Product Not Found" }
  }

  const title = product.brand ? `${product.name} — ${product.brand}` : product.name
  const description =
    product.description ||
    `${product.name} — tested Y2K digital camera from Measure Joy. Ships with battery and 90-day warranty.`
  const image = product.images?.[0]

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/product/${product.id}`,
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

  // Fetch product from Stripe
  const product = await getStripeProductById(id)

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

  // Related products will be empty for now since we can't easily query by category
  const relatedProducts: any[] = []

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  )
}
