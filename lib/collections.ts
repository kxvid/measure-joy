/**
 * Brand collection definitions for the server-rendered /collections/[slug]
 * landing pages. Each entry carries the crawlable editorial copy (intro) that
 * gives search engines real category content for brand queries.
 */

export interface CollectionDef {
    /** URL segment, e.g. "canon-powershot" -> /collections/canon-powershot */
    slug: string
    /** Display name, e.g. "Canon PowerShot" */
    name: string
    /**
     * Lowercase string matched against product.brand / product.name.
     * Empty string means "all cameras" (no brand filter).
     */
    brandQuery: string
    /** Hero image path from /public */
    heroImage: string
    /** One-sentence summary used for meta descriptions and cards */
    shortDescription: string
    /** 2-3 paragraphs of crawlable editorial copy, rendered server-side */
    intro: string[]
}

export const COLLECTIONS: CollectionDef[] = [
    {
        slug: "canon-powershot",
        name: "Canon PowerShot",
        brandQuery: "canon",
        heroImage: "/canon-powershot-a520-digital-camera-silver-compact.jpg",
        shortDescription:
            "Tested Canon PowerShot digital cameras from the Y2K era — Digital ELPH compacts and A-series classics with Canon's signature color.",
        intro: [
            "Canon's PowerShot line defined what a great point-and-shoot looked like in the early 2000s. The SD-series \"Digital ELPH\" cameras — sold as IXUS in Europe — squeezed real optics into sleek metal bodies small enough for a jeans pocket, and they became the default party camera of the era. Alongside them, the A series offered chunkier, AA-battery-powered bodies that were famously dependable and, on many models, gave curious shooters manual exposure controls that were rare at this price point.",
            "What keeps PowerShots loved two decades on is the way they render an image. Canon's color science of the period leans warm and flattering, with skin tones that need no editing, and the small CCD sensors behind those lenses produce the slightly soft, flash-lit look that defines the Y2K digicam aesthetic. Most models write to widely available SD cards, which makes them one of the easiest vintage lines to live with today.",
            "Every Canon PowerShot we sell at Measure Joy has passed our multi-point inspection — lens, LCD, flash, and card slot all verified — and ships with a battery and a 90-day warranty, so your camera works the day it arrives and long after.",
        ],
    },
    {
        slug: "sony-cyber-shot",
        name: "Sony Cyber-shot",
        brandQuery: "sony",
        heroImage: "/sony-cybershot-dsc-p200-silver-digital-camera-y2k.jpg",
        shortDescription:
            "Tested Sony Cyber-shot digital cameras — DSC-P, T, and W series compacts with Carl Zeiss optics and that unmistakable Y2K look.",
        intro: [
            "Sony's Cyber-shot cameras were the gadget-lover's digicams of the early 2000s. The DSC-P series established the template: compact silver bodies, bright LCDs, and Carl Zeiss-branded lenses that punched above their size. The ultra-slim T series pushed things further with a sliding lens cover and folded internal optics, making a camera thin enough to disappear into a shirt pocket, while the W series gave enthusiasts larger sensors and more control in a still-pocketable shell.",
            "Cyber-shots have a distinct personality: crisp, contrasty images with cooler color than their Canon rivals, and industrial design that still looks futuristic today. One quirk to know is storage — most Y2K-era Cyber-shots use Sony's proprietary Memory Stick or Memory Stick PRO Duo format rather than SD cards, so having a working card and reader matters more than usual. We stock tested Memory Sticks for exactly that reason.",
            "Each Cyber-shot in this collection has been cleaned and put through Measure Joy's full functional inspection, and ships with a charged battery and our 90-day warranty. Pick one up, slide the cover open, and shoot the way 2004 intended.",
        ],
    },
    {
        slug: "nikon-coolpix",
        name: "Nikon Coolpix",
        brandQuery: "nikon",
        heroImage: "/nikon-coolpix-s500-silver-digital-camera-sleek.jpg",
        shortDescription:
            "Tested Nikon Coolpix compacts from the mid-2000s — slim S-series cameras with Nikkor glass and clean, natural color.",
        intro: [
            "Nikon brought a century of optical pedigree to the point-and-shoot boom, and the Coolpix line was the result. By the mid-2000s the slim S series had become the face of the range: smooth, wave-inspired metal bodies barely thicker than a deck of cards, built around genuine Nikkor lenses. Models like the S500 packed vibration reduction and quick startup into cameras that felt more precise and grown-up than most rivals on the shelf.",
            "The Coolpix look is quietly confident rather than flashy — natural color, restrained contrast, and sharp detail from that Nikkor glass. It is a great match for people who want the Y2K digicam feel without heavy-handed processing, and because most S-series models take standard SD cards, memory is cheap and easy to find. Batteries charge in-camera or in a compact cradle depending on the model, and menus are among the simplest of the era.",
            "Before any Coolpix reaches this page it goes through Measure Joy's full inspection — sensor, zoom mechanism, screen, and flash all tested — and every camera ships with a battery and a 90-day warranty. It's the low-risk way to shoot a high-pedigree pocket camera from 2006.",
        ],
    },
    {
        slug: "fujifilm-finepix",
        name: "Fujifilm FinePix",
        brandQuery: "fujifilm",
        heroImage: "/fujifilm-finepix-z5fd-pink-digital-camera-cute-y2k.jpg",
        shortDescription:
            "Tested Fujifilm FinePix cameras — SuperCCD color, fashion-forward Z-series designs, and pure mid-2000s charm.",
        intro: [
            "Fujifilm approached the digicam era like the film company it was, and it shows in the images. Many FinePix models of the period used Fujifilm's own SuperCCD sensor, whose unusual diagonal pixel layout was designed to pull more light and dynamic range from a small chip — giving FinePix photos rich, film-like color and better high-ISO performance than most competitors could manage. The fashion-oriented Z series, like the pink Z5fd, added sliding lens covers, jewel-box styling, and early face detection aimed squarely at the social snapshooter.",
            "That combination makes FinePix cameras favorites for anyone chasing warm, nostalgic color straight out of camera. The main thing to know before buying is storage: Y2K-era FinePix models use the xD-Picture Card format that Fujifilm co-developed with Olympus, not SD. Cards are smaller in capacity and no longer made, which is why we test and include or stock xD cards alongside these cameras.",
            "Every FinePix here has passed Measure Joy's full multi-point inspection and ships with a battery and a 90-day warranty — so the only surprise is how good the colors look.",
        ],
    },
    {
        slug: "olympus-digicams",
        name: "Olympus",
        brandQuery: "olympus",
        heroImage: "/olympus-fe-280-digital-camera-blue-metallic-compac.jpg",
        shortDescription:
            "Tested Olympus digital cameras from the 2000s — colorful metallic compacts with bright optics and easy point-and-shoot handling.",
        intro: [
            "Olympus spent the 2000s making some of the most approachable cameras of the digicam boom. The Stylus line (sold as mju outside North America) carried over the weather-resistant, pocket-friendly philosophy of its famous film ancestors, while the FE series delivered simple, budget-friendly bodies in metallic blues and silvers that capture the Y2K look perfectly. Across the range, Olympus leaned on bright lenses and straightforward scene modes so anyone could pick one up and shoot.",
            "Images from these cameras have a punchy, saturated character that suits the era's aesthetic — vivid blues and bold contrast, with just enough CCD softness to feel nostalgic rather than clinical. Like Fujifilm, Olympus committed to the xD-Picture Card format it co-developed, so most models here take xD rather than SD cards. It is the one practical quirk of owning a Y2K Olympus, and we keep tested xD cards in stock so it never becomes a problem.",
            "Each Olympus we list has been through Measure Joy's full functional inspection — optics, screen, flash, and card slot verified — and ships with a battery and a 90-day warranty. Grab a metallic blue compact and see why these were everywhere in 2007.",
        ],
    },
    {
        slug: "y2k-digital-cameras",
        name: "Y2K Digital Cameras",
        brandQuery: "",
        heroImage: "/collection-of-vintage-cameras.jpg",
        shortDescription:
            "Every tested Y2K digital camera we carry — Canon, Sony, Nikon, Fujifilm, Olympus and more, all inspected and warrantied.",
        intro: [
            "Between roughly 2000 and 2008, compact digital cameras had their golden age. Film was fading, smartphones hadn't arrived, and every electronics maker poured its best engineering into pocket cameras: Canon's Digital ELPHs, Sony's Carl Zeiss-equipped Cyber-shots, Nikon's slim Coolpix S series, Fujifilm's SuperCCD FinePix line, and Olympus's colorful metallic compacts. Megapixel counts climbed, bodies shrank, and the results filled a billion early social media feeds.",
            "The look those cameras produced is exactly why they're back. Small CCD sensors, on-camera flash, and period color processing create images that feel warm, direct, and unmistakably of their moment — a texture that phone cameras, for all their sharpness, can't fake. Shooting one also changes how you photograph: no endless retakes, no filters, just point, shoot, and see what you got.",
            "This collection gathers every camera in the Measure Joy shop across all brands. Each one is cleaned, put through our multi-point functional inspection, and shipped with a battery and a 90-day warranty, so a twenty-year-old camera arrives working like it should. Browse the full lineup below, or jump into a brand collection to narrow things down.",
        ],
    },
]

export function getCollection(slug: string): CollectionDef | undefined {
    return COLLECTIONS.find((c) => c.slug === slug)
}
