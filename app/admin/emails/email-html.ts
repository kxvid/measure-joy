import type {
    EmailBlock,
    HeadingBlock,
    TextBlock,
    ImageBlock,
    ButtonBlock,
    DividerBlock,
    HeroBlock,
    TwoColumnBlock,
    FeatureGridBlock,
    SpacerBlock,
} from "./email-blocks"

// ---------------------------------------------------------------------------
// Brand tokens for email (hex, email-safe)
// ---------------------------------------------------------------------------

const C = {
    foreground: "#262626",
    background: "#f9f9f7",
    white: "#ffffff",
    pink: "#ec4899",
    yellow: "#fef08a",
    orange: "#fb923c",
    teal: "#14b8a6",
    gray100: "#f5f5f5",
    gray200: "#e5e5e5",
    gray400: "#a3a3a3",
    gray600: "#525252",
    gray800: "#262626",
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

// ---------------------------------------------------------------------------
// HTML escape
// ---------------------------------------------------------------------------

export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function escapeUrl(url: string): string {
    // Only allow http(s), mailto, tel, and relative URLs
    const trimmed = url.trim()
    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("mailto:") ||
        trimmed.startsWith("tel:") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("#")
    ) {
        return escapeHtml(trimmed)
    }
    return "#"
}

// ---------------------------------------------------------------------------
// Block renderers
// ---------------------------------------------------------------------------

function renderHeading(b: HeadingBlock): string {
    const fontSize = b.level === 1 ? "32px" : b.level === 3 ? "18px" : "24px"
    const tag = `h${b.level}`
    return `<${tag} style="font-family:${FONT};font-size:${fontSize};font-weight:800;color:${C.foreground};margin:0 0 16px 0;line-height:1.2;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(b.content || " ")}</${tag}>`
}

function renderText(b: TextBlock): string {
    return `<p style="font-family:${FONT};font-size:16px;line-height:1.7;color:${C.gray600};margin:0 0 16px 0;">${escapeHtml(b.content || " ").replace(/\n/g, "<br>")}</p>`
}

function renderImage(b: ImageBlock): string {
    if (!b.src) {
        return `<div style="background:${C.gray100};border:1px dashed ${C.gray200};border-radius:8px;padding:48px;text-align:center;color:${C.gray400};font-family:${FONT};font-size:13px;margin:16px 0;">Image placeholder</div>`
    }
    return `<div style="text-align:center;margin:16px 0;">
  <img src="${escapeUrl(b.src)}" alt="${escapeHtml(b.alt || "")}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:0 auto;" />
</div>`
}

function renderButton(b: ButtonBlock): string {
    const bg =
        b.color === "pink"
            ? C.pink
            : b.color === "teal"
              ? C.teal
              : b.color === "orange"
                ? C.orange
                : C.foreground
    const textColor = C.white
    return `<div style="text-align:center;margin:24px 0;">
  <a href="${escapeUrl(b.url)}" style="display:inline-block;background:${bg};color:${textColor};padding:16px 40px;text-decoration:none;font-family:${FONT};font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:1.5px;border-radius:6px;">${escapeHtml(b.label || "Button")}</a>
</div>`
}

function renderDivider(_b: DividerBlock): string {
    return `<hr style="border:none;border-top:2px solid ${C.gray200};margin:32px 0;" />`
}

function renderSpacer(b: SpacerBlock): string {
    const h = Math.max(8, Math.min(120, b.height || 32))
    return `<div style="height:${h}px;line-height:${h}px;font-size:1px;">&nbsp;</div>`
}

function heroBackground(b: HeroBlock): string {
    if (b.backgroundImage && b.backgroundImage.trim()) {
        return `background:${C.foreground} url('${escapeUrl(b.backgroundImage)}') center center / cover no-repeat;`
    }
    switch (b.background) {
        case "pink":
            return `background:linear-gradient(135deg, ${C.pink} 0%, #be185d 100%);`
        case "teal":
            return `background:linear-gradient(135deg, ${C.teal} 0%, #0f766e 100%);`
        case "yellow":
            return `background:linear-gradient(135deg, ${C.yellow} 0%, #facc15 100%);`
        case "dark":
        default:
            return `background:linear-gradient(135deg, ${C.foreground} 0%, #0a0a0a 100%);`
    }
}

function renderHero(b: HeroBlock): string {
    const hasImage = b.backgroundImage && b.backgroundImage.trim()
    const background = heroBackground(b)
    const overlay = hasImage ? "background:rgba(0,0,0,0.45);" : ""
    const textColor = b.background === "yellow" ? C.foreground : C.white
    const subTextColor =
        b.background === "yellow" ? "rgba(38,38,38,0.75)" : "rgba(255,255,255,0.88)"

    return `<div style="${background}margin:0 0 8px 0;">
  <div style="${overlay}padding:72px 32px;text-align:center;">
    <h1 style="font-family:${FONT};color:${textColor};font-size:40px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px 0;line-height:1.1;">${escapeHtml(b.heading || " ")}</h1>
    ${b.subheading ? `<p style="font-family:${FONT};color:${subTextColor};font-size:16px;margin:0;letter-spacing:0.5px;">${escapeHtml(b.subheading)}</p>` : ""}
  </div>
</div>`
}

