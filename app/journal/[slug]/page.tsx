import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Newsletter } from "@/components/newsletter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { JOURNAL_POSTS, formatPostDate, getJournalPost } from "@/lib/journal"
import { articleJsonLd, SITE_URL } from "@/lib/seo"

export function generateStaticParams() {
  return JOURNAL_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getJournalPost(slug)

  if (!post) {
    return { title: "Article Not Found" }
  }

  return {
    title: `${post.title} — Measure Joy Journal`,
    description: post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/journal/${post.slug}`,
      images: [{ url: post.image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  }
}

// Renders inline markdown-style links ([label](/path)) inside a paragraph.
function renderParagraph(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (match) {
      return (
        <Link key={i} href={match[2]} className="font-medium text-foreground underline underline-offset-4 hover:text-accent transition-colors">
          {match[1]}
        </Link>
      )
    }
    return part
  })
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getJournalPost(slug)

  if (!post) {
    notFound()
  }

  const jsonLd = articleJsonLd({
    slug: post.slug,
    title: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.date,
  })

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 lg:py-16">
        {/* Breadcrumb */}
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Journal
        </Link>

        <article className="mx-auto max-w-3xl mt-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{post.category}</Badge>
            <span className="font-mono text-sm text-muted-foreground">{formatPostDate(post.date)}</span>
            <span className="text-muted-foreground" aria-hidden="true">
              ·
            </span>
            <span className="font-mono text-sm text-muted-foreground">{post.readTime}</span>
          </div>

          {/* Title */}
          <h1 className="mt-4 font-display text-3xl lg:text-5xl font-extrabold uppercase leading-[1.02] tracking-tight">
            {post.title}
          </h1>

          {/* Hero image */}
          <div className="relative mt-8 aspect-video overflow-hidden rounded-lg bg-secondary">
            <Image
              src={post.image || "/placeholder.svg"}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="mt-10">
            {post.content.map((section, i) => (
              <section key={i} className={i > 0 ? "mt-10" : undefined}>
                {section.heading && (
                  <h2 className="font-display text-xl lg:text-2xl font-extrabold uppercase tracking-tight">
                    {section.heading}
                  </h2>
                )}
                <div className={section.heading ? "mt-4 space-y-4" : "space-y-4"}>
                  {section.paragraphs.map((paragraph, j) => (
                    <p key={j} className="leading-relaxed text-muted-foreground">
                      {renderParagraph(paragraph)}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 border border-border bg-card rounded-lg p-8 text-center">
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Tested. Warrantied. Ready to shoot.
            </span>
            <h2 className="mt-3 font-display text-2xl lg:text-3xl font-extrabold uppercase tracking-tight">
              Find your Y2K camera
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Every camera passes our 15-point inspection and ships with a working battery and a 90-day warranty.
            </p>
            <Button asChild className="mt-6">
              <Link href="/shop">
                Shop tested Y2K cameras
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </article>
      </div>

      <Newsletter />
      <Footer />
    </main>
  )
}
