import { headers } from "next/headers";
import { serializeJsonLd } from "@/lib/output-encoding";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EditorialPage, EditorialBackLink } from "@/components/editorial-page";
import { ProductCard } from "@/components/product-card";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import { getStripeProducts } from "@/lib/stripe-products";
import { breadcrumbJsonLd, productPath, SITE_URL } from "@/lib/seo";
import type { Product } from "@/lib/products";
import { ArrowUpRight } from "lucide-react";

// Pages are prerendered via generateStaticParams; revalidate hourly so the
// product grid tracks the live Stripe catalog between deploys.
export const revalidate = 3600;

export function generateStaticParams() {
  return COLLECTIONS.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Collection Not Found" };

  const title = `${collection.name} Cameras | Measure Joy`;
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
  };
}

function matchesCollection(product: Product, brandQuery: string): boolean {
  if (product.category !== "camera") return false;
  if (!brandQuery) return true;
  return Boolean(
    product.brand?.toLowerCase().includes(brandQuery) ||
      product.name.toLowerCase().includes(brandQuery),
  );
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const allProducts = await getStripeProducts();
  const products = allProducts.filter((p) =>
    matchesCollection(p, collection.brandQuery),
  );
  const otherCollections = COLLECTIONS.filter(
    (c) => c.slug !== collection.slug,
  );

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
  ];

  return (
    <EditorialPage>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <section className="ed-collection-hero">
        <div>
          <EditorialBackLink href="/collections">
            All collections
          </EditorialBackLink>
          <h1>{collection.name}</h1>
          <p className="ed-collection-summary">{collection.shortDescription}</p>
          <a className="ed-link" href="#collection-finds">
            Explore the finds <ArrowUpRight size={17} />
          </a>
        </div>
        <figure>
          <div className="ed-hero-photo">
            <Image
              src={collection.heroImage}
              alt={`${collection.name} camera`}
              fill
              priority
              sizes="(max-width: 640px) 88vw, 42vw"
            />
          </div>
          <figcaption className="ed-hero-caption">
            <span>The {collection.name} collection</span>
            <span>Measure Joy</span>
          </figcaption>
        </figure>
      </section>

      <section id="collection-finds" className="ed-section ed-catalog-section">
        <div className="ed-section-top">
          <h2>Shop {collection.name}.</h2>
          <p>
            {products.length} {products.length === 1 ? "find" : "finds"} in the
            collection
          </p>
        </div>
        {products.length > 0 ? (
          <div className="ed-catalog-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="ed-empty">
            <h3>A little space for the next find.</h3>
            <p>
              There are no {collection.name} cameras in the collection right
              now. Explore the other cameras while you’re here.
            </p>
            <Link className="ed-button" href="/shop">
              Browse all products <ArrowUpRight size={17} />
            </Link>
          </div>
        )}
      </section>

      <section className="ed-brand-story">
        <h2>
          A little background.
          <br />A lot of character.
        </h2>
        <div>
          {collection.intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="ed-section">
        <div className="ed-section-top">
          <h2>A different point of view.</h2>
          <p>More camera families to meet</p>
        </div>
        <div className="ed-more-collections">
          {otherCollections.map((other) => (
            <Link key={other.slug} href={`/collections/${other.slug}`}>
              {other.name}
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
      </section>
    </EditorialPage>
  );
}
