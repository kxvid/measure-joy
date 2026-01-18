"use client"

import { useState, useEffect } from "react"
// import { createClient } from "@/lib/supabase/client" 
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getWishlist, removeFromWishlist } from "@/app/actions/wishlist"
import { formatPrice, type Product } from "@/lib/products"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, Heart, Trash2, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { isLoaded, userId } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    if (!userId) {
      router.push("/sign-in")
      return
    }

    const fetchWishlist = async () => {
      // Get wishlist IDs via Server Action
      const ids = await getWishlist()

      if (ids.length > 0) {
        try {
          const res = await fetch("/api/products")
          if (res.ok) {
            const allProducts: Product[] = await res.json()
            const products = ids
              .map((id) => allProducts.find((p) => p.id === id))
              .filter(Boolean) as Product[]
            setWishlistProducts(products)
          }
        } catch (error) {
          console.error("Failed to fetch wishlist products:", error)
        }
      }
      setLoading(false)
    }

    fetchWishlist()
  }, [isLoaded, userId, router])

  const handleRemove = async (productId: string) => {
    // Optimistic update
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId))
    await removeFromWishlist(productId)
  }

  const handleAddToCart = (product: Product) => {
    addItem(product)
  }

  if ((!isLoaded || !userId) || loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary rounded w-48 mx-auto mb-4" />
            <div className="h-4 bg-secondary rounded w-64 mx-auto" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-8 lg:py-12">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Account
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
          <p className="text-muted-foreground mt-2">Items you've saved for later</p>
        </div>

        {wishlistProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {wishlistProducts.map((product) => (
              <Card key={product!.id} className="border-2 overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex">
                    <Link href={`/product/${product!.id}`} className="w-32 h-32 bg-secondary shrink-0">
                      <img
                        src={product!.images[0] || "/placeholder.svg"}
                        alt={product!.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    <div className="flex-1 p-4 flex flex-col">
                      <Link
                        href={`/product/${product!.id}`}
                        className="font-medium hover:text-accent transition-colors"
                      >
                        {product!.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">{product!.brand}</p>
                      <p className="font-bold mt-auto">{formatPrice(product!.priceInCents)}</p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 rounded-xl text-xs h-8"
                          onClick={() => handleAddToCart(product!)}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-8 w-8 p-0 bg-transparent"
                          onClick={() => handleRemove(product!.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">Save items you love by clicking the heart icon.</p>
              <Button asChild className="rounded-xl">
                <Link href="/shop">Browse Cameras</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </main>
  )
}
