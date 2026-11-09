import type { Metadata } from "next";
import { PolicyPage } from "@/components/editorial-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      path="/privacy"
      updated="November 9, 2026"
    >
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold">Information We Collect</h2>
          <p className="text-muted-foreground mt-2">
            We collect information you provide directly, such as your name,
            email address, shipping address, and payment information when you
            make a purchase or contact us. We also automatically collect certain
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
            We do not sell your personal information. We share your information
            only with service providers who assist us in operating our business
            (payment processors, shipping carriers, and form delivery services)
            and as required by law.
          </p>
          <p className="text-muted-foreground mt-2">
            Contact and camera service requests without photos are processed by
            FormSubmit, which retains submissions for 30 days. Camera service
            requests with photos are processed by Resend instead. These services
            email the contact information, message, camera details, and any
            photos you provide to Christian at our workshop. Photos are sent as
            email attachments; we do not publish them in a public gallery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Payment Security</h2>
          <p className="text-muted-foreground mt-2">
            All payments are processed through Stripe, a PCI-DSS compliant
            payment processor. We do not store your full credit card information
            on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Cookies</h2>
          <p className="text-muted-foreground mt-2">
            Essential cookies support sign-in and checkout. We also use Vercel
            Analytics for aggregate site usage. With your permission, Google
            Analytics measures page views and shopping events, including product
            views, bag changes, checkout starts, and confirmed purchases. These
            events use product identifiers and order values; we do not send your
            name, email, address, form contents, or checkout links to Google Analytics.
            Google Signals and advertising personalization are disabled.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Your Analytics Choices</h2>
          <p className="text-muted-foreground mt-2">
            Optional analytics starts only after you allow it. Select Privacy
            choices at the bottom of the page to change your choice at any time.
            Global Privacy Control disables optional tracking. Declining analytics
            does not affect shopping or checkout. Your browser settings can also
            remove cookies already stored on your device.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Your Rights</h2>
          <p className="text-muted-foreground mt-2">
            You have the right to access, correct, or delete your personal
            information. To exercise these rights, please contact us at
            christianvelasquez363@gmail.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Contact Us</h2>
          <p className="text-muted-foreground mt-2">
            If you have questions about this Privacy Policy, please contact us
            at christianvelasquez363@gmail.com.
          </p>
        </section>
      </div>
    </PolicyPage>
  );
}
