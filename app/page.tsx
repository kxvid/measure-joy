import Storefront from "@/components/storefront/storefront";
import { getSectionContent } from "@/lib/content";
import { loadStorefrontCatalog } from "@/lib/storefront-page-data";

export const metadata = {
  title: "Vintage Digital Cameras, Film Cameras & Accessories",
  description:
    "Shop vintage digital cameras, film cameras, lenses and accessories at Measure Joy. Browse actual item photos, condition details and current prices.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [newsletter, catalog] = await Promise.all([
    getSectionContent("newsletter"),
    loadStorefrontCatalog(),
  ]);
  return <Storefront newsletter={newsletter} {...catalog} />;
}
