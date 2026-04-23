import {
    Type,
    Heading as HeadingIcon,
    Image as ImageIcon,
    Link2,
    Minus,
    Frame,
    Columns2,
    LayoutGrid,
    ShoppingBag,
    MoveVertical,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// Block type definitions
// ---------------------------------------------------------------------------

export interface HeadingBlock {
    type: "heading"
    id: string
    content: string
    level: 1 | 2 | 3
}

export interface TextBlock {
    type: "text"
    id: string
    content: string
}

export interface ImageBlock {
    type: "image"
    id: string
    src: string
    alt: string
}

export interface ButtonBlock {
    type: "button"
    id: string
    label: string
    url: string
    color: "dark" | "pink" | "teal" | "orange"
}

export interface DividerBlock {
    type: "divider"
    id: string
}

export interface HeroBlock {
    type: "hero"
    id: string
    heading: string
    subheading: string
    backgroundImage: string
    background: "dark" | "pink" | "teal" | "yellow"
}

export interface TwoColumnBlock {
    type: "two_column"
    id: string
    imagePosition: "left" | "right"
    imageSrc: string
    imageAlt: string
    heading: string
    text: string
}

export interface FeatureGridItem {
    icon: string // emoji or short symbol
    label: string
    description: string
}

export interface FeatureGridBlock {
    type: "feature_grid"
    id: string
    columns: 2 | 3
    items: FeatureGridItem[]
}

export interface SpacerBlock {
    type: "spacer"
    id: string
    height: number
}

export type EmailBlock =
    | HeadingBlock
    | TextBlock
    | ImageBlock
    | ButtonBlock
    | DividerBlock
    | HeroBlock
    | TwoColumnBlock
    | FeatureGridBlock
    | SpacerBlock

export type BlockType = EmailBlock["type"]

// ---------------------------------------------------------------------------
// Block metadata (for pickers and editor UI)
// ---------------------------------------------------------------------------

export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
    heading: HeadingIcon,
    text: Type,
    image: ImageIcon,
    button: Link2,
    divider: Minus,
    hero: Frame,
    two_column: Columns2,
    feature_grid: LayoutGrid,
    spacer: MoveVertical,
}

export const BLOCK_LABELS: Record<BlockType, string> = {
    heading: "Heading",
    text: "Paragraph",
    image: "Image",
    button: "Button",
    divider: "Divider",
    hero: "Hero Banner",
    two_column: "Two Column",
    feature_grid: "Feature Grid",
    spacer: "Spacer",
}

export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
    heading: "Bold section title",
    text: "A paragraph of body text",
    image: "A single image",
    button: "Call-to-action button",
    divider: "Horizontal line separator",
    hero: "Full-width banner with overlaid text",
    two_column: "Image on one side, text on the other",
    feature_grid: "Grid of icons with labels (2–3 columns)",
    spacer: "Vertical empty space",
}

// Group block types for the block picker UI
export const BLOCK_GROUPS: Array<{ label: string; types: BlockType[] }> = [
    { label: "Content", types: ["heading", "text", "image", "button"] },
    { label: "Layout", types: ["hero", "two_column", "feature_grid", "divider", "spacer"] },
]

// ---------------------------------------------------------------------------
// Block factory
// ---------------------------------------------------------------------------

let blockCounter = 0
export function newId(): string {
    return `blk_${++blockCounter}_${Date.now()}`
}

export function createDefaultBlock(type: BlockType): EmailBlock {
    const id = newId()
    switch (type) {
        case "heading":
            return { type, id, content: "", level: 2 }
        case "text":
            return { type, id, content: "" }
        case "image":
            return { type, id, src: "", alt: "" }
        case "button":
            return {
                type,
                id,
                label: "Shop Now",
                url: "https://measurejoy.org/shop",
                color: "pink",
            }
        case "divider":
            return { type, id }
        case "hero":
            return {
                type,
                id,
                heading: "Fresh Drop",
                subheading: "Just landed in the shop",
                backgroundImage: "",
                background: "dark",
            }
        case "two_column":
            return {
                type,
                id,
                imagePosition: "left",
                imageSrc: "",
                imageAlt: "",
                heading: "Feature heading",
                text: "A short paragraph describing this feature.",
            }
        case "feature_grid":
            return {
                type,
                id,
                columns: 3,
                items: [
                    { icon: "✨", label: "Tested", description: "Every camera verified working" },
                    { icon: "📦", label: "Free shipping", description: "On orders over $50" },
                    { icon: "🛡️", label: "90-day warranty", description: "If it breaks, we fix it" },
                ],
            }
        case "spacer":
            return { type, id, height: 32 }
    }
}

