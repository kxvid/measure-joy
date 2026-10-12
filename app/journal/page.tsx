import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { EditorialPage, EditorialHeading } from "@/components/editorial-page";
import { Newsletter } from "@/components/newsletter";
import { JOURNAL_POSTS, formatPostDate } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Field Notes — The Measure Joy Journal",
  description: "Stories, guides, and tips from the world of Y2K photography.",
  alternates: { canonical: "/journal" },
};

export default function JournalPage() {
  const featuredPost = JOURNAL_POSTS.find((p) => p.featured);
  const regularPosts = JOURNAL_POSTS.filter((p) => !p.featured);

  return (
    <EditorialPage>
      <EditorialHeading
        label="The Measure Joy journal"
        title="Field notes."
        description="A little inspiration for what happens on the other side of the lens."
      />
      <section className="ed-section" aria-label="Journal stories">
        {featuredPost && (
          <Link
            href={`/journal/${featuredPost.slug}`}
            className="ed-journal-feature"
          >
            <div className="ed-journal-feature-photo">
              <Image
                src={featuredPost.image || "/placeholder.svg"}
                alt={featuredPost.title}
                fill
                priority
                sizes="(max-width: 640px) 88vw, 50vw"
              />
            </div>
            <div className="ed-journal-feature-copy">
              <div className="ed-journal-meta">
                <span className="ed-journal-category">
                  {featuredPost.category}
                </span>
                <time dateTime={featuredPost.date}>
                  {formatPostDate(featuredPost.date)}
                </time>
              </div>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
              <span className="ed-link">
                Read the story <ArrowUpRight size={17} />
              </span>
            </div>
          </Link>
        )}
        <div className="ed-section-top">
          <h2>Good things to know.</h2>
          <p>Stories, guides, and a fresh perspective</p>
        </div>
        <div className="ed-journal-grid">
          {regularPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/journal/${post.slug}`}
              className="ed-journal-card"
            >
              <div className="ed-journal-card-photo">
                <Image
                  src={post.image || "/placeholder.svg"}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 88vw, (max-width: 1000px) 42vw, 28vw"
                />
              </div>
              <div className="ed-journal-meta">
                <span>{post.category}</span>
                <span aria-hidden="true">/</span>
                <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              </div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <span className="ed-link">
                Read the story <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <div className="ed-newsletter">
        <Newsletter />
      </div>
    </EditorialPage>
  );
}
