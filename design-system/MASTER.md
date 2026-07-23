# Measure Joy — Design System (MASTER)

> **Source of truth** for the ground-up redesign.
> Direction: **Editorial Gallery with a Y2K Soul.**
> Status: proposed (review before implementation). Page-specific deviations live in `design-system/pages/*.md` and override this file.

---

## 1. Brand thesis

Measure Joy sells **considered purchases** — tested, restored vintage digital cameras at $60–$400. The experience should feel like a **curated gallery / specialist atelier**, not a noisy deal site. We lead with photography, breathe with whitespace, and spend personality deliberately: one accent color, a "spec-sheet" mono voice, and light Y2K nostalgia.

**One-line:** _A calm, premium editorial canvas with disciplined Y2K accents._

### Why this over the current build
The current site is "Vibrant & Block-based / Playful" (cream + six pop colors, hard offset shadows, marquees, all-caps everything). For a premium camera shop the design-intelligence database flags that exact style as the **anti-pattern**; the recommended register is a **gallery aesthetic** (near-black on warm white, generous whitespace). retrocamerashop.com — the reference — is editorial-minimal. This system moves us there while staying distinctly Measure Joy.

---

## 2. Principles (every decision obeys these)

1. **The product is the hero.** Photography first; UI recedes.
2. **Whitespace is a feature.** Generous, consistent negative space = perceived quality.
3. **One loud thing per view.** A single focal point: one accent, one primary CTA, one headline.
4. **Type carries the brand,** not decoration.
5. **Motion is physics, not confetti.** Slow, eased, purposeful, reduced-motion safe.
6. **Nostalgia as seasoning.** Y2K = mono spec captions, viewfinder framing, subtle grain — touches, not a costume.
7. **Accessible by construction.** AA contrast, 44px targets, visible focus, reduced-motion — encoded in tokens.

---

## 3. Color

Collapse the six "pop" colors to **one** accent. Warm-neutral canvas keeps a hint of the cream heritage so it reads gallery, not clinical. Accent should occupy **< 10% of any view's surface area**.

### Light (default)
| Token | Value (oklch) | Hex approx | Role |
|---|---|---|---|
| `--canvas` | `oklch(0.98 0.006 85)` | `#FAF9F6` | page background |
| `--surface` | `oklch(1 0 0)` | `#FFFFFF` | cards, image tiles, sheets |
| `--ink` | `oklch(0.18 0.01 60)` | `#16140F` | primary text, primary buttons |
| `--ink-muted` | `oklch(0.48 0.012 70)` | `#6B6557` | secondary text, captions |
| `--line` | `oklch(0.90 0.008 80)` | `#E7E3DA` | hairline borders/dividers |
| `--accent` | `oklch(0.60 0.20 28)` | `#E2483D` | **the one signal**: CTA, sale, focus ring |
| `--accent-soft` | `oklch(0.93 0.05 30)` | `#FBEAE7` | accent badge/wash backgrounds |
| `--success` | `oklch(0.55 0.13 160)` | `#2F8F6B` | in-stock / added confirmations |

### Dark
| Token | Value (oklch) | Hex approx |
|---|---|---|
| `--canvas` | `oklch(0.16 0.006 60)` | `#121110` |
| `--surface` | `oklch(0.20 0.006 60)` | `#1A1815` |
| `--ink` | `oklch(0.95 0.005 85)` | `#F5F2EC` |
| `--ink-muted` | `oklch(0.66 0.01 75)` | `#A8A192` |
| `--line` | `oklch(0.28 0.006 60)` | `#2E2A24` |
| `--accent` | `oklch(0.64 0.20 28)` | `#F05A4E` |

### Rules
- **Accent is sacred** — reserve for the single highest-intent action and genuine urgency (sale %, last-one). Never decorate with it.
- **Definition comes from `--line`**, not shadow. Borders > drop shadows.
- Retire `--pop-yellow/pink/orange/blue/green/teal` and the diagonal stripes. (Keep ONE as an optional editorial "marker" highlight if needed, e.g. behind a hand-picked word — but default to none.)
- All text/background pairs must clear **WCAG AA 4.5:1** (3:1 for ≥24px). `ink`/`canvas` ≈ 14:1; `ink-muted`/`canvas` ≈ 5:1. ✓

