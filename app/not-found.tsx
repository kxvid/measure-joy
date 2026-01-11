import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Camera, Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-2xl">
          {/* 404 illustration */}
          <div className="relative inline-block mb-8">
            <div className="text-[120px] lg:text-[180px] font-black text-pop-yellow leading-none">404</div>
            <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 lg:h-24 lg:w-24 text-foreground opacity-20" />
          </div>

          <h1 className="text-2xl lg:text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Oops! This page seems to have gone missing, just like that perfect shot you forgot to save.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
              <Link href="/shop">
                <Search className="h-4 w-4" />
                Browse Cameras
              </Link>
            </Button>
          </div>

          {/* Quick links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/shop?category=camera" className="text-sm hover:text-accent transition-colors">
                Cameras
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/shop?category=accessory" className="text-sm hover:text-accent transition-colors">
                Accessories
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/repair" className="text-sm hover:text-accent transition-colors">
                Repair Services
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/about" className="text-sm hover:text-accent transition-colors">
                About Us
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/contact" className="text-sm hover:text-accent transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
