import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RotateCcw, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8">Returns & Warranty</h1>

        {/* Key policies */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <RotateCcw className="h-6 w-6 text-accent" />
            <h3 className="font-bold mt-4">14-Day Returns</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Return any camera within 14 days of delivery for a full refund.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <Shield className="h-6 w-6 text-accent" />
            <h3 className="font-bold mt-4">30-Day Warranty</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All cameras include a functionality warranty covering defects.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold">Return Policy</h2>
            <div className="text-muted-foreground mt-4 space-y-4">
              <p>
                We want you to love your camera. If you're not completely satisfied with your purchase, you may return
                it within 14 days of delivery for a full refund.
              </p>
              <p>To be eligible for a return:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Camera must be in original condition</li>
                <li>All included accessories must be returned</li>
                <li>Original packaging should be included when possible</li>
                <li>Camera must not show signs of damage or misuse</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">Warranty Coverage</h2>
            <div className="text-muted-foreground mt-4 space-y-4">
              <p>
                Every camera comes with a 30-day functionality warranty. This covers any defects in the camera's core
                functions including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Lens and autofocus mechanism</li>
                <li>LCD screen functionality</li>
                <li>Flash operation</li>
                <li>Button and control responsiveness</li>
                <li>Memory card reader</li>
                <li>Battery compartment</li>
              </ul>
              <p>
                If your camera develops any issues within the warranty period, contact us and we'll repair or replace it
                at no cost.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              What's Not Covered
            </h2>
            <div className="text-muted-foreground mt-4">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Physical damage from drops or impacts</li>
                <li>Water or liquid damage</li>
                <li>Cosmetic wear from normal use</li>
                <li>Issues caused by incompatible accessories</li>
                <li>Battery degradation (batteries are consumables)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">How to Start a Return</h2>
            <div className="text-muted-foreground mt-4 space-y-4">
              <p>
                To initiate a return or warranty claim, please contact us with your order number and a description of
                the issue. We'll provide you with a prepaid return label and instructions.
              </p>
              <Button asChild className="mt-4">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