---

## 4. Typography

Three voices, sharp hierarchy.

| Voice | Font | Use |
|---|---|---|
| **Display** | `Playfair Display` (editorial) — or `Space Grotesk` for a more modern/tech lean | Page titles, hero, section headers. Big, tight. |
| **Body / UI** | `Inter` | Paragraphs, nav, buttons, forms. Neutral & legible. |
| **Instrument (mono)** | `Space Mono` | Specs, prices, captions, metadata, eyebrows — the "camera readout" voice. |

> Recommended pairing (DB, luxury/editorial e-commerce): **Playfair Display + Inter**, with **Space Mono** as the instrument accent. If the team prefers no serif, substitute **Space Grotesk** for display.

### Scale (fluid via `clamp`)
| Token | Size | Line-height | Weight | Voice |
|---|---|---|---|---|
| `display-1` | `clamp(2.75rem, 6vw, 6rem)` | 0.95 | 500–600 | Display |
| `display-2` | `clamp(2rem, 4vw, 3.25rem)` | 1.0 | 500 | Display |
| `h3` | `1.5rem` | 1.15 | 600 | Display/Body |
| `body-lg` | `1.125rem` | 1.6 | 400 | Body |
| `body` | `1rem` (16px min on mobile) | 1.6 | 400 | Body |
| `caption` | `0.8125rem` | 1.4 | 400–500, tracking +0.04em | Mono |
| `eyebrow` | `0.75rem` uppercase | 1.2 | 600, tracking +0.12em | Mono |

- Body line length capped **~68ch**.
- Uppercase only for eyebrows/labels, never body. (Drop the all-caps-everything habit.)

---

## 5. Spacing, grid, layout

- **Base unit 8px.** Steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160.
- **Section rhythm: 96–160px** vertical (vs current ~48–80px). Air = premium.
- **Grid:** 12-col, `max-w-[1280px]`, gutter 24px (mobile) / 32px (desktop).
- **Editorial asymmetry encouraged** — 5/7 or 4/8 splits, off-center heroes — instead of always-centered blocks.
- Consistent page padding: `px-6 lg:px-8`.

---

## 6. Shape, border, elevation

- **Radius:** `sm 6px`, `md 10px`, `lg 14px`, `full` (pills for tags only). One consistent family; no mixing.
- **Borders:** `1px solid var(--line)` is the primary separation device.
- **Elevation:** retire the hard offset shadow (`shadow-[6px_6px_0_0]`). Use a whisper, overlays only:
  - `shadow-sm`: `0 1px 2px rgb(0 0 0 / 0.05)`
  - `shadow-md`: `0 8px 24px rgb(0 0 0 / 0.08)` (drawers, modals, dropdowns)
- No glows, no neon, no gradient fills on badges.

---

## 7. Motion

Keep the existing primitives (`Reveal`, `Stagger`, `StaggerItem`, `TiltCard`) — **dial intensity down**.
- Durations **200–500ms**, easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- Allowed: scroll reveals (subtle), staggered grids, image angle-swap on hover, pointer-tilt on the hero only, smooth scroll (Lenis-style), page/route transitions.
- Remove/retire: marquee, pulse-glow, shimmer, infinite float. Decorative loops are off-brand here.
- **Always** honor `prefers-reduced-motion` (already wired) and never gate primary content behind `whileInView` on containers taller than the viewport (use mount-animate for grids).

---

## 8. Imagery (make-or-break — ~50% of the premium gap)

- **Uniform treatment:** every product on the same background, same framing, `object-contain`, generous padding so the full camera "floats." (Already started.)
- `next/image` everywhere, optimization ON (`remotePatterns` for `files.stripe.com`).
- Editorial touches (optional, subtle): film-grain overlay on hero/editorial blocks, viewfinder corner ticks, duotone-on-hover for non-product imagery.
- Alt text always; meaningful, not filename.

---

## 9. Components

### Navigation
Thin, quiet. Transparent over hero → solid with `1px` bottom `--line` on scroll. Real search prominent. Logo centered or left with generous air. Cart count uses `--ink` dot, not pink.

