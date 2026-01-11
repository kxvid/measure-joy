import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Truck, Package, Globe, Clock } from "lucide-react"

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8">Shipping Information</h1>

        {/* Shipping options */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: Truck, title: "Standard Shipping", time: "3-5 business days", price: "$9.99" },
            { icon: Clock, title: "Express Shipping", time: "1-2 business days", price: "$19.99" },
          ].map((option) => (
            <div key={option.title} className="bg-card border border-border rounded-lg p-6">
              <option.icon className="h-6 w-6 text-accent" />
              <h3 className="font-bold mt-4">{option.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{option.time}</p>
              <p className="font-mono font-bold mt-2">{option.price}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Free Shipping
            </h2>
            <p className="text-muted-foreground mt-2">
              Orders over $100 qualify for free standard shipping within the continental United States. This offer is
              automatically applied at checkout.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              International Shipping
            </h2>
            <p className="text-muted-foreground mt-2">
              We ship to Canada, United Kingdom, and Australia. International shipping rates are calculated at checkout
              based on package weight and destination.
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-1">
              <li>Canada: 5-10 business days ($14.99)</li>
              <li>United Kingdom: 7-14 business days ($19.99)</li>
              <li>Australia: 10-14 business days ($24.99)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">Packaging</h2>
            <p className="text-muted-foreground mt-2">
              Every camera is carefully packaged in protective materials to ensure safe delivery. We use recycled and
              recyclable packaging materials whenever possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Tracking</h2>
            <p className="text-muted-foreground mt-2">
              Once your order ships, you'll receive an email with tracking information. You can track your package at
              any time using the provided tracking number.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
