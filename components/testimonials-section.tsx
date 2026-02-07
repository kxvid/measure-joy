import { Star } from "lucide-react"

interface TestimonialsSectionProps {
  cms?: Record<string, any>
}

const DEFAULT_TESTIMONIALS = [
  {
    name: "Sarah Chen",
    location: "Los Angeles, CA",
    text: "Bought a Sony Cybershot and it brought back so many memories! The quality is amazing and customer service was super helpful.",
    rating: 5,
    product: "Sony Cybershot DSC-P200",
    image: "/smiling-woman-profile.png",
  },
  {
    name: "Marcus Rodriguez",
    location: "Brooklyn, NY",
    text: "Perfect Y2K aesthetic for my photography project. Fast shipping and the camera works flawlessly. Highly recommend!",
    rating: 5,
    product: "Canon PowerShot A520",
    image: "/smiling-man-profile.png",
  },
  {
    name: "Emma Thompson",
    location: "Portland, OR",
    text: "I love the nostalgic feel of these cameras. Measure Joy has an amazing selection and everything arrived perfectly packaged.",
    rating: 5,
    product: "Fujifilm FinePix Z5fd",
    image: "/woman-with-glasses-smiling-profile-photo.jpg",
  },
]

const DEFAULT_HEADING = "Loved by Y2K Camera Enthusiasts"
const DEFAULT_SUBTITLE = "Join thousands of happy customers who've discovered the joy of vintage digital photography"

export function TestimonialsSection({ cms = {} }: TestimonialsSectionProps) {
  const heading = cms.heading || DEFAULT_HEADING
  const subtitle = cms.subtitle || DEFAULT_SUBTITLE
  const testimonials = Array.isArray(cms.items) ? cms.items : DEFAULT_TESTIMONIALS

  return (
    <section className="py-16 lg:py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">{heading}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial: any, index: number) => (
            <div
              key={index}
              className="bg-background p-6 lg:p-8 rounded-2xl border-2 border-border hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center gap-0.5 mb-4">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-pop-yellow text-pop-yellow" />
                ))}
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Verified Purchase</p>
                <p className="text-sm font-medium mt-1">{testimonial.product}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-pop-yellow px-6 py-3 rounded-full">
            <Star className="h-5 w-5 fill-foreground text-foreground" />
            <span className="font-bold">Top-rated store for vintage tech</span>
          </div>
        </div>
      </div>
    </section>
  )
}
