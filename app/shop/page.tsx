import Storefront from "@/components/storefront/storefront";
export const metadata = {
  title: "Find your camera",
  description:
    "Shop vintage digital cameras, film favorites, lenses and the little extras. Explore the current Measure Joy collection.",
};
export default function ShopPage() {
  return <Storefront mode="shop" />;
}
