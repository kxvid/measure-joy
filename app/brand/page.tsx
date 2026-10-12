/* Native elements avoid a Vinext preview hook error in next/image and next/link. */
/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */
import type { Metadata } from "next";
import BrandPalette from "../../components/brand-palette";
import "./brand.css";

export const metadata: Metadata = {
  title: "The brand, in focus — Measure Joy",
  description:
    "The Measure Joy identity: editable logos, color, typography, social templates, and a complete downloadable brand kit.",
};

const variants = [
  {
    name: "Horizontal lockup",
    file: "horizontal",
    description: "Our everyday signature. Give it room to breathe.",
    className: "brand-logo-horizontal",
  },
  {
    name: "Stacked lockup",
    file: "stacked",
    description: "For smaller spaces with a little more height.",
    className: "brand-logo-stacked",
  },
  {
    name: "The joy mark",
    file: "icon",
    description: "Four corners. Two eyes. One good feeling.",
    className: "brand-logo-icon",
  },
];
const downloads = [
  {
    number: "01",
    title: "Complete brand kit",
    description:
      "All logos, fonts, icons, social assets, templates and brand notes.",
    format: "ZIP",
    href: "/brand/measure-joy-brand-kit.zip",
  },
  {
    number: "02",
    title: "Brand guidelines",
    description: "A concise guide to using the identity well.",
    format: "MD",
    href: "/brand/brand-guidelines.md",
  },
  {
    number: "03",
    title: "Design tokens",
    description:
      "The exact colors and type choices, ready for your next build.",
    format: "JSON",
    href: "/brand/tokens.json",
    secondary: { label: "CSS", href: "/brand/tokens.css" },
  },
  {
    number: "04",
    title: "Web & app icons",
    description:
      "SVG favicon, 16/32/48 px ICO, Apple touch icon and app icons in the kit.",
    format: "ICO",
    href: "/brand/icons/favicon.ico",
    secondary: { label: "SVG", href: "/brand/icons/favicon.svg" },
  },
  {
    number: "05",
    title: "Font family",
    description:
      "Space Grotesk variable. Both families and open licenses are in the kit.",
    format: "TTF",
    href: "/brand/fonts/SpaceGrotesk-Variable.ttf",
    secondary: {
      label: "SERIF",
      href: "/brand/fonts/InstrumentSerif-Italic.ttf",
    },
  },
  {
    number: "06",
    title: "Asset inventory",
    description:
      "File dimensions, sizes and checksums for the complete collection.",
    format: "JSON",
    href: "/brand/asset-manifest.json",
  },
];

