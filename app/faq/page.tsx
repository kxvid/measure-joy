import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/breadcrumbs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ - Measure Joy | Frequently Asked Questions",
  description:
    "Find answers to common questions about Y2K cameras, shipping, returns, warranty, and more at Measure Joy.",
}

const faqs = [
  {
    category: "Ordering & Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "Domestic orders typically arrive within 3-5 business days. International shipping takes 7-14 business days depending on the destination.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes! We ship to the US, Canada, UK, and Australia. Shipping costs are calculated at checkout based on your location.",
      },
      {
        q: "Is shipping free?",
        a: "Orders over $75 qualify for free standard shipping within the continental US. Other orders have a flat rate of $9.99.",
      },
    ],
  },
  {
    category: "Returns & Warranty",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 14-day return window for cameras in their original condition. Items must be returned with all included accessories and packaging.",
      },
      {
        q: "Do cameras come with a warranty?",
        a: "Yes, all cameras come with a 90-day functionality warranty. If your camera develops any issues within this period, we'll repair or replace it free of charge.",
      },
      {
        q: "What if my camera arrives damaged?",
        a: "Contact us immediately with photos of the damage. We'll arrange a replacement or full refund at no extra cost to you.",
      },
    ],
  },
  {
    category: "Camera Condition",
    questions: [
      {
        q: "What does 'Excellent' condition mean?",
        a: "Excellent condition cameras show minimal signs of use with no significant cosmetic wear. All functions work perfectly.",
      },
      {
        q: "Are batteries included?",
        a: "Yes, we include a compatible battery with every camera. Some models use proprietary batteries while others use standard AA/AAA.",
      },
      {
        q: "Do cameras come with memory cards?",
        a: "Memory cards are not included unless specifically mentioned in the listing. We recommend checking which card type your camera uses before ordering.",
      },
      {
        q: "Are these cameras tested?",
        a: "Every camera undergoes a comprehensive 15-point inspection including lens clarity, LCD function, button response, flash, and image quality tests.",
      },
    ],
  },
  {
    category: "Payment & Security",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, American Express), as well as Apple Pay and Google Pay through our secure Stripe checkout.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes, all transactions are processed through Stripe, a PCI-compliant payment processor. We never store your full card details on our servers.",
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-8 lg:py-12">
        <Breadcrumbs items={[{ label: "FAQ" }]} />

        {/* Page header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-3xl lg:text-5xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mt-4">
            Find answers to common questions about our cameras, shipping, and policies.
          </p>
        </div>

        {/* FAQ sections */}
        <div className="space-y-8">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-bold mb-4">{section.category}</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {section.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${section.category}-${index}`}
                    className="bg-card border border-border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline text-left">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-12 p-8 bg-secondary rounded-lg text-center">
          <h3 className="text-xl font-bold">Still have questions?</h3>
          <p className="text-muted-foreground mt-2">
            We're here to help! Reach out and we'll get back to you within 24 hours.
          </p>
          <Button asChild className="mt-4">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>

      <Footer />
    </main>
  )
}
