import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { EditorialPage, EditorialBackLink } from "@/components/editorial-page";
import { Newsletter } from "@/components/newsletter";
import { JOURNAL_POSTS, formatPostDate, getJournalPost } from "@/lib/journal";
import { articleJsonLd, SITE_URL } from "@/lib/seo";

export function generateStaticParams() {
  return JOURNAL_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getJournalPost(slug);

  if (!post) {
    return { title: "Article Not Found" };
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
  };
}

// Renders inline markdown-style links ([label](/path)) inside a paragraph.
function renderParagraph(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <Link
          key={i}
          href={match[2]}
          className="font-medium text-foreground underline underline-offset-4 hover:text-accent transition-colors"
        >
          {match[1]}
        </Link>
      );
    }
    return part;
  });
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getJournalPost(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = articleJsonLd({
    slug: post.slug,
    title: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.date,
  });

  return (
    <EditorialPage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="ed-article">
        <EditorialBackLink href="/journal">
          Back to field notes
        </EditorialBackLink>
        <header className="ed-article-header">
          <div className="ed-journal-meta">
            <span className="ed-journal-category">{post.category}</span>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span aria-hidden="true">/</span>
            <span>{post.readTime}</span>
          </div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
        </header>
        <div className="ed-article-image">
          <Image
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 1100px) 88vw, 1000px"
          />
        </div>
        <div className="ed-article-layout">
          <aside className="ed-article-sidebar">
            <p>IN THIS STORY</p>
            <nav aria-label="Article sections">
              {post.content.map(
                (section, i) =>
                  section.heading && (
                    <a key={i} href={`#section-${i}`}>
                      {section.heading}
                    </a>
                  ),
              )}
            </nav>
          </aside>
          <div className="ed-article-body">
            {post.content.map((section, i) => (
              <section key={i} id={`section-${i}`}>
                {section.heading && <h2>{section.heading}</h2>}
                {section.paragraphs.map((paragraph, j) => (
                  <p key={j}>{renderParagraph(paragraph)}</p>
                ))}
              </section>
            ))}
            <div className="ed-article-cta">
              <h2>Find your Y2K camera.</h2>
              <p>
                Every camera passes our 15-point inspection and ships with a
                working battery and a 90-day warranty.
              </p>
              <Link className="ed-button" href="/shop">
                Shop tested Y2K cameras <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </article>
      <div className="ed-newsletter">
        <Newsletter />
      </div>
    </EditorialPage>
  );
}