function renderTwoColumn(b: TwoColumnBlock): string {
    const imageCell = `<td width="50%" valign="top" style="padding:0 8px 0 0;">
      ${
          b.imageSrc
              ? `<img src="${escapeUrl(b.imageSrc)}" alt="${escapeHtml(b.imageAlt || "")}" style="width:100%;height:auto;border-radius:8px;display:block;" />`
              : `<div style="background:${C.gray100};border:1px dashed ${C.gray200};border-radius:8px;padding:48px 16px;text-align:center;color:${C.gray400};font-family:${FONT};font-size:12px;">Image</div>`
      }
    </td>`
    const textCell = `<td width="50%" valign="middle" style="padding:0 0 0 16px;">
      <h3 style="font-family:${FONT};font-size:18px;font-weight:800;color:${C.foreground};margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.5px;line-height:1.2;">${escapeHtml(b.heading || " ")}</h3>
      <p style="font-family:${FONT};font-size:14px;line-height:1.6;color:${C.gray600};margin:0;">${escapeHtml(b.text || " ").replace(/\n/g, "<br>")}</p>
    </td>`

    const cells = b.imagePosition === "right" ? textCell + imageCell : imageCell + textCell

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>${cells}</tr>
</table>`
}

function renderFeatureGrid(b: FeatureGridBlock): string {
    const cols = b.columns
    const items = b.items.length > 0 ? b.items : []
    if (items.length === 0) return ""

    const cellWidth = `${Math.floor(100 / cols)}%`
    const rows: string[] = []

    for (let i = 0; i < items.length; i += cols) {
        const rowItems = items.slice(i, i + cols)
        // Pad row with empty cells if underfilled
        while (rowItems.length < cols) rowItems.push({ icon: "", label: "", description: "" })

        const tds = rowItems
            .map(
                (item) => `<td width="${cellWidth}" valign="top" style="padding:16px 12px;text-align:center;">
      ${item.icon ? `<div style="font-size:28px;margin-bottom:8px;line-height:1;">${escapeHtml(item.icon)}</div>` : ""}
      ${item.label ? `<div style="font-family:${FONT};font-size:13px;font-weight:800;color:${C.foreground};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${escapeHtml(item.label)}</div>` : ""}
      ${item.description ? `<div style="font-family:${FONT};font-size:13px;color:${C.gray600};line-height:1.5;">${escapeHtml(item.description)}</div>` : ""}
    </td>`
            )
            .join("")
        rows.push(`<tr>${tds}</tr>`)
    }

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  ${rows.join("\n  ")}
</table>`
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

function renderBlock(block: EmailBlock): string {
    switch (block.type) {
        case "heading":
            return renderHeading(block)
        case "text":
            return renderText(block)
        case "image":
            return renderImage(block)
        case "button":
            return renderButton(block)
        case "divider":
            return renderDivider(block)
        case "hero":
            return renderHero(block)
        case "two_column":
            return renderTwoColumn(block)
        case "feature_grid":
            return renderFeatureGrid(block)
        case "spacer":
            return renderSpacer(block)
    }
}

export function blocksToHtml(blocks: EmailBlock[]): string {
    const year = new Date().getFullYear()
    const rendered = blocks.map(renderBlock).filter(Boolean).join("\n")

    // Separate hero blocks visually — they're full-bleed, so they should sit
    // outside the inner padded card. We detect hero blocks by wrapping the
    // entire output in one flow and letting the CSS handle it.
    // For simplicity, all blocks live inside the content card; hero just has
    // its own padding that bleeds to the card edges.

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Measure Joy</title>
</head>
<body style="margin:0;padding:0;background:${C.background};font-family:${FONT};-webkit-font-smoothing:antialiased;">
  <div style="background:${C.background};padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">
      <tr>
        <td>
          <!-- Brand header -->
          <div style="background:${C.foreground};padding:24px 32px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="font-family:${FONT};color:${C.white};font-size:22px;font-weight:900;margin:0;letter-spacing:5px;text-transform:uppercase;">Measure Joy</h1>
            <p style="font-family:${FONT};color:${C.gray400};font-size:11px;margin:4px 0 0 0;letter-spacing:2px;text-transform:uppercase;">Y2K Digital Cameras &amp; Retro Tech</p>
          </div>

          <!-- Content card -->
          <div style="background:${C.white};overflow:hidden;">
${rendered}
          </div>

          <!-- Pink accent bar -->
          <div style="background:${C.pink};height:6px;"></div>

          <!-- Footer -->
          <div style="background:${C.foreground};padding:32px;text-align:center;border-radius:0 0 12px 12px;">
            <p style="font-family:${FONT};color:${C.white};font-size:16px;font-weight:800;margin:0 0 8px 0;letter-spacing:3px;text-transform:uppercase;">Measure Joy</p>
            <p style="font-family:${FONT};color:${C.gray400};font-size:12px;margin:0 0 16px 0;">Curated Y2K tech with love.</p>
            <p style="font-family:${FONT};font-size:12px;margin:0 0 8px 0;">
              <a href="https://measurejoy.org/shop" style="color:${C.pink};text-decoration:none;margin:0 8px;">Shop</a>
              <span style="color:${C.gray600};">·</span>
              <a href="https://measurejoy.org/about" style="color:${C.pink};text-decoration:none;margin:0 8px;">About</a>
              <span style="color:${C.gray600};">·</span>
              <a href="https://measurejoy.org/faq" style="color:${C.pink};text-decoration:none;margin:0 8px;">FAQ</a>
            </p>
            <p style="font-family:${FONT};color:${C.gray600};font-size:11px;margin:16px 0 0 0;">
              &copy; ${year} Measure Joy. All rights reserved.<br>
              <a href="#" style="color:${C.gray600};text-decoration:underline;">Unsubscribe</a>
            </p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`
}
