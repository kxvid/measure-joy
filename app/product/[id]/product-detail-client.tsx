"use client";
import { ProductView } from "@/components/analytics/product-view";
import Storefront from "@/components/storefront/storefront";
import type { Product } from "@/lib/products";
export function ProductDetailClient({
  product,
  relatedProducts = [],
}: {
  product: Product;
  relatedProducts?: Product[];
}) {
  return (
    <>
      <ProductView id={product.id} priceInCents={product.priceInCents} />
      <Storefront
        mode="product"
        productSlug={product.id}
        initialProduct={product}
        initialProducts={[product, ...relatedProducts]}
      />
    </>
  );
}
