// Journal content lives here so both the listing page and the
// /journal/[slug] detail route render from a single source of truth.
// Paragraphs may contain simple markdown-style links: [label](/path).

export interface JournalSection {
    heading?: string
    paragraphs: string[]
}

export interface JournalPost {
    slug: string
    title: string
    excerpt: string
    category: string
    /** ISO date (YYYY-MM-DD) — formatted for display, used raw in JSON-LD. */
    date: string
    readTime: string
    image: string
    featured?: boolean
    content: JournalSection[]
}

/** "2025-12-10" -> "Dec 10, 2025" (UTC-safe, no timezone drift). */
export function formatPostDate(iso: string): string {
    const [year, month, day] = iso.split("-").map(Number)
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]
    return `${months[(month || 1) - 1]} ${day}, ${year}`
}

export function getJournalPost(slug: string): JournalPost | undefined {
    return JOURNAL_POSTS.find((post) => post.slug === slug)
}

export const JOURNAL_POSTS: JournalPost[] = [
    {
        slug: "why-y2k-cameras",
        title: "Why Y2K Cameras Are Making a Comeback",
        excerpt:
            "In an age of AI-enhanced smartphone photos, there's something refreshing about the raw, unfiltered aesthetic of early digital cameras.",
        date: "2025-12-10",
        category: "Culture",
        readTime: "5 min read",
        image: "/vintage-digital-camera-aesthetic-y2k.jpg",
        featured: true,
        content: [
            {
                paragraphs: [
                    "The short answer: Y2K digital cameras are back because they produce a look that modern phones can't — and won't. Early-2000s point-and-shoots used CCD sensors, simple JPEG processing, and hard on-camera flash, which together create saturated colors, soft edges, and a candid, slightly imperfect feel that reads as honest in a feed full of computationally polished images.",
                    "If you scrolled through Instagram or TikTok in the last couple of years, you've seen the aesthetic: direct flash, deep blacks, colors that pop a little too much, faces that look like they were photographed at a 2004 house party. That's not a filter. That's what a 5-megapixel Canon PowerShot or Sony Cyber-shot actually does, straight out of the camera.",
                ],
            },
            {
                heading: "The CCD look is real, not nostalgia",
                paragraphs: [
                    "Almost every compact camera made between roughly 1999 and 2008 used a CCD (charge-coupled device) sensor rather than the CMOS sensors in today's phones and cameras. CCDs of that era tended to render color with a distinctive punch — strong reds and blues, pleasant skin tones under flash — and they handled highlights in a way that gives photos a filmic glow. Combine that with early JPEG engines that applied modest sharpening and no noise-reduction smearing, and you get images with visible grain and texture instead of the plasticky smoothness of computational photography.",
                    "Resolution helps the look, too. Most of these cameras shoot 3 to 8 megapixels, which is plenty for social feeds and small prints but low enough that images stay soft and forgiving. Nothing about a Y2K photo screams effort — and that's exactly the appeal.",
                ],
            },
            {
                heading: "A camera that is only a camera",
                paragraphs: [
                    "There's a second reason the comeback has staying power: these cameras do one thing. No notifications, no editing suggestions, no cloud. You point, you shoot, and you don't see the photos again until you dump the memory card. That little delay — hours or days between shooting and seeing — turns out to be most of what people miss about film, at a fraction of film's cost per frame.",
                    "They're also genuinely pocketable. A Canon PowerShot SD-series ELPH or a Sony Cyber-shot T-series is smaller and lighter than any phone, with a real shutter button and, on many models, an optical viewfinder for bright days when the little LCD washes out.",
                ],
            },
            {
                heading: "What to know before you buy one",
                paragraphs: [
                    "The catch with 20-year-old electronics is that condition varies wildly. Batteries age, lens mechanisms jam, and memory card formats differ by brand — Sony used Memory Stick, Olympus and Fujifilm used xD-Picture Card, while Canon, Nikon, and most others settled on SD. A camera that powers on at a flea market can still have a scratched sensor or a dying LCD.",
                    "That's the problem we set out to solve at Measure Joy. Every camera we sell passes a 15-point inspection — lens, sensor, flash, screen, ports, card slot — and ships with a working battery and a 90-day warranty, so your first Y2K camera experience is taking pictures, not troubleshooting.",
                    "Whether you buy from us or rescue one from a relative's junk drawer, the comeback is worth joining. These little cameras capture something modern gear has optimized away: photos that look like memories instead of products. [Browse our tested cameras](/shop) if you want to start shooting this week.",
                ],
            },
        ],
    },
    {
        slug: "best-cameras-beginners",
        title: "The Best Y2K Cameras for Beginners",
        excerpt:
            "New to vintage digital photography? Here are our top picks for first-time collectors looking to capture that authentic early 2000s look.",
        date: "2025-12-05",
        category: "Guides",
        readTime: "6 min read",
        image: "/collection-of-vintage-cameras.jpg",
        content: [
            {
                paragraphs: [
                    "If you want one recommendation and nothing else: get a Canon PowerShot from the A series or SD (ELPH) series. They're plentiful, affordable, take standard SD cards, and produce the classic warm CCD look with almost no learning curve. If you want the full picture — including great picks from Sony, Nikon, Fujifilm, and Kodak — read on.",
                ],
            },
            {
                heading: "What makes a camera beginner-friendly",
                paragraphs: [
                    "Three practical things matter more than megapixels. First, the memory card: cameras that take SD cards (Canon, Nikon, Kodak, Panasonic, and others) are the easiest to live with, because 1–2GB SD cards and USB card readers are still cheap and everywhere. Sony's Memory Stick and the xD-Picture Card used by Olympus and Fujifilm work fine but cost more secondhand.",
                    "Second, the battery. Some cameras — notably the Canon PowerShot A series and many Kodak EasyShares — run on AA batteries, which you can buy at any corner store. Others use proprietary lithium-ion packs, which are slimmer but harder to replace if they've aged badly. Third, condition: on a 20-year-old camera, a clean lens, a bright LCD, and a healthy battery matter far more than a spec sheet.",
                ],
            },
            {
                heading: "Our beginner picks",
                paragraphs: [
                    "Canon PowerShot A series (A520, A540, and friends): the sensible starter. AA batteries, SD cards, a real optical viewfinder, and Canon's famously pleasant color science. The A-series bodies are chunkier than the fashion-forward compacts, but they're durable and often the cheapest way into the hobby.",
                    "Canon PowerShot SD series (Digital ELPH): the style pick. These little metal-bodied compacts — SD600, SD750, SD1000 — are what most people picture when they think 'Y2K digicam.' Pocketable, quick, and lovely under flash.",
                    "Sony Cyber-shot P and W series: the P series (like the DSC-P200) has that classic silver-brick charm, while W-series models add sharper Carl Zeiss-branded lenses and, on many models, an optical viewfinder. Just budget for a Memory Stick.",
                    "Nikon Coolpix S series: slim, sleek, and often overlooked, which keeps prices reasonable. Nikon's colors run a touch more neutral than Canon's — nice if you like editing lightly.",
                    "Fujifilm FinePix Z series: the cute one. The Z5fd in pink is a perennial favorite, with Fujifilm's flattering skin tones. Uses xD cards, so factor that in.",
                    "Kodak EasyShare: exactly what the name promises. Big buttons, simple menus, punchy consumer-friendly color. A great gift camera, and most models run on AAs.",
                    "Olympus compacts like the FE-280 round out the list — metallic colors, slim bodies, and honest image quality. Like Fujifilm, they use xD-Picture Cards, so grab a card and reader alongside the camera.",
                ],
            },
            {
                heading: "Buying advice",
                paragraphs: [
                    "Wherever you buy, test before you trust: power the camera on, zoom the lens through its full range and listen for grinding, fire the flash, take a photo and play it back, and check the LCD for dead pixels or bleed. Untested thrift-store finds are a gamble — sometimes a fun one, but a gamble.",
                    "If you'd rather skip the gamble, every camera at Measure Joy goes through a 15-point inspection and ships with a charged, working battery and a 90-day warranty. [Start with our shop](/shop), pick the body style that makes you smile, and go take some flash photos of your friends. That's genuinely all there is to it.",
                ],
            },
        ],
    },
    {
        slug: "care-guide",
        title: "How to Care for Your Vintage Camera",
        excerpt:
            "Keep your Y2K camera in top condition with these essential maintenance tips from our expert team.",
        date: "2025-11-28",
        category: "Tips",
        readTime: "5 min read",
        image: "/camera-maintenance-cleaning.jpg",
        content: [
            {
                paragraphs: [
                    "The essentials in one paragraph: take the batteries out when you're not using the camera, keep sand and liquids away from the lens barrel, store it somewhere dry, and clean it with a blower and microfiber cloth — never household glass cleaner. Do those four things and a well-made Y2K digicam will keep shooting for another decade. Here's the why and how behind each one.",
                ],
            },
            {
                heading: "Batteries: the number-one killer",
                paragraphs: [
                    "More vintage cameras die from battery leakage than from any other cause. If your camera takes AA cells, remove them whenever the camera will sit unused for more than a couple of weeks — alkaline AAs are notorious for leaking corrosive residue that destroys contacts. For regular use, NiMH rechargeables are safer, cheaper over time, and were the recommended choice even when these cameras were new.",
                    "Proprietary lithium-ion packs age differently: they lose capacity and can swell. Store them at partial charge rather than full or empty, and if a battery ever looks puffy, stop using it. Every camera we sell ships with a tested battery, but even good cells are consumables — treat a spare as part of the kit.",
                ],
            },
            {
                heading: "Protect the lens mechanism",
                paragraphs: [
                    "The telescoping lens barrel is the most delicate part of a compact camera. Never force a lens that's stuck, and never put a camera in a sandy bag or pocket — a single grain of sand in the barrel gears is the classic cause of the dreaded 'lens error.' Let the camera fully retract the lens before you stow it, and use a padded case or pouch rather than tossing it loose in a backpack.",
                ],
            },
            {
                heading: "Cleaning without damage",
                paragraphs: [
                    "For the body, a dry microfiber cloth handles fingerprints and dust. For the lens glass, use a hand blower first to remove grit, then a lens pen or a microfiber cloth with a drop of proper lens-cleaning fluid — never spray anything directly at the camera, and never use paper towels or alcohol wipes on coated glass. For the LCD, microfiber only; a stick-on screen protector is cheap insurance against pocket scratches.",
                    "Avoid liquids near seams, buttons, and the card door. These cameras predate weather sealing, and moisture that wicks inside can corrode the flash circuit, which carries a surprising amount of charge.",
                ],
            },
            {
                heading: "Storage, cards, and the clock battery",
                paragraphs: [
                    "Store your camera somewhere cool and dry — a shelf indoors is fine, a hot car or humid garage is not. A few silica gel packets in your camera drawer help in damp climates. Format memory cards in the camera (not on a computer) to keep the file system happy, and eject cards only when the camera is off.",
                    "One quirk of old digicams: many have a small internal cell that keeps the clock alive. If your camera forgets the date every time you change batteries, that cell has faded. It's harmless — your photos just get the wrong timestamp, which, depending on your feelings about the date-stamp aesthetic, may not be a problem at all.",
                    "If something does go wrong, don't force it or open the body yourself. Our cameras carry a 90-day warranty, and our [repair page](/repair) covers what we can help with beyond that.",
                ],
            },
        ],
    },
    {
        slug: "memory-cards-guide",
        title: "A Guide to Y2K Memory Cards",
        excerpt:
            "From Memory Stick to xD-Picture Cards—everything you need to know about storage options for your vintage camera.",
        date: "2025-11-20",
        category: "Guides",
        readTime: "6 min read",
        image: "/various-memory-cards-sd-card.jpg",
        content: [
            {
                paragraphs: [
                    "Quick answer: check your camera's brand. Canon, Nikon, Kodak, and Panasonic compacts almost all take SD cards (2GB or smaller for most pre-2007 models — not SDHC). Sony Cyber-shots take Memory Stick, usually Memory Stick PRO Duo with an adapter. Olympus and Fujifilm compacts take xD-Picture Cards. Get the right format and a USB card reader, and you're set.",
                ],
            },
            {
                heading: "SD: the format that won",
                paragraphs: [
                    "Secure Digital launched in 1999 and became the default for most of the industry. The crucial thing to know for Y2K cameras is the capacity ceiling: original SD tops out at 2GB, and cameras made before roughly 2006–2007 generally can't read SDHC cards at all — an SDHC card will simply show a card error. Stick to 1GB or 2GB cards for older models; at 5 megapixels, a 2GB card holds well over 800 photos, so you won't feel cramped.",
                    "Good news: 1–2GB SD cards are still manufactured and cheap, and they work in modern card readers. We stock tested ones in our [shop](/shop) alongside the cameras that use them.",
                ],
            },
            {
                heading: "Memory Stick: Sony's own path",
                paragraphs: [
                    "Sony introduced Memory Stick in 1998 and used it across Cyber-shot cameras, Handycams, and even the PSP. The original full-size stick maxes out at 128MB; Memory Stick PRO raised the ceiling, and the smaller Memory Stick PRO Duo (widely available up to 2–4GB and beyond) became the common form. Many full-size-slot cameras accept a Duo card in a simple sleeve adapter.",
                    "One caveat: older Cyber-shots that predate the PRO spec can't use PRO cards, so very early models are limited to the small original sticks. If you own a mid-2000s Cyber-shot, a PRO Duo plus adapter is the practical choice, and modern multi-card readers still read them.",
                ],
            },
            {
                heading: "xD-Picture Card: the Olympus and Fujifilm club",
                paragraphs: [
                    "The xD-Picture Card arrived in 2002 as a joint Olympus–Fujifilm format — tiny, capable, and used by almost nobody else. Cards came in the original type plus later Type M and Type H revisions; most cameras handle all of them, but a few early bodies are picky, so check your manual if a card acts up. Capacities run from 16MB to 2GB.",
                    "xD cards stopped being manufactured years ago, so they cost more per gigabyte secondhand than SD. They're not rare, just less common — budget an extra few dollars, and consider picking up two so you always have a spare.",
                ],
            },
            {
                heading: "CompactFlash and the rest",
                paragraphs: [
                    "CompactFlash, the chunky 1994-era format, shows up in earlier and higher-end cameras — early Canon PowerShots, prosumer Nikons, and most DSLRs of the era. It's robust and still easy to buy. You may also run into MMC (MultiMediaCard), a thinner card that works in most SD slots, and SmartMedia in late-'90s cameras, which is genuinely hard to source now.",
                ],
            },
            {
                heading: "Getting photos onto your phone or computer",
                paragraphs: [
                    "Skip the original USB cables and drivers — a modern multi-format card reader (USB-A or USB-C) reads SD, Memory Stick Duo, and often xD directly, and works with phones as well as laptops. Format cards in the camera rather than on your computer, and you'll avoid most file-system weirdness.",
                    "Every camera we sell is tested with its correct card format as part of our 15-point inspection, and we'll always tell you exactly which card your model needs — no guessing at checkout.",
                ],
            },
        ],
    },
    {
        slug: "photo-editing-tips",
        title: "Editing Tips for Y2K Photos",
        excerpt:
            "Learn how to enhance (without over-processing) your vintage camera shots while keeping their authentic charm.",
        date: "2025-11-15",
        category: "Tips",
        readTime: "4 min read",
        image: "/photo-editing-software-vintage.jpg",
        content: [
            {
                paragraphs: [
                    "The golden rule of editing Y2K photos: the camera already did the editing. That punchy CCD color, the flash falloff, the soft grain — that's the look you bought the camera for. Your job in post is small corrections, not transformation. A nudge of exposure, a slight crop, maybe a touch of contrast, and stop.",
                ],
            },
            {
                heading: "Work with JPEGs, gently",
                paragraphs: [
                    "Nearly every Y2K compact shoots JPEG only — there's no RAW file to rescue. JPEGs tolerate small adjustments well but fall apart under heavy ones: push shadows or saturation hard and you'll see banding and blocky artifacts. Keep exposure moves within about a stop, and if a photo needs more than that, it's usually better to embrace it as a moody frame than to fight the file.",
                    "Always edit a copy and keep the untouched original. These files are small; storage is not the constraint. Future-you may prefer the unedited version.",
                ],
            },
            {
                heading: "What to adjust — and what to leave alone",
                paragraphs: [
                    "Worth adjusting: horizon straightening, small crops, white balance when indoor lighting went very orange or green, and a gentle exposure lift for underexposed indoor shots. Most phone gallery apps handle all of this fine — you don't need pro software.",
                    "Leave alone: the noise, the softness, and the color. Noise-reduction sliders smear away the grain that makes these photos feel alive. Sharpening a 5-megapixel image just amplifies JPEG artifacts. And resist stacking a 'vintage' filter on top of a genuinely vintage photo — it reads as costume rather than character.",
                    "Be especially wary of AI enhancement tools. Upscalers and 'photo restorers' repaint detail that was never there, and the result loses exactly the honesty that makes Y2K photos appealing. If you want the image bigger, print it small instead — a 5MP file makes a lovely 4x6.",
                ],
            },
            {
                heading: "A simple two-minute workflow",
                paragraphs: [
                    "Here's the entire routine we use for our own photos. One: import everything from the card and back it up before touching anything. Two: pick your favorites first, before editing — choosing frames with fresh eyes matters more than any slider. Three: straighten and crop if needed. Four: nudge exposure so faces are readable, and correct white balance only if a color cast is genuinely distracting. Five: export and stop. If an edit takes more than thirty seconds, you're probably fighting the photo instead of finishing it.",
                    "For tools, anything works: the built-in editor on iOS or Android, Google Photos, or a free desktop app. These files are small enough that even an old laptop handles hundreds of them without complaint — one more way Y2K photography stays refreshingly low-stakes.",
                ],
            },
            {
                heading: "Little touches that honor the era",
                paragraphs: [
                    "If your camera stamps the date in orange digits, consider leaving it on — it's become part of the aesthetic, and you can't convincingly fake it later. When exporting for social media, export at the file's native resolution and let the platform do the scaling; pre-upscaling only softens things further.",
                    "Finally, remember that editing taste is downstream of shooting habits. Shoot with the flash on, get close, and take more frames than feels reasonable — the best 'edit' is having a better frame to choose. If you're still hunting for the right camera to practice with, our [shop](/shop) has tested models that produce this look straight out of the box.",
                ],
            },
        ],
    },
    {
        slug: "sony-cybershot-history",
        title: "The History of Sony Cybershot",
        excerpt:
            "A deep dive into one of the most iconic camera lines of the early digital era and why they remain beloved today.",
        date: "2025-11-08",
        category: "History",
        readTime: "6 min read",
        image: "/sony-cybershot-camera-history.jpg",
        content: [
            {
                paragraphs: [
                    "Sony's Cyber-shot line, launched in 1996 with the DSC-F1, is one of the longest-running names in digital photography — and the models from roughly 2000 to 2007 are the reason 'Y2K digicam' became an aesthetic. Sleek metal bodies, Carl Zeiss-branded lenses, and Sony's signature cool-toned CCD color made Cyber-shots the design icons of the era.",
                ],
            },
            {
                heading: "1996–1999: the experimental years",
                paragraphs: [
                    "The original DSC-F1 was a strange, wonderful object: a 0.3-megapixel camera with a lens that rotated 180 degrees, aimed at early internet users more than photographers. Sony iterated quickly, and in 1999 the DSC-F505 marked a turning point — a large Carl Zeiss Vario-Sonnar zoom bolted to a small body, signaling that Sony intended to compete on optics, not just electronics.",
                    "Equally important was 1998's introduction of the Memory Stick, Sony's proprietary storage format. It locked Cyber-shot owners into Sony's ecosystem — a mild annoyance then, a collecting quirk now — but it also meant your camera, camcorder, and later your PSP could share cards.",
                ],
            },
            {
                heading: "2000–2004: the P series and the pocket revolution",
                paragraphs: [
                    "The DSC-P1, released in 2000, was among the smallest 3-megapixel cameras in the world and defined the compact 'silver brick' shape the P series carried for years. Models like the DSC-P100 and DSC-P200 refined the formula: real Zeiss glass, fast startup, InfoLithium batteries that reported remaining minutes, and that unmistakable early-2000s industrial design.",
                    "Then came the T series. The 2003 DSC-T1 was genuinely radical — a slab barely thicker than a deck of cards, with a sliding front cover and a folded 'periscope' lens that zoomed internally, so nothing protruded when you shot. With its large LCD and jewelry-like build, the T series became the fashion camera of the mid-2000s, the one that appeared in music videos and handbags alike.",
                ],
            },
            {
                heading: "2005–2008: the W series sweet spot",
                paragraphs: [
                    "For photographers rather than fashionistas, the W series — starting with cameras like the DSC-W1 and running through the W5, W7, and beyond — is arguably the best of Y2K-era Sony. These compacts paired 5-to-8-megapixel CCDs with bright Zeiss lenses, manual exposure options, and, on many models, a small optical viewfinder, a feature already vanishing from compacts by then. They're durable, plentiful, and produce lovely files.",
                    "It's also the era when Sony's ergonomics matured: menus got faster, startup times dropped under two seconds, and the AA-powered entry models meant you could keep a W-series alive with corner-store batteries on a road trip. If someone asks us for 'the Cyber-shot to actually shoot with,' this is the series we point to.",
                ],
            },
            {
                heading: "Why they hold up",
                paragraphs: [
                    "Cyber-shots of this era have a particular rendering — slightly cooler and more neutral than Canon's warmth, with crisp micro-contrast from the Zeiss-branded optics. The build quality was real: solid metal shells that survive twenty years in a drawer surprisingly well. The main things to check on any used Cyber-shot are the battery (InfoLithium packs age, though replacements exist), the Memory Stick situation, and the LCD, which was ahead of its time and correspondingly precious.",
                    "We handle those checks for you — every Cyber-shot we sell passes our 15-point inspection and ships with a working battery, the correct Memory Stick guidance, and a 90-day warranty. If this history made you want one, [see what's in stock](/shop); the P and W series in particular tend not to sit around long.",
                ],
            },
        ],
    },
    {
        slug: "where-to-buy-y2k-cameras-los-angeles",
        title: "Where to Buy Y2K Digital Cameras in Los Angeles",
        excerpt:
            "The best places to find tested Y2K digicams in LA and the San Gabriel Valley — and what to check before you hand over cash anywhere else.",
        date: "2026-07-23",
        category: "Guides",
        readTime: "6 min read",
        image: "/vintage-camera-collection-aesthetic.jpg",
        content: [
            {
                paragraphs: [
                    "The direct answer: if you're in Los Angeles and want a Y2K digital camera that actually works, [Measure Joy](/los-angeles-y2k-digital-camera-store) is the specialist option. We're based in Covina in the San Gabriel Valley, serving San Dimas, Glendora, West Covina, and the greater LA area, and every camera we sell is tested against a 15-point inspection and backed by a 90-day warranty. Beyond us, LA's thrift stores, flea markets, and used camera counters can all turn up digicams — with very different odds of getting one that works.",
                ],
            },
            {
                heading: "Buying from a specialist vs. taking your chances",
                paragraphs: [
                    "A 20-year-old point-and-shoot is a small machine full of ways to quietly fail: aged batteries, jammed lens barrels, dead LCDs, corroded contacts, flash capacitors that no longer charge. None of these are visible from a display case, and most thrift finds are sold untested, without a battery or charger, as-is. That's fine if you enjoy the hunt and can absorb a few duds — genuinely, some people love that part — but it's a frustrating way to buy your first camera.",
                    "Our approach is the opposite of the gamble. Each camera in [our shop](/shop) is inspected point by point — lens travel, sensor, flash, screen, buttons, ports, card slot — cleaned, and shipped with a working battery so it takes photos the day it arrives. If anything goes wrong in the first 90 days, the warranty covers it. We're an online store, so everything ships quickly across LA County and beyond.",
                ],
            },
            {
                heading: "The thrift and flea market circuit",
                paragraphs: [
                    "If you do want to hunt, LA is one of the best cities in America for it. Goodwill and Salvation Army locations across the county cycle through donated electronics constantly, and the electronics bins occasionally hide a Canon PowerShot or Kodak EasyShare for a few dollars. The famous flea markets — the Rose Bowl Flea in Pasadena, the Melrose Trading Post, and the Long Beach Antique Market — usually have at least one table of old cameras, though sellers there increasingly know what Y2K digicams fetch online.",
                    "Estate sales in the San Gabriel Valley suburbs — Covina, Glendora, San Dimas, West Covina — are an underrated source, since these were exactly the households buying family digicams in 2004. Camera shops with used counters are worth a call too; their stock skews toward film and DSLRs, but compacts come through on trade-ins.",
                ],
            },
            {
                heading: "What to check before you buy anywhere",
                paragraphs: [
                    "Wherever you're standing, run this two-minute test. Power the camera on and watch the lens extend smoothly — grinding or a 'lens error' message is usually terminal on a compact. Zoom through the full range. Fire the flash. Take a photo and play it back, looking for lines, blotches, or dead pixels on the LCD. Check the battery door and contacts for the white crust of battery leakage. And confirm the memory card format: SD for Canon, Nikon, and Kodak; Memory Stick for Sony; xD for Olympus and Fujifilm — the card and a charger can add real cost if they're missing.",
                    "If a seller won't let you power a camera on, price it as broken, because it may well be.",
                ],
            },
            {
                heading: "Serving the San Gabriel Valley and greater LA",
                paragraphs: [
                    "Measure Joy grew out of exactly this local scene — rescuing cameras from the drawers and estate sales of the SGV and putting them back into hands that will use them. If you're in Covina, San Dimas, Glendora, West Covina, or anywhere in the Los Angeles area, our [LA store page](/los-angeles-y2k-digital-camera-store) has the local details, and the [shop](/shop) shows everything currently tested and ready. Either way you find your camera — from us or from a lucky bin dig — welcome to the club. LA looks great at 5 megapixels.",
                ],
            },
        ],
    },
    {
        slug: "canon-powershot-vs-sony-cyber-shot",
        title: "Canon PowerShot vs Sony Cyber-shot: Which Y2K Digicam Should You Buy?",
        excerpt:
            "The two definitive Y2K camera lines, compared honestly — color, handling, memory cards, batteries, and which one fits how you shoot.",
        date: "2026-07-23",
        category: "Guides",
        readTime: "7 min read",
        image: "/retro-canon-powershot-digital-camera-early-2000s.jpg",
        content: [
            {
                paragraphs: [
                    "The short version: choose a Canon PowerShot if you want warm, flattering color and the cheapest, easiest ownership experience — they take standard SD cards, and the A series even runs on AA batteries. Choose a Sony Cyber-shot if you're drawn to sleeker industrial design, Carl Zeiss-branded lenses, and a slightly cooler, crisper rendering — and you don't mind buying a Memory Stick. Neither choice is wrong; they're the Coke and Pepsi of the Y2K era, and both produce the look people are chasing.",
                ],
            },
            {
                heading: "The color question",
                paragraphs: [
                    "This is the real difference, and it's a matter of taste. Canon's CCD-era JPEG engine leans warm: golden skin tones, rich reds, a gentle glow under direct flash that flatters people. It's the classic 'house party 2005' look. Sony runs cooler and a bit more neutral, with punchy blues and strong micro-contrast from the Zeiss-branded glass — photos feel a touch more 'produced,' in a good way.",
                    "Both are unmistakably CCD images: 3 to 8 megapixels, visible grain, colors that pop without a filter. If you mostly photograph friends indoors with flash, Canon's warmth usually wins. If you shoot daylight, architecture, or want files that edit neutrally, Sony has the edge.",
                ],
            },
            {
                heading: "The Canon lineup: A series and SD (ELPH) series",
                paragraphs: [
                    "The PowerShot A series (A520, A540, A630 and so on) is the practical classic — chunkier bodies with real handgrips, optical viewfinders, and AA batteries you can buy anywhere on earth. Many offer aperture- and shutter-priority modes, which makes them quietly great learning cameras.",
                    "The SD series, sold as the Digital ELPH, is the style icon: little boxes of brushed metal — SD600, SD750, SD1000 — that slip into any pocket. They use compact proprietary lithium-ion batteries and, like nearly all Canons of the era, standard SD cards. Note the era's card limit: most pre-2007 models read SD only up to 2GB, not SDHC, so pair them with a 1–2GB card.",
                ],
            },
            {
                heading: "The Sony lineup: P, W, and T series",
                paragraphs: [
                    "The Cyber-shot P series (DSC-P100, P200) is the definitive silver Y2K brick — fast, solid, and beautifully made. The W series that followed is the enthusiast's pick: bright Zeiss lenses, manual exposure options, and on many models an optical viewfinder that Canon's ELPHs were already starting to drop.",
                    "The T series is Sony's flex: impossibly slim slabs like the DSC-T1 and T9 with a sliding front cover and an internal folded 'periscope' lens, so nothing extends when you shoot. Nothing Canon made looks like a T series. The trade-offs across all Sonys: Memory Stick (usually PRO Duo with an adapter) costs a bit more than SD secondhand, and Sony's InfoLithium batteries — clever in that they report remaining minutes — are proprietary, though replacements remain available.",
                ],
            },
            {
                heading: "Practical ownership, twenty years on",
                paragraphs: [
                    "Availability and price favor Canon: PowerShots were bestsellers and survive in huge numbers, and SD cards plus AA compatibility (on the A series) make them the lowest-friction vintage cameras you can own. Sony bodies tend to age gracefully thanks to their metal builds, but the ecosystem — Memory Stick, proprietary chargers — asks a little more of you up front.",
                    "Reliability is more about the individual camera than the brand at this point. Either can arrive from an online auction with a jammed lens or a tired battery. That's why every PowerShot and Cyber-shot we sell at Measure Joy passes a 15-point inspection and ships with a working battery, the correct card guidance, and a 90-day warranty — the brand rivalry is fun, but a tested camera beats an untested one every time.",
                ],
            },
            {
                heading: "The verdict",
                paragraphs: [
                    "Buy the Canon PowerShot if you want warmth, simplicity, and the easiest accessories. Buy the Sony Cyber-shot if design and optics are what pull you, or if the T series' sliding cover has already stolen your heart — you'll know if it has. And if you're still torn, go by feel: pick the one you'll actually carry, because the best Y2K camera is the one in your pocket at the party. Both lines are usually in stock in [our shop](/shop), tested and ready to shoot.",
                ],
            },
        ],
    },
]
