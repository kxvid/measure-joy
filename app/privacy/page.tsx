import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 15, 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold">Information We Collect</h2>
            <p className="text-muted-foreground mt-2">
              We collect information you provide directly, such as your name, email address, shipping address, and
              payment information when you make a purchase or contact us. We also automatically collect certain
              information about your device and browsing behavior.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">How We Use Your Information</h2>
            <div className="text-muted-foreground mt-2">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Communicate with you about your orders and inquiries</li>
                <li>Send promotional emails (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Prevent fraud and ensure security</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">Information Sharing</h2>
            <p className="text-muted-foreground mt-2">
              We do not sell your personal information. We share your information only with service providers who assist
              us in operating our business (payment processors, shipping carriers) and as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Payment Security</h2>
            <p className="text-muted-foreground mt-2">
              All payments are processed through Stripe, a PCI-DSS compliant payment processor. We do not store your
              full credit card information on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Cookies</h2>
            <p className="text-muted-foreground mt-2">
              We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and
              personalize content. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Your Rights</h2>
            <p className="text-muted-foreground mt-2">
              You have the right to access, correct, or delete your personal information. To exercise these rights,
              please contact us at hello@measurejoy.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Contact Us</h2>
            <p className="text-muted-foreground mt-2">
              If you have questions about this Privacy Policy, please contact us at hello@measurejoy.com.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