// ---------------------------------------------------------------------------
// Templates — rich, branded, production-ready
// ---------------------------------------------------------------------------

export interface EmailTemplate {
    name: string
    thumbnail: string // short visual identifier (emoji/symbol)
    description: string
    accent: string // tailwind bg class for preview card
    subject: string
    blocks: EmailBlock[]
}

function mkBlocks(items: Array<Omit<EmailBlock, "id"> & { _k?: string }>): EmailBlock[] {
    return items.map((item) => ({ ...item, id: newId() }) as EmailBlock)
}

export const TEMPLATES: EmailTemplate[] = [
    {
        name: "New Drop",
        thumbnail: "📷",
        description: "Announce a new camera or product drop with hero imagery",
        accent: "bg-gradient-to-br from-pink-500 to-rose-600",
        subject: "Fresh Drop: Just Landed",
        blocks: mkBlocks([
            {
                type: "hero",
                heading: "Fresh Drop",
                subheading: "Just landed in the shop",
                backgroundImage: "",
                background: "dark",
            },
            { type: "spacer", height: 24 },
            {
                type: "heading",
                content: "You're gonna want this one",
                level: 2,
            },
            {
                type: "text",
                content:
                    "We just unboxed something special. Fully tested, cleaned, and ready to shoot. These rare finds don't stick around — grab it before someone else does.",
            },
            { type: "image", src: "", alt: "Product image" },
            {
                type: "text",
                content:
                    "Add a paragraph about what makes this camera special — era, aesthetic, who it's for.",
            },
            {
                type: "button",
                label: "Shop the Drop",
                url: "https://measurejoy.org/shop",
                color: "pink",
            },
        ]),
    },
    {
        name: "Sale / Promo",
        thumbnail: "🔥",
        description: "Limited-time sale with urgency and a feature grid",
        accent: "bg-gradient-to-br from-orange-500 to-red-600",
        subject: "Flash Sale — 48 Hours Only",
        blocks: mkBlocks([
            {
                type: "hero",
                heading: "Sale Is Live",
                subheading: "Up to 30% off — 48 hours only",
                backgroundImage: "",
                background: "pink",
            },
            { type: "spacer", height: 24 },
            {
                type: "text",
                content:
                    "Picked some of our favorites and knocked the prices down. Once they're gone, they're gone — we don't do restocks on sale items.",
            },
            {
                type: "feature_grid",
                columns: 3,
                items: [
                    { icon: "⚡", label: "30% Off", description: "Select cameras" },
                    { icon: "🚚", label: "Free Shipping", description: "On sale items" },
                    { icon: "⏰", label: "48 Hours", description: "Ends Sunday 11:59 PT" },
                ],
            },
            { type: "divider" },
            {
                type: "button",
                label: "Shop the Sale",
                url: "https://measurejoy.org/shop",
                color: "pink",
            },
            { type: "spacer", height: 16 },
            {
                type: "text",
                content:
                    "Discount applied automatically at checkout. Final sale — no returns on discounted items.",
            },
        ]),
    },
    {
        name: "Newsletter",
        thumbnail: "📰",
        description: "Editorial-style monthly update with spotlights and news",
        accent: "bg-gradient-to-br from-neutral-700 to-neutral-900",
        subject: "The Measure Joy Edit — This Month",
        blocks: mkBlocks([
            {
                type: "hero",
                heading: "The Edit",
                subheading: "What's new at Measure Joy",
                backgroundImage: "",
                background: "dark",
            },
            { type: "spacer", height: 24 },
            {
                type: "text",
                content:
                    "Hey — quick roundup of what we've been up to this month. New arrivals, a few behind-the-scenes notes, and some picks we think you'll love.",
            },
            {
                type: "heading",
                content: "Featured this month",
                level: 2,
            },
            {
                type: "two_column",
                imagePosition: "left",
                imageSrc: "",
                imageAlt: "Featured product",
                heading: "Our pick",
                text: "A short writeup about why we're obsessed with this piece right now.",
            },
            { type: "divider" },
            {
                type: "heading",
                content: "What's new",
                level: 2,
            },
            {
                type: "feature_grid",
                columns: 2,
                items: [
                    { icon: "📷", label: "10+ new arrivals", description: "Y2K rarities added this week" },
                    { icon: "🎞️", label: "Film dev service", description: "Back in stock and faster than ever" },
                ],
            },
            {
                type: "button",
                label: "Explore the Shop",
                url: "https://measurejoy.org/shop",
                color: "dark",
            },
            { type: "divider" },
            {
                type: "text",
                content:
                    "Thanks for sticking around. Hit reply if you've got questions — we read every message.",
            },
        ]),
    },
    {
        name: "Product Spotlight",
        thumbnail: "✨",
        description: "Deep-dive on a single product with specs and lifestyle shots",
        accent: "bg-gradient-to-br from-amber-400 to-orange-600",
        subject: "Camera of the Week",
        blocks: mkBlocks([
            {
                type: "hero",
                heading: "Camera of the Week",
                subheading: "A closer look",
                backgroundImage: "",
                background: "dark",
            },
            { type: "spacer", height: 24 },
            { type: "image", src: "", alt: "Product hero shot" },
            {
                type: "heading",
                content: "Why we love it",
                level: 2,
            },
            {
                type: "text",
                content:
                    "A few sentences about the story of this camera — the era, the aesthetic, the quirks that make it special.",
            },
            {
                type: "feature_grid",
                columns: 2,
                items: [
                    { icon: "📸", label: "Megapixels", description: "2.0MP CCD sensor" },
                    { icon: "🔍", label: "Zoom", description: "3x optical" },
                    { icon: "🖥️", label: "Display", description: "1.8\" TFT LCD" },
                    { icon: "💾", label: "Storage", description: "SD/MMC card" },
                ],
            },
            {
                type: "button",
                label: "View Product",
                url: "https://measurejoy.org/shop",
                color: "pink",
            },
        ]),
    },
    {
        name: "Welcome",
        thumbnail: "👋",
        description: "Warm welcome for new subscribers with brand story",
        accent: "bg-gradient-to-br from-teal-500 to-cyan-600",
        subject: "Welcome to Measure Joy",
        blocks: mkBlocks([
            {
                type: "hero",
                heading: "Welcome to the Joy",
                subheading: "You're one of us now",
                backgroundImage: "",
                background: "teal",
            },
            { type: "spacer", height: 24 },
            {
                type: "text",
                content:
                    "Hey — really glad you're here. Measure Joy is where we rescue, restore, and resell Y2K digital cameras to people who love the weird, wonderful aesthetic they produce.",
            },
            {
                type: "heading",
                content: "What to expect",
                level: 2,
            },
            {
                type: "feature_grid",
                columns: 3,
                items: [
                    { icon: "📷", label: "Curated finds", description: "Rare drops almost daily" },
                    { icon: "✅", label: "Tested & cleaned", description: "Every camera verified working" },
                    { icon: "🛡️", label: "90-day warranty", description: "If it breaks, we fix it" },
                ],
            },
            { type: "divider" },
            {
                type: "text",
                content:
                    "We'll send you first dibs on new drops, occasional deals, and the occasional Y2K photography tip. No spam, promise.",
            },
            {
                type: "button",
                label: "Start Exploring",
                url: "https://measurejoy.org/shop",
                color: "pink",
            },
        ]),
    },
    {
        name: "Back in Stock",
        thumbnail: "🔔",
        description: "Alert subscribers that a popular item is back",
        accent: "bg-gradient-to-br from-emerald-500 to-teal-600",
        subject: "Back in Stock",
        blocks: mkBlocks([
            {
                type: "hero",
                heading: "Back in Stock",
                subheading: "You asked, we listened",
                backgroundImage: "",
                background: "teal",
            },
            { type: "spacer", height: 24 },
            {
                type: "text",
                content:
                    "The wait is over. One of our most-requested cameras is back on the shelf — but we only have a handful of them, so move fast.",
            },
            { type: "image", src: "", alt: "Product image" },
            {
                type: "text",
                content:
                    "A quick note about this piece, its condition, and why people were asking about it.",
            },
            {
                type: "button",
                label: "Grab It Now",
                url: "https://measurejoy.org/shop",
                color: "pink",
            },
        ]),
    },
]
