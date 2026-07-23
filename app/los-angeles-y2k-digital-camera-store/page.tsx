import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { getStripeProducts } from "@/lib/stripe-products"
import {
  localBusinessJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  SERVICE_AREAS,
  INSTAGRAM_URL,
} from "@/lib/seo"
import { MapPin, ShieldCheck, Camera, Wrench, Truck } from "lucide-react"

export const metadata: Metadata = {
  title: "Y2K Digital Camera Store in Los Angeles & Covina, CA",
  description:
    "Measure Joy is a Southern California Y2K digital camera store based in Covina, serving San Dimas, Glendora, West Covina and the greater Los Angeles area. Every camera is tested, cleaned, and backed by a 90-day warranty.",
  alternates: { canonical: "/los-angeles-y2k-digital-camera-store" },
  openGraph: {
    title: "Y2K Digital Camera Store in Los Angeles & Covina, CA | Measure Joy",
    description:
      "Tested vintage digicams with a 90-day warranty, based in Covina and serving the greater Los Angeles area.",
    images: [{ url: "/aesthetic-flat-lay-vintage-digital-cameras-y2k-nos.jpg" }],
  },
}

const LOCAL_FAQS = [
  {
    q: "Where is Measure Joy located?",
    a: "Measure Joy is based in Covina, California, in the San Gabriel Valley. We serve San Dimas, Glendora, West Covina, Pomona, Azusa, and the greater Los Angeles area, and we ship tested Y2K digital cameras across the US.",
  },
  {
    q: "Do you sell tested vintage digital cameras with a warranty?",
    a: "Yes. Every camera passes a 15-point inspection covering lens clarity, LCD function, buttons, flash, and image quality, ships with a compatible battery, and is backed by a 90-day functionality warranty.",
  },
  {
    q: "How fast is shipping to the Los Angeles area?",
    a: "Orders ship from Covina, so Los Angeles–area deliveries typically arrive within 1–3 business days with standard shipping. Orders over $75 ship free within the continental US.",
  },
  {
    q: "Do you repair Y2K digital cameras?",
    a: "We offer repair services for vintage digital cameras — common issues like lens errors, stuck shutters, and battery-door problems. See our repair page for details.",
  },
  {
    q: "What brands do you carry?",
    a: "We carry tested Y2K-era digicams from Canon (PowerShot), Sony (Cyber-shot), Nikon (Coolpix), Fujifilm (FinePix), Olympus, Kodak, Casio, Panasonic, and more, plus memory cards, cases, straps, and batteries.",
  },
]

export default async function LocalStorePage() {
  let inventory: any[] = []
  try {
    const products = await getStripeProducts({ category: "camera" })
    inventory = products.filter((p) => p.inStock).slice(0, 8)
  } catch {
    inventory = []
  }

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Los Angeles Y2K Camera Store", path: "/los-angeles-y2k-digital-camera-store" },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(LOCAL_FAQS)) }}
      />
      <Header />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-5 py-14 lg:px-8 lg:py-20">
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <MapPin className="mr-1.5 inline h-3.5 w-3.5" />
            Covina, California
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold uppercase tracking-tight lg:text-5xl">
            Los Angeles&apos; Y2K Digital Camera Store
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground lg:text-lg">
            Measure Joy is a Southern California Y2K digital-camera store based in Covina,
            serving San Dimas, Glendora, West Covina and the greater Los Angeles area. Every
            camera is tested, cleaned and backed by a 90-day warranty.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/shop">Shop Current Inventory</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/repair">Camera Repair</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4 lg:px-8">
          {[
            { icon: Camera, title: "15-Point Inspection", text: "Lens, LCD, buttons, flash & image quality — every camera, every time." },
            { icon: ShieldCheck, title: "90-Day Warranty", text: "If your camera develops a fault, we repair or replace it free." },
            { icon: Truck, title: "Ships from Covina", text: "1–3 day delivery across the LA area. Free US shipping over $75." },
            { icon: Wrench, title: "Repair Services", text: "Lens errors, shutters, battery doors — we fix Y2K digicams." },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-5 w-5" strokeWidth={1.5} />
              <h2 className="mt-3 font-display text-[12px] font-semibold uppercase tracking-[0.12em]">
                {item.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Local copy + map */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight lg:text-3xl">
              Serving the San Gabriel Valley &amp; Greater LA
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground lg:text-base">
              Based in Covina, we&apos;re minutes from San Dimas via the 10 or 210 freeways and an
              easy trip from anywhere in the San Gabriel Valley. Whether you&apos;re a student at Cal
              Poly Pomona hunting your first digicam, a photographer in Glendora chasing the CCD
              look, or anywhere in Los Angeles wanting a tested camera instead of an untested
              gamble — we&apos;ve got you.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground lg:text-base">
              Every camera we sell is a one-of-one: photographed, inspected and graded
              individually, shipped with a compatible battery, and covered by our 90-day
              functionality warranty. No junk-drawer mystery cameras.
            </p>
            <div className="mt-6">
              <h3 className="font-display text-[12px] font-semibold uppercase tracking-[0.12em]">
                Areas we serve
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {SERVICE_AREAS.map((area) => (
                  <span
                    key={area}
                    className="border border-border px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Questions? <Link href="/contact" className="underline hover:text-foreground">Contact us</Link> or
              follow along on{" "}
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Instagram @measurejoycamera
              </a>.
            </p>
          </div>
          <div className="min-h-[320px] overflow-hidden border border-border">
            <iframe
              title="Measure Joy service area — Covina, California"
              src="https://www.google.com/maps?q=Covina,+CA&z=11&output=embed"
              className="h-full w-full"
              style={{ minHeight: 320, border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* Current local inventory */}
      {inventory.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-[1400px] px-5 py-14 lg:px-8 lg:py-20">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight lg:text-3xl">
                In Stock Now
              </h2>
              <Link
                href="/shop"
                className="font-display text-[12px] font-semibold uppercase tracking-[0.1em] underline hover:opacity-70"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {inventory.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Local FAQs */}
      <section>
        <div className="mx-auto max-w-3xl px-5 py-14 lg:px-8 lg:py-20">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight lg:text-3xl">
            Local FAQs
          </h2>
          <dl className="mt-8 space-y-8">
            {LOCAL_FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="font-display text-sm font-semibold uppercase tracking-[0.06em]">
                  {faq.q}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Footer />
    </main>
  )
}
