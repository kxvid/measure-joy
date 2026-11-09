import Storefront from "@/components/storefront/storefront";
import { loadStorefrontCatalog } from "@/lib/storefront-page-data";
export const metadata = {
  title: "Shop Vintage Digital Cameras & Film Cameras",
  description:
    "Shop vintage digital cameras, film cameras, lenses and accessories. Compare actual item photos, prices, condition and current availability at Measure Joy.",
  alternates: { canonical: "/shop" },
};
export default async function ShopPage() {
  return <Storefront mode="shop" {...(await loadStorefrontCatalog())} />;
}
