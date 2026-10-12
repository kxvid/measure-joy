"use client";
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
    <Storefront
      mode="product"
      productSlug={product.id}
      initialProduct={product}
      initialProducts={[product, ...relatedProducts]}
    />
  );
}
