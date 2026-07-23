"use client"

import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/motion-primitives"

/* ------------------------------------------------------------------ *
 * Social integration — just point to your posts.
 *
 * Edit PROFILES with your handles, and POSTS with the URL of each
 * Instagram / TikTok post plus a thumbnail image (drop the image in
 * /public or use an existing one). Each tile links straight to the post.
 * No API keys required.
 * ------------------------------------------------------------------ */

const PROFILES = {
  instagram: "https://www.instagram.com/measurejoy/",
  tiktok: "https://www.tiktok.com/@measurejoy",
}

type Post = { platform: "instagram" | "tiktok"; href: string; image: string; caption?: string }

const POSTS: Post[] = [
  { platform: "instagram", href: PROFILES.instagram, image: "/colorful-digital-cameras-pink-blue-y2k-aesthetic.jpg", caption: "New drops every week" },
  { platform: "tiktok", href: PROFILES.tiktok, image: "/editorial-y2k-flatlay.png", caption: "Tested & restored" },
  { platform: "instagram", href: PROFILES.instagram, image: "/fujifilm-finepix-pink-digital-camera-cute-y2k.jpg", caption: "Pink FinePix" },
  { platform: "tiktok", href: PROFILES.tiktok, image: "/aesthetic-flat-lay-vintage-digital-cameras-y2k-nos.jpg", caption: "Behind the bench" },
  { platform: "instagram", href: PROFILES.instagram, image: "/colorful-camera-neck-strap-y2k-pattern.jpg", caption: "Strap drop" },
  { platform: "instagram", href: PROFILES.instagram, image: "/collection-of-vintage-cameras.jpg", caption: "The collection" },
]

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.4 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5.01-4.74.07-.9.04-1.38.2-1.7.32-.43.17-.74.37-1.06.7-.32.31-.52.62-.7 1.05-.12.33-.27.81-.31 1.7C3.4 9.1 3.4 9.46 3.4 12.6c0 3.15.01 3.5.07 4.74.04.9.2 1.38.32 1.7.17.43.37.74.7 1.06.31.32.62.52 1.05.7.33.12.81.27 1.7.31 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c.9-.04 1.38-.2 1.7-.32.43-.17.74-.37 1.06-.7.32-.31.52-.62.7-1.05.12-.33.27-.81.31-1.7.06-1.24.07-1.6.07-4.74s-.01-3.5-.07-4.74c-.04-.9-.2-1.38-.32-1.7a2.8 2.8 0 0 0-.7-1.06 2.8 2.8 0 0 0-1.05-.7c-.33-.12-.81-.27-1.7-.31C15.5 4.01 15.15 4 12 4Zm0 3.06A4.94 4.94 0 1 1 7.06 12 4.94 4.94 0 0 1 12 7.06Zm0 8.14A3.2 3.2 0 1 0 8.8 12 3.2 3.2 0 0 0 12 15.2Zm6.3-8.34a1.15 1.15 0 1 1-1.15-1.15 1.15 1.15 0 0 1 1.15 1.15Z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.04-2.82h-3.1v12.4a2.32 2.32 0 1 1-2.32-2.32c.24 0 .47.04.69.1v-3.16a5.46 5.46 0 0 0-.69-.04 5.43 5.43 0 1 0 5.43 5.43V9.01a7.3 7.3 0 0 0 4.27 1.37V7.27a4.28 4.28 0 0 1-3.24-1.45Z" />
    </svg>
  )
}

export function SocialFeed() {
  return (
    <section className="border-b border-border py-14 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <Reveal>
          <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="font-display text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Follow Along
              </span>
              <h2 className="mt-2 font-display text-2xl lg:text-4xl font-extrabold uppercase tracking-tight">
                @measurejoy
              </h2>
            </div>
            <div className="flex items-center gap-2.5">
              <a
                href={PROFILES.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 cursor-pointer [background:linear-gradient(45deg,#f09433,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888)]"
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </a>
              <a
                href={PROFILES.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-foreground px-4 py-2.5 font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-background transition-opacity hover:opacity-90 cursor-pointer"
              >
                <TikTokIcon className="h-4 w-4" />
                TikTok
              </a>
            </div>
          </div>
        </Reveal>

        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {POSTS.map((post, i) => (
            <StaggerItem key={i}>
              <a
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-secondary"
              >
                <Image
                  src={post.image}
                  alt={post.caption || `Measure Joy on ${post.platform}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/40" />
                <span className="absolute right-2 top-2 text-white drop-shadow">
                  {post.platform === "instagram" ? <InstagramIcon className="h-5 w-5" /> : <TikTokIcon className="h-5 w-5" />}
                </span>
                <span className="absolute bottom-2 left-2 right-2 flex items-center gap-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {post.caption || "View post"}
                </span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
