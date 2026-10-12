"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { EditorialPage, EditorialHeading } from "@/components/editorial-page";
import { type Product } from "@/lib/products";
import { ArrowUpRight } from "lucide-react";

const collections = [
  {
    id: "sony",
    name: "Sony Cybershot",
    description: "Iconic cameras with Carl Zeiss optics",
    query: "Sony",
    href: "/collections/sony-cyber-shot",
    image: "/sony-cybershot-dsc-p200-silver-digital-camera-y2k.jpg",
  },
  {
    id: "canon",
    name: "Canon PowerShot",
    description: "Reliable image quality with renowned color science",
    query: "Canon",
    href: "/collections/canon-powershot",
    image: "/canon-powershot-a520-digital-camera-silver-compact.jpg",
  },
  {
    id: "nikon",
    name: "Nikon Coolpix",
    description: "Legendary optics in pocket-friendly form",
    query: "Nikon",
    href: "/collections/nikon-coolpix",
    image: "/nikon-coolpix-s500-silver-digital-camera-sleek.jpg",
  },
  {
    id: "fujifilm",
    name: "Fujifilm FinePix",
    description: "Fashion-forward cameras with face detection",
    query: "Fujifilm",
    href: "/collections/fujifilm-finepix",
    image: "/fujifilm-finepix-z5fd-pink-digital-camera-cute-y2k.jpg",
  },
  {
    id: "olympus",
    name: "Olympus",
    description: "Compact and colorful with advanced stabilization",
    query: "Olympus",
    href: "/collections/olympus-digicams",
    image: "/olympus-fe-280-digital-camera-blue-metallic-compac.jpg",
  },
  {
    id: "panasonic",
    name: "Panasonic Lumix",
    description: "Leica optics and wide-angle excellence",
    query: "Panasonic",
    // No dedicated landing page yet — falls back to the filtered shop view.
    href: undefined,
    image: "/panasonic-lumix-dmc-fx01-silver-digital-camera-lei.jpg",
  },
];

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Catalog unavailable");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const getCount = (query: string) => {
    return products.filter(
      (p) =>
        p.category === "camera" &&
        `${p.brand || ""} ${p.name}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ).length;
  };

  const getYearCount = (year: string) => {
    return products.filter((p) => p.year === year).length;
  };

  return (
    <EditorialPage>
      <EditorialHeading
        label="The camera families"
        title="Good company."
        description="Different cameras. Different characters. Find your kind of point of view."
      />
      <section className="ed-section" aria-label="Camera collections">
        <div className="ed-section-top">
          <h2>Meet the collections.</h2>
          <Link className="ed-link" href="/collections/y2k-digital-cameras">
            All Y2K cameras <ArrowUpRight size={16} />
          </Link>
        </div>
        {hasError && (
          <p className="ed-catalog-notice" role="status">
            Camera counts are taking a moment. You can still explore each
            collection below.
          </p>
        )}
        <div className="ed-collection-grid">
          {collections.map((collection) => {
            const count = getCount(collection.query);

            return (
              <Link
                key={collection.id}
                href={collection.href ?? `/shop?brand=${collection.query}`}
                className="ed-collection-card"
              >
                <div className="ed-collection-photo">
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 1000px) 44vw, 28vw"
                  />
                  <span className="ed-collection-count">
                    {isLoading
                      ? "Finding the cameras…"
                      : hasError
                        ? "Explore the collection"
                        : `${count} ${count === 1 ? "camera" : "cameras"}`}
                  </span>
                  <span className="ed-collection-arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <h2>{collection.name}</h2>
                <p>{collection.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="ed-era" aria-labelledby="era-title">
        <div>
          <h2 className="ed-era-title" id="era-title">
            Pick a year.
            <br />
            Make it yours.
          </h2>
          <p>A small time capsule for the moments still to come.</p>
        </div>
        <div className="ed-era-links">
          {["2005", "2006", "2007"].map((year) => {
            const count = getYearCount(year);
            return (
              <Link key={year} href={`/shop?year=${year}`}>
                <strong>{year}</strong>
                <span>
                  {isLoading || hasError ? "Explore" : `${count} cameras`}
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </EditorialPage>
  );
}
