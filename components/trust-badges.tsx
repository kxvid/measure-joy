import { Shield, Truck, RefreshCw, CreditCard } from "lucide-react"

export function TrustBadges() {
  const badges = [
    { icon: Shield, text: "Secure Checkout" },
    { icon: Truck, text: "Free Shipping $99+" },
    { icon: RefreshCw, text: "30-Day Returns" },
    { icon: CreditCard, text: "Stripe Protected" },
  ]

  return (
    <div className="grid grid-cols-2 gap-px border-y border-border bg-border lg:grid-cols-4">
      {badges.map((badge) => (
        <div key={badge.text} className="flex items-center gap-3 bg-background py-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border">
            <badge.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
          </div>
          <span className="font-display text-[11px] font-medium uppercase tracking-[0.1em]">{badge.text}</span>
        </div>
      ))}
    </div>
  )
}
