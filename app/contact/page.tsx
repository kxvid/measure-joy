import type { Metadata } from "next"
import ContactPageClient from "./contact-page-client"

export const metadata: Metadata = {
  title: "Contact Us - Measure Joy | Get in Touch",
  description:
    "Have questions about Y2K cameras? Need help with an order? Contact Measure Joy - we typically respond within 24 hours.",
}

export default function ContactPage() {
  return <ContactPageClient />
}
