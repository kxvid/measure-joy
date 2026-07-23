import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ProductCard } from "@/components/product-card"
import { COLLECTIONS, getCollection } from "@/lib/collections"
import { getStripeProducts } from "@/lib/stripe-products"
import { breadcrumbJsonLd, productPath, SITE_URL } from "@/lib/seo"
import type { Product } from "@/lib/products"
import { ArrowRight } from "lucide-react"

// Pages are prerendered via generateStaticParams; revalidate hourly so the
// product grid tracks the live Stripe catalog between deploys.
export const revalidate = 3600

export function generateStaticParams() {
  return COLLECTIONS.map((collection) => ({ slug: collection.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const collection = getCollection(slug)
  if (!collection) return { title: "Collection Not Found" }

  const title = `${collection.name} Cameras | Measure Joy`
  return {
    title,
    description: collection.shortDescription,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      type: "website",
      title,
      description: collection.shortDescription,
      url: `${SITE_URL}/collections/${collection.slug}`,
      images: [{ url: collection.heroImage, alt: collection.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: collection.shortDescription,
      images: [collection.heroImage],
    },
  }
}

function matchesCollection(product: Product, brandQuery: string): boolean {
  if (product.category !== "camera") return false
  if (!brandQuery) return true
  return Boolean(
    product.brand?.toLowerCase().includes(brandQuery) ||
    product.name.toLowerCase().includes(brandQuery)
  )
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const collection = getCollection(slug)
  if (!collection) notFound()

  const allProducts = await getStripeProducts()
  const products = allProducts.filter((p) => matchesCollection(p, collection.brandQuery))
  const otherCollections = COLLECTIONS.filter((c) => c.slug !== collection.slug)

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Collections", path: "/collections" },
      { name: collection.name, path: `/collections/${collection.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${collection.name} Cameras`,
      itemListElement: products.map((product, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: product.name,
        url: `${SITE_URL}${productPath(product)}`,
      })),
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <div className="mx-auto max-w-[1400px] px-5 lg:px-8 py-8 lg:py-10">
        <Breadcrumbs
          items={[{ label: "Collections", href: "/collections" }, { label: collection.name }]}
        />

        {/* Hero — crawlable editorial copy */}
        <section className="grid gap-8 lg:grid-cols-2 lg:gap-12 border-b border-border pb-10 lg:pb-14">
          <div>
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Collection
            </span>
            <h1 className="mt-1 font-display text-3xl lg:text-5xl font-extrabold uppercase tracking-tight">
              {collection.name}
            </h1>
            <div className="mt-6 space-y-4 max-w-prose">
              {collection.intro.map((paragraph, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-secondary lg:self-start">
            <Image
              src={collection.heroImage}
              alt={`${collection.name} camera`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* Product grid */}
        <section className="mt-10 lg:mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-xl lg:text-2xl font-bold uppercase tracking-tight">
              Shop {collection.name}
            </h2>
            <p className="font-display text-[12px] uppercase tracking-[0.1em] text-muted-foreground">
              {products.length} {products.length === 1 ? "Product" : "Products"}
            </p>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4 lg:gap-x-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="border border-border py-20 text-center">
              <p className="font-display text-sm uppercase tracking-[0.1em]">
                Nothing in stock right now
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                We restock tested {collection.name} cameras often — check back soon.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center gap-1.5 border border-border px-5 py-2.5 font-display text-xs uppercase tracking-[0.1em] transition-colors hover:bg-secondary"
              >
                Browse all products <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* More collections */}
        <section className="mt-14 lg:mt-20 border-t border-border pt-10">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">
            More Collections
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {otherCollections.map((other) => (
              <Link
                key={other.slug}
                href={`/collections/${other.slug}`}
                className="group inline-flex items-center gap-1.5 border border-border px-4 py-2.5 font-display text-[12px] uppercase tracking-[0.1em] transition-colors hover:border-foreground"
              >
                {other.name}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
