import Storefront from "@/components/storefront/storefront";
import { getSectionContent } from "@/lib/content";
export default async function HomePage() {
  const newsletter = await getSectionContent("newsletter");
  return <Storefront newsletter={newsletter} />;
}
