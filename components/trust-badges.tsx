import { Shield, Truck, RefreshCw, CreditCard } from "lucide-react"

export function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      text: "Secure Checkout",
    },
    {
      icon: Truck,
      text: "Free Shipping $75+",
    },
    {
      icon: RefreshCw,
      text: "14-Day Returns",
    },
    {
      icon: CreditCard,
      text: "Stripe Protected",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 border-y border-border">
      {badges.map((badge) => (
        <div key={badge.text} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <badge.icon className="h-5 w-5 text-accent" />
          </div>
          <span className="text-xs font-medium">{badge.text}</span>
        </div>
      ))}
    </div>
  )
}
