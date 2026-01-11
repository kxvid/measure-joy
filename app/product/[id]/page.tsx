import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ProductDetailClient } from "./product-detail-client"
import { getStripeProductById } from "@/lib/stripe-products"

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

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />
}
