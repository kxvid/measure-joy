import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Newsletter } from "@/components/newsletter"
import { Badge } from "@/components/ui/badge"
import { JOURNAL_POSTS, formatPostDate } from "@/lib/journal"

export default function JournalPage() {
  const featuredPost = JOURNAL_POSTS.find((p) => p.featured)
  const regularPosts = JOURNAL_POSTS.filter((p) => !p.featured)

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
          <Link href={`/journal/${featuredPost.slug}`} className="group block mb-12">
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
                <span className="font-mono text-sm text-muted-foreground mt-6">{formatPostDate(featuredPost.date)}</span>
              </div>
            </div>
          </Link>
        )}

        {/* Post grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/journal/${post.slug}`}
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
                <span className="font-mono text-xs text-muted-foreground mt-4 block">{formatPostDate(post.date)}</span>
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
