"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPrice, getUpsellsForCamera, type Product } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import { ProductCard } from "@/components/product-card"
import { UpsellDrawer } from "@/components/upsell-drawer"
import { ImageGallery } from "@/components/image-gallery"
import { ProductReviews } from "@/components/product-reviews"
import { WishlistButton } from "@/components/wishlist-button"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { TrustBadges } from "@/components/trust-badges"
import { ShoppingBag, Check, Shield, RotateCcw, Plus, Package, Zap, Award } from "lucide-react"
import { StickyAddToCart } from "@/components/sticky-add-to-cart"
import { RecentlyViewed } from "@/components/recently-viewed"

interface ProductDetailClientProps {
  product: Product
  relatedProducts: Product[]
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const [justAdded, setJustAdded] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false)
  const [addedUpsells, setAddedUpsells] = useState<Set<string>>(new Set())
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem(product)
    setJustAdded(true)
    if (product.category === "camera") {
      setShowUpsell(true)
    }
    setTimeout(() => setJustAdded(false), 2000)
  }

  const handleAddUpsell = (upsell: Product) => {
    addItem(upsell)
    setAddedUpsells((prev) => new Set([...prev, upsell.id]))
  }

  const upsells = product.category === "camera" ? getUpsellsForCamera(product) : []

  // Extended specs for display
  const allSpecs = [
    { label: "Brand", value: product.brand },
    { label: "Year", value: product.year },
    { label: "Condition", value: product.condition },
    { label: "Category", value: product.category === "camera" ? "Digital Camera" : "Accessory" },
    ...(product.subcategory ? [{ label: "Type", value: product.subcategory }] : []),
    ...(product.specs.megapixels ? [{ label: "Resolution", value: product.specs.megapixels }] : []),
    ...(product.specs.zoom ? [{ label: "Optical Zoom", value: product.specs.zoom }] : []),
    ...(product.specs.display ? [{ label: "Display", value: product.specs.display }] : []),
    ...(product.specs.storage ? [{ label: "Storage", value: product.specs.storage }] : []),
    ...(product.specs.capacity ? [{ label: "Capacity", value: product.specs.capacity }] : []),
    ...(product.specs.compatibility ? [{ label: "Compatibility", value: product.specs.compatibility }] : []),
    ...(product.specs.material ? [{ label: "Material", value: product.specs.material }] : []),
    ...(product.specs.size ? [{ label: "Size", value: product.specs.size }] : []),
  ]

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: "Shop", href: "/shop" },
            {
              label: product.category === "camera" ? "Cameras" : "Accessories",
              href: `/shop?category=${product.category}`,
            },
            { label: product.name },
          ]}
        />

        {/* Product details */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 mt-8">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start relative">
            <ImageGallery images={product.images} productName={product.name} />
            {product.badge && (
              <Badge className="absolute top-4 left-4 bg-pop-orange text-foreground border-0 z-10">
                {product.badge}
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex-1">
              {/* Header info */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="font-mono">
                  {product.brand}
                </Badge>
                <span className="font-mono text-sm text-muted-foreground">{product.year}</span>
                <Badge
                  variant="outline"
                  className={`${
                    product.condition === "Excellent" || product.condition === "New"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : product.condition === "Good" || product.condition === "Very Good"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : ""
                  }`}
                >
                  {product.condition}
                </Badge>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mt-4 tracking-tight text-balance">{product.name}</h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-6">
                <span className="text-4xl font-bold">{formatPrice(product.priceInCents)}</span>
                {product.originalPriceInCents && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.originalPriceInCents)}
                    </span>
                    <Badge className="bg-pop-pink text-foreground border-0">
                      Save {Math.round((1 - product.priceInCents / product.originalPriceInCents) * 100)}%
                    </Badge>
                  </>
                )}
              </div>

              {/* Stock status */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`w-2 h-2 rounded-full ${product.inStock ? "bg-green-500" : "bg-red-500"}`} />
                <span className={`text-sm font-medium ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                  {product.inStock ? "In Stock - Ready to Ship" : "Out of Stock"}
                </span>
              </div>

              {/* Quick features */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                  { icon: Package, label: "Free Shipping", sublabel: "Orders $100+" },
                  { icon: Shield, label: "30-Day Warranty", sublabel: "Full coverage" },
                  { icon: RotateCcw, label: "Easy Returns", sublabel: "No hassle" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 bg-secondary/50 rounded-2xl">
                    <item.icon className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium mt-2">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                  </div>
                ))}
              </div>

              {/* Actions - Updated heart button to WishlistButton component */}
              <div className="mt-8 space-y-3">
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1 h-14 gap-2 rounded-xl text-base bg-foreground hover:bg-foreground/90"
                    onClick={handleAddToCart}
                    disabled={justAdded || !product.inStock}
                  >
                    {justAdded ? (
                      <>
                        <Check className="h-5 w-5" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <WishlistButton productId={product.id} size="lg" className="h-14 w-14 rounded-xl" />
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full h-14 rounded-xl text-base"
                  asChild
                  disabled={!product.inStock}
                >
                  <Link href={`/checkout?product=${product.id}`}>
                    <Zap className="h-5 w-5 mr-2" />
                    Buy Now
                  </Link>
                </Button>
              </div>

              {/* Upsells for cameras */}
              {upsells.length > 0 && (
                <div className="mt-8 p-6 bg-pop-yellow/10 border border-pop-yellow/30 rounded-2xl">
                  <h3 className="font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-pop-orange" />
                    Complete Your Setup
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Recommended accessories for this camera</p>
                  <div className="space-y-2">
                    {upsells.slice(0, 3).map((upsell) => {
                      const isAdded = addedUpsells.has(upsell.id)
                      return (
                        <div
                          key={upsell.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border bg-background transition-colors ${
                            isAdded ? "border-green-200 bg-green-50" : "border-border hover:border-accent/50"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <img
                              src={upsell.images[0] || "/placeholder.svg"}
                              alt={upsell.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{upsell.name}</p>
                            <p className="text-sm text-muted-foreground">{formatPrice(upsell.priceInCents)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={isAdded ? "secondary" : "default"}
                            className="rounded-lg h-9"
                            onClick={() => handleAddUpsell(upsell)}
                            disabled={isAdded}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16">
          <TrustBadges />
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16 lg:mt-24">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-base"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-base"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-base"
              >
                Shipping & Returns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-8">
              <div className="max-w-3xl">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {product.longDescription || product.description}
                </p>

                {product.features && product.features.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">Key Features</h3>
                    <ul className="grid gap-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-8">
              <div className="max-w-3xl">
                <div className="grid gap-0 divide-y">
                  {allSpecs.map((spec, index) => (
                    <div key={index} className="flex py-4">
                      <span className="w-1/3 text-muted-foreground">{spec.label}</span>
                      <span className="w-2/3 font-medium capitalize">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="mt-8">
              <div className="max-w-3xl space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">Shipping</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Free standard shipping on orders over $100</li>
                    <li>• Standard shipping (5-7 business days): $5.99</li>
                    <li>• Express shipping (2-3 business days): $12.99</li>
                    <li>• All items are carefully packaged to ensure safe delivery</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-bold text-lg mb-2">Returns & Warranty</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• 30-day return policy for all items</li>
                    <li>• Items must be in original condition with all accessories</li>
                    <li>• All cameras include a 30-day warranty covering defects</li>
                    <li>• Contact us at christianvelasquez363@gmail.com for returns</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Reviews Section */}
        <ProductReviews productId={product.id} />

        {/* Recently viewed section */}
        <RecentlyViewed currentProductId={product.id} />

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 lg:mt-28">
            <h2 className="text-2xl font-bold mb-8 tracking-tight">You Might Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <StickyAddToCart product={product} />
      <UpsellDrawer open={showUpsell} onClose={() => setShowUpsell(false)} addedProduct={product} />

      <Footer />
    </main>
  )
}
