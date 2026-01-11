import { Camera, Shield, Truck, RefreshCcw } from "lucide-react"

const features = [
  {
    icon: Camera,
    title: "Tested & Working",
    description: "Every camera thoroughly tested before shipping",
  },
  {
    icon: Shield,
    title: "100% Authentic",
    description: "Genuine vintage cameras with verified history",
  },
  {
    icon: Truck,
    title: "Global Shipping",
    description: "Secure packaging, tracked worldwide delivery",
  },
  {
    icon: RefreshCcw,
    title: "30-Day Returns",
    description: "Full refund if you're not completely satisfied",
  },
]

export function About() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image side */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
              <img
                src="/aesthetic-flat-lay-vintage-digital-cameras-y2k-nos.jpg"
                alt="Collection of Y2K digital cameras"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -right-6 bg-card p-5 rounded-2xl shadow-xl border border-border max-w-[240px] hidden lg:block">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-card" />
                  ))}
                </div>
                <span className="text-sm font-medium">500+ happy customers</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
                <span className="text-sm text-muted-foreground ml-1">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Content side */}
          <div className="space-y-8">
            <div>
              <span className="font-mono text-xs text-accent tracking-wide uppercase">Why Measure Joy</span>
              <h2 className="text-3xl lg:text-4xl font-bold mt-2 tracking-tight text-balance">
                Preserving the magic of Y2K photography
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                We're passionate collectors dedicated to finding and restoring the best digital cameras from the early
                2000s. Each camera is carefully sourced, tested, and prepared to capture your memories with that
                unmistakable vintage aesthetic.
              </p>
            </div>

            {/* Features grid */}
            <div className="grid sm:grid-cols-2 gap-5">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm">
                    <feature.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