export default function BrandPage() {
  return (
    <main className="brand-page">
      <a className="brand-skip" href="#brand-content">
        Skip to brand guide
      </a>
      <header className="brand-header">
        <a
          href="/"
          className="brand-home"
          aria-label="Measure Joy — back to the shop"
        >
          <img
            src="/brand/logos/measure-joy-horizontal-ink.svg"
            width="190"
            height="42"
            alt="measure joy"
          />
        </a>
        <span className="brand-header-note">THE BRAND, IN FOCUS</span>
        <a
          className="brand-button"
          href="/brand/measure-joy-brand-kit.zip"
          download
        >
          Get the kit <span aria-hidden="true">↓</span>
        </a>
      </header>

      <div id="brand-content">
        <section className="brand-intro" aria-labelledby="brand-title">
          <div className="brand-eyebrow">
            <span>MEASURE JOY / BRAND SYSTEM</span>
            <span>VOL. 01 — 2026</span>
          </div>
          <div className="brand-intro-grid">
            <h1 id="brand-title">
              A feeling.
              <br />
              <em>Made visible.</em>
            </h1>
            <div className="brand-intro-aside">
              <div className="brand-sticker" aria-hidden="true">
                <img
                  src="/brand/logos/measure-joy-icon-ink.svg"
                  width="132"
                  height="132"
                  alt=""
                />
                <span>MORE FEELING, PLEASE.</span>
              </div>
              <p>
                A little nostalgic. A little unexpected. Always full of life.
                Meet the visual world of Measure Joy.
              </p>
              <a className="brand-text-link" href="#brand-downloads">
                Make it yours <span aria-hidden="true">↘</span>
              </a>
            </div>
          </div>
          <nav className="brand-chapter-nav" aria-label="Brand guide chapters">
            <a href="#brand-logos">01 — The mark</a>
            <a href="#brand-colors">02 — The palette</a>
            <a href="#brand-type">03 — The type</a>
            <a href="#brand-social">04 — Out in the world</a>
          </nav>
        </section>

        <section
          className="brand-section"
          id="brand-logos"
          aria-labelledby="brand-logos-heading"
        >
          <div className="brand-section-heading">
            <p className="brand-eyebrow">01 / THE MARK</p>
            <h2 id="brand-logos-heading">
              Frame the <em>good stuff.</em>
            </h2>
            <p>
              A viewfinder with a smile. Our symbol is a reminder that the
              feeling matters as much as the photo.
            </p>
          </div>
          <div className="brand-logo-hero">
            <img
              src="/brand/logos/measure-joy-horizontal-ink.svg"
              width="640"
              height="140"
              alt="Measure Joy primary horizontal logo"
            />
            <span>THE PRIMARY SIGNATURE</span>
            <span>LOWERCASE. ALWAYS.</span>
          </div>
          <div className="brand-logo-grid">
            {variants.map((variant) => (
              <article className="brand-logo-variant" key={variant.file}>
                <div className={`brand-logo-preview ${variant.className}`}>
                  <img
                    src={`/brand/logos/measure-joy-${variant.file}-${variant.file === "stacked" ? "ivory" : "ink"}.svg`}
                    alt={`Measure Joy ${variant.name.toLowerCase()}`}
                    width={variant.file === "icon" ? 128 : 560}
                    height={variant.file === "stacked" ? 300 : 140}
                  />
                </div>
                <h3>{variant.name}</h3>
                <p>{variant.description}</p>
                <details>
                  <summary>
                    Download logo <span aria-hidden="true">+</span>
                  </summary>
                  <div className="brand-format-links">
                    {["ink", "ivory", "coral"].map((color) => (
                      <div key={color}>
                        <span>{color}</span>
                        <a
                          href={`/brand/logos/measure-joy-${variant.file}-${color}.svg`}
                          download
                        >
                          SVG
                        </a>
                        <a
                          href={`/brand/logos/measure-joy-${variant.file}-${color}.png`}
                          download
                        >
                          PNG
                        </a>
                        {variant.file !== "icon" && (
                          <a
                            href={`/brand/logos/measure-joy-${variant.file}-${color}-editable.svg`}
                            download
                          >
                            Live text
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </article>
            ))}
          </div>
          <div className="brand-usage-note">
            <span>LET IT BREATHE.</span>
            <p>
              Keep a little space around the mark. Use the original proportions
              and colors. The SVGs are real vectors; live text versions and
              fonts are included for easy editing.
            </p>
            <a href="/brand/brand-guidelines.md" download>
              Read the guidelines ↗
            </a>
          </div>
        </section>

        <section
          className="brand-section"
          id="brand-colors"
          aria-labelledby="brand-colors-heading"
        >
          <div className="brand-section-heading">
            <p className="brand-eyebrow">02 / THE PALETTE</p>
            <h2 id="brand-colors-heading">
              Warm by nature.
              <br />
              <em>Bright by choice.</em>
            </h2>
            <p>
              Start with paper and ink. Add a little coral. Finish with a flash
              of something unexpected.
            </p>
          </div>
          <BrandPalette />
        </section>

        <section
          className="brand-section"
          id="brand-type"
          aria-labelledby="brand-type-heading"
        >
          <div className="brand-section-heading">
            <p className="brand-eyebrow">03 / THE TYPE</p>
            <h2 id="brand-type-heading">
              A voice with <em>feeling.</em>
            </h2>
            <p>
              One typeface for the everyday. One for the moments that deserve a
              little poetry.
            </p>
          </div>
          <div className="brand-type-grid">
            <article>
              <div className="brand-type-label">
                <span>SPACE GROTESK</span>
                <span>THE EVERYDAY</span>
              </div>
              <div className="brand-type-sans">
                Good times.
                <br />
                No retakes.
              </div>
              <div className="brand-type-alphabet">
                Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
                <br />
                Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                <br />
                0123456789 &amp; ! ? @ #
              </div>
              <p>
                Clear, characterful, and happy to take up space. Our go-to for
                headlines, navigation, and the details.
              </p>
              <a
                href="/brand/fonts/SpaceGrotesk-Variable.ttf"
                className="brand-text-link"
                download
              >
                Download Space Grotesk ↓
              </a>
            </article>
            <article>
              <div className="brand-type-label">
                <span>INSTRUMENT SERIF</span>
                <span>THE FEELING</span>
              </div>
              <div className="brand-type-serif">
                Life looks
                <br />
                good on you.
              </div>
              <div className="brand-type-alphabet brand-serif">
                Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm
                <br />
                Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                <br />
                0123456789 &amp; ! ? @ #
              </div>
              <p>
                A little softness. A little nostalgia. Use italic sparingly, in
                short phrases that make you feel something.
              </p>
              <a
                href="/brand/fonts/InstrumentSerif-Italic.ttf"
                className="brand-text-link"
                download
              >
                Download Instrument Serif ↓
              </a>
            </article>
          </div>
          <p className="brand-font-note">
            Both font families are open source under the SIL Open Font License.
            The complete kit includes font files and their licenses.
          </p>
        </section>

        <section
          className="brand-section"
          id="brand-social"
          aria-labelledby="brand-social-heading"
        >
          <div className="brand-section-heading">
            <p className="brand-eyebrow">04 / OUT IN THE WORLD</p>
            <h2 id="brand-social-heading">
              Ready for your <em>close-up.</em>
            </h2>
            <p>
              Avatars, share images, and a pair of easy-to-edit social
              templates. Good energy, wherever you show up.
            </p>
          </div>
          <div className="brand-social-grid">
            <article className="brand-social-avatar">
              <div className="brand-avatar-pair">
                <img
                  src="/brand/social/avatar-coral.png"
                  alt="Measure Joy coral social avatar"
                  width="1080"
                  height="1080"
                  loading="lazy"
                />
                <img
                  src="/brand/social/avatar-acid.png"
                  alt="Measure Joy acid yellow social avatar"
                  width="1080"
                  height="1080"
                  loading="lazy"
                />
              </div>
              <h3>Your new profile picture.</h3>
              <p>1080 × 1080 PX / CORAL + ACID</p>
              <div className="brand-social-links">
                <a href="/brand/social/avatar-coral.png" download>
                  Coral PNG ↓
                </a>
                <a href="/brand/social/avatar-acid.png" download>
                  Acid PNG ↓
                </a>
              </div>
            </article>
            <article>
              <div className="brand-template-stage">
                <img
                  src="/brand/templates/social-square.png"
                  alt="Editable square social template with Measure Joy headline and a coral photo placeholder"
                  width="1080"
                  height="1080"
                  loading="lazy"
                />
              </div>
              <h3>Make room for your moments.</h3>
              <p>1080 × 1080 PX / SQUARE TEMPLATE</p>
              <div className="brand-social-links">
                <a href="/brand/templates/social-square.svg" download>
                  Editable SVG ↓
                </a>
                <a href="/brand/templates/social-square.png" download>
                  PNG ↓
                </a>
              </div>
            </article>
            <article>
              <div className="brand-template-stage brand-story-stage">
                <img
                  src="/brand/templates/social-story.png"
                  alt="Editable vertical story template with Measure Joy typography and a photo placeholder"
                  width="1080"
                  height="1920"
                  loading="lazy"
                />
              </div>
              <h3>A story worth keeping.</h3>
              <p>1080 × 1920 PX / STORY TEMPLATE</p>
              <div className="brand-social-links">
                <a href="/brand/templates/social-story.svg" download>
                  Editable SVG ↓
                </a>
                <a href="/brand/templates/social-story.png" download>
                  PNG ↓
                </a>
              </div>
            </article>
          </div>
          <div className="brand-og">
            <img
              src="/brand/social/og-image.png"
              alt="Measure Joy share image: Little camera. Big feeling."
              width="1200"
              height="630"
              loading="lazy"
            />
            <div>
              <span className="brand-eyebrow">THE FIRST IMPRESSION</span>
              <h3>
                A little joy
                <br />
                in every link.
              </h3>
              <p>
                Our 1200 × 630 share image, ready for your website and link
                previews.
              </p>
              <a
                className="brand-text-link"
                href="/brand/social/og-image.png"
                download
              >
                Download share image ↓
              </a>
            </div>
          </div>
        </section>

        <section
          className="brand-section brand-downloads"
          id="brand-downloads"
          aria-labelledby="brand-download-heading"
        >
          <div className="brand-section-heading">
            <p className="brand-eyebrow">THE GOOD STUFF, ALL TOGETHER</p>
            <h2 id="brand-download-heading">
              Go make <em>some joy.</em>
            </h2>
            <p>
              Everything you need to carry the feeling forward. A complete kit,
              or just the piece you need.
            </p>
          </div>
          <div className="brand-download-list">
            {downloads.map((item) => (
              <div className="brand-download-row" key={item.number}>
                <span className="brand-download-number">{item.number}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="brand-download-actions">
                  {item.secondary && (
                    <a
                      href={item.secondary.href}
                      download
                      aria-label={`Download ${item.title}: ${item.secondary.label}`}
                    >
                      {item.secondary.label} ↓
                    </a>
                  )}
                  <a
                    href={item.href}
                    download
                    aria-label={`Download ${item.title}: ${item.format}`}
                  >
                    {item.format} ↓
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <footer className="brand-footer">
        <a href="/" aria-label="Back to Measure Joy shop">
          <img
            src="/brand/logos/measure-joy-horizontal-ivory.svg"
            alt="measure joy"
            width="220"
            height="48"
          />
        </a>
        <span>LITTLE CAMERA. BIG FEELING.</span>
        <a href="/">Back to the shop ↗</a>
      </footer>
    </main>
  );
}
