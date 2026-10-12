import type { Metadata } from "next";
import { PolicyPage } from "@/components/editorial-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      path="/terms"
      updated="December 15, 2025"
    >
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold">1. Agreement to Terms</h2>
          <p className="text-muted-foreground mt-2">
            By accessing or using Measure Joy's website and services, you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">2. Products</h2>
          <p className="text-muted-foreground mt-2">
            All products sold on Measure Joy are pre-owned vintage cameras.
            While we thoroughly test and inspect each camera, they are sold "as
            described" and may show signs of previous use consistent with their
            age. Product photos and descriptions aim to accurately represent
            each item's condition.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">3. Pricing & Payment</h2>
          <p className="text-muted-foreground mt-2">
            All prices are listed in US Dollars. We reserve the right to modify
            prices at any time. Payment is processed securely through Stripe. By
            completing a purchase, you represent that you are authorized to use
            the payment method provided.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">4. Shipping</h2>
          <p className="text-muted-foreground mt-2">
            We ship to select countries as outlined in our Shipping Information
            page. Delivery times are estimates and not guaranteed. We are not
            responsible for delays caused by customs, weather, or carrier
            issues.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">5. Returns & Refunds</h2>
          <p className="text-muted-foreground mt-2">
            Returns are accepted within 14 days of delivery per our Return
            Policy. Refunds are processed to the original payment method within
            5-10 business days of receiving the returned item.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">6. Limitation of Liability</h2>
          <p className="text-muted-foreground mt-2">
            Measure Joy shall not be liable for any indirect, incidental,
            special, or consequential damages arising from the use of our
            products or services. Our liability is limited to the purchase price
            of the product.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">7. Contact</h2>
          <p className="text-muted-foreground mt-2">
            Questions about these Terms should be directed to
            hello@measurejoy.com.
          </p>
        </section>
      </div>
    </PolicyPage>
  );
}