### Buttons (two only)
- **Primary:** solid `--ink` text `--canvas`, radius `md`, 44px+ height.
- **Secondary:** ghost with `1px --line`, hover fills `--surface`/subtle.
- **Accent button:** reserved for the single highest-intent action per page (Add to cart on PDP).
- All: `cursor-pointer`, visible focus ring (`--accent`), 150–250ms color transition, no scale-jump.

### Product card
Hairline (or borderless) tile, `--surface` bg, full-bleed **contain** image with padding, hover **angle-swap**. Below: brand·year eyebrow (mono), product name (body 500), price (mono). **One** small badge max (sale % or "Last one"), flat color, no gradient.

### Badges / tags
Flat, `accent-soft`/`--line` backgrounds, mono caption text, pill radius. Max one per card.

### PDP (product page)
Sticky gallery left (contain, thumbnail rail), scrolling detail right: name, price (mono), the **spec-sheet** (mono, manual-style rows), condition/warranty, accent Add-to-cart, then story + reviews, then a clean related rail.

### Forms / inputs
`--surface` fill, `1px --line`, radius `md`, label always visible, focus ring `--accent`, inline error in `--accent` near the field.

### Footer
Calm, generous, `--canvas` or `--ink` inverse. Hairline dividers, mono captions, no star-spam.

---

## 10. Information architecture

- **Home:** editorial hero → curated collections → "Why tested" proof → social proof → journal teaser.
- **Shop:** filter rail + gallery grid + quick-view (labeled filters: Brand / Year / Type / Sort).
- **PDP:** sticky gallery + spec-sheet (signature).
- **Cart / Checkout:** single column, calm, minimal.
- **Journal:** editorial content (brand depth + SEO).
- **About / Repair:** story pages.

---

## 11. Signature moments (memorable, not just clean)

1. **Hero:** one studio-lit camera, slow parallax + pointer tilt, mono spec caption ticking in.
2. **"Tested & working" ritual:** a visual proof section showing the inspection/restoration process — justifies the price.
3. **Spec-sheet PDP:** mono, manual-style readout. Distinctly Y2K-camera; nobody else does it.

---

## 12. Accessibility checklist (non-negotiable)
- [ ] Text contrast ≥ 4.5:1 (3:1 for ≥24px), both themes
- [ ] Visible focus ring on every interactive element
- [ ] Touch targets ≥ 44×44px
- [ ] Color never the sole signal
- [ ] `prefers-reduced-motion` respected
- [ ] Labels for all inputs; alt for all meaningful images
- [ ] Keyboard order matches visual order

---

## 13. Migration path (phased — not a rewrite from scratch)

The bones are reusable (Tailwind v4 tokens, `next/image`, motion system, server data). The redesign is mostly **tokens + 4 hero components**, shipped as reviewable PRs:

1. **Re-token** `app/globals.css` (color/type/space/radius/elevation) — instantly reskins the whole site.
2. **Fonts** — load Playfair Display + Inter (+ keep Space Mono); update `@theme` font vars.
3. **Hero components** — rebuild `header`, `product-card`, `hero`, PDP to this system.
4. **Re-skin** remaining sections (featured, categories, testimonials, newsletter, footer) to the new rhythm; retire pop colors / marquee / hard shadow / stripes.
5. **Motion polish** — dial down, add smooth scroll + page transitions.

### Token mapping (current → new)
| Current | New |
|---|---|
| `--background` cream | `--canvas` warm-white |
| `--accent` orange-red (decorative) | `--accent` retro-red (signal only, <10%) |
| `--pop-yellow/pink/orange/blue/green/teal` | **removed** (→ single `--accent` + neutrals) |
| `--pop-red` (badges) | `--accent` |
| hard offset shadow | `1px --line` border + whisper shadow |
| DM Sans / Space Mono | Inter (body) + Playfair Display (display) + Space Mono (instrument) |
| section pad ~48–80px | 96–160px rhythm |

---

_Last updated: 2026-06-15. Owner: design. Deviations: `design-system/pages/<page>.md`._
