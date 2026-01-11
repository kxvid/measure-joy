import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Newsletter } from "@/components/newsletter"
import { Badge } from "@/components/ui/badge"

const posts = [
  {
    id: "why-y2k-cameras",
    title: "Why Y2K Cameras Are Making a Comeback",
    excerpt:
      "In an age of AI-enhanced smartphone photos, there's something refreshing about the raw, unfiltered aesthetic of early digital cameras.",
    date: "Dec 10, 2025",
    category: "Culture",
    image: "/vintage-digital-camera-aesthetic-y2k.jpg",
    featured: true,
  },
  {
    id: "best-cameras-beginners",
    title: "The Best Y2K Cameras for Beginners",
    excerpt:
      "New to vintage digital photography? Here are our top picks for first-time collectors looking to capture that authentic early 2000s look.",
    date: "Dec 5, 2025",
    category: "Guides",
    image: "/collection-of-vintage-cameras.jpg",
  },
  {
    id: "care-guide",
    title: "How to Care for Your Vintage Camera",
    excerpt: "Keep your Y2K camera in top condition with these essential maintenance tips from our expert team.",
    date: "Nov 28, 2025",
    category: "Tips",
    image: "/camera-maintenance-cleaning.jpg",
  },
  {
    id: "memory-cards-guide",
    title: "A Guide to Y2K Memory Cards",
    excerpt:
      "From Memory Stick to xD-Picture Cards—everything you need to know about storage options for your vintage camera.",
    date: "Nov 20, 2025",
    category: "Guides",
    image: "/various-memory-cards-sd-card.jpg",
  },
  {
    id: "photo-editing-tips",
    title: "Editing Tips for Y2K Photos",
    excerpt:
      "Learn how to enhance (without over-processing) your vintage camera shots while keeping their authentic charm.",
    date: "Nov 15, 2025",
    category: "Tips",
    image: "/photo-editing-software-vintage.jpg",
  },
  {
    id: "sony-cybershot-history",
    title: "The History of Sony Cybershot",
    excerpt:
      "A deep dive into one of the most iconic camera lines of the early digital era and why they remain beloved today.",
    date: "Nov 8, 2025",
    category: "History",
    image: "/sony-cybershot-camera-history.jpg",
  },
]

export default function JournalPage() {
  const featuredPost = posts.find((p) => p.featured)
  const regularPosts = posts.filter((p) => !p.featured)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 lg:py-16">
        {/* Page header */}
        <div className="mb-12">
          <h1 className="text-3xl lg:text-5xl font-bold">Journal</h1>
          <p className="text-muted-foreground mt-4">Stories, guides, and tips from the world of Y2K photography.</p>
        </div>

        {/* Featured post */}
        {featuredPost && (
          <Link href={`/journal/${featuredPost.id}`} className="group block mb-12">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 bg-card border border-border rounded-lg overflow-hidden">
              <div className="aspect-video lg:aspect-auto overflow-hidden">
                <img
                  src={featuredPost.image || "/placeholder.svg"}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 lg:p-8 flex flex-col justify-center">
                <Badge variant="secondary" className="w-fit">
                  {featuredPost.category}
                </Badge>
                <h2 className="text-2xl lg:text-3xl font-bold mt-4 group-hover:text-accent transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mt-4">{featuredPost.excerpt}</p>
                <span className="font-mono text-sm text-muted-foreground mt-6">{featuredPost.date}</span>
              </div>
            </div>
          </Link>
        )}

        {/* Post grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularPosts.map((post) => (
            <Link
              key={post.id}
              href={`/journal/${post.id}`}
              className="group bg-card border border-border rounded-lg overflow-hidden"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image || "/placeholder.svg"}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <Badge variant="secondary" className="text-xs">
                  {post.category}
                </Badge>
                <h3 className="font-bold mt-3 group-hover:text-accent transition-colors">{post.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>
                <span className="font-mono text-xs text-muted-foreground mt-4 block">{post.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Newsletter />
      <Footer />
    </main>
  )
}
