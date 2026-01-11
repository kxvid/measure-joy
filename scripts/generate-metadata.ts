/**
 * Enhanced Product Metadata Generator with Camera Year Database
 * 
 * Features:
 * - Camera release year database for accurate year detection
 * - Brand extraction from product names
 * - Category and subcategory detection
 * - Ready for LLM integration
 * 
 * Run with: npx tsx scripts/generate-metadata.ts
 */

import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Camera release year database - maps model patterns to release years
const CAMERA_YEARS: Record<string, string> = {
    // Polaroid
    "polaroid 600": "1999",
    "polaroid sx-70": "1972",
    "polaroid cool cam": "1999",

    // Olympus
    "olympus stylus": "2000",
    "olympus mju": "2000",
    "olympus infinity": "1995",

    // Canon PowerShot
    "powershot a470": "2008",
    "powershot a2200": "2011",
    "powershot sd600": "2006",
    "elph sd600": "2006",
    "ixus 60": "2006",
    "eos rebel t5": "2014",
    "eos 1200d": "2014",

    // Sony Cyber-shot
    "dsc-w80": "2007",
    "dsc-w530": "2011",
    "dsc-p200": "2005",
    "cybershot w80": "2007",
    "cybershot w530": "2011",

    // Sony Handycam
    "hdr-xr200": "2009",
    "ccd-trv68": "1998",
    "handycam hdr": "2009",
    "handycam ccd": "1998",

    // Nikon
    "coolpix s6800": "2014",
    "coolpix s": "2010",

    // Kodak
    "pixpro az252": "2015",
    "easyshare v610": "2006",

    // Samsung
    "tl205": "2009",
    "st550": "2009",

    // Fujifilm
    "finepix z5fd": "2006",
    "finepix f": "2007",

    // Panasonic
    "lumix dmc": "2006",

    // Pentax
    "optio s7": "2006",

    // Casio
    "exilim ex-z": "2006",
}

// Known camera brands for detection
const BRANDS = [
    "Canon", "Sony", "Nikon", "Olympus", "Fujifilm", "Fuji", "Polaroid",
    "Kodak", "Samsung", "Panasonic", "Pentax", "Casio", "HP", "Minolta",
    "Leica", "Ricoh", "GoPro"
]

// Category detection keywords
const CATEGORY_KEYWORDS = {
    camera: ["camera", "dsc-", "dslr", "powershot", "cybershot", "coolpix", "finepix", "elph", "ixus", "rebel", "pixpro"],
    camcorder: ["camcorder", "handycam", "video", "hi8"],
    film: ["film", "instant", "polaroid", "sx-70", "600"],
    accessory: ["strap", "case", "bag", "tripod", "battery", "charger", "memory", "sd card"]
}

interface GeneratedMetadata {
    brand?: string
    category?: "camera" | "accessory"
    subcategory?: string
    year?: string
    condition?: string
    longDescription?: string
    features?: string
    isTrending?: string
    isBestseller?: string
}

function extractBrand(name: string): string | undefined {
    const nameLower = name.toLowerCase()
    for (const brand of BRANDS) {
        if (nameLower.includes(brand.toLowerCase())) {
            return brand
        }
    }
    // Try first word as brand
    const firstWord = name.split(/\s+/)[0]
    if (firstWord && firstWord.length > 2 && /^[A-Z]/.test(firstWord)) {
        return firstWord
    }
    return undefined
}

function extractYear(name: string): string | undefined {
    const nameLower = name.toLowerCase()

    // Check against camera database
    for (const [pattern, year] of Object.entries(CAMERA_YEARS)) {
        if (nameLower.includes(pattern)) {
            return year
        }
    }

    // Try to extract year from name (e.g., "2005", "2006")
    const yearMatch = name.match(/\b(19\d{2}|20[0-2]\d)\b/)
    if (yearMatch) {
        return yearMatch[1]
    }

    // Estimate based on brand and type
    if (nameLower.includes("polaroid") && nameLower.includes("sx-70")) return "1972"
    if (nameLower.includes("polaroid") && nameLower.includes("600")) return "1999"
    if (nameLower.includes("dslr") || nameLower.includes("rebel")) return "2012"
    if (nameLower.includes("handycam") && nameLower.includes("hi8")) return "1998"

    return undefined
}

function extractCategory(name: string): { category: "camera" | "accessory", subcategory?: string } {
    const nameLower = name.toLowerCase()

    for (const keyword of CATEGORY_KEYWORDS.camcorder) {
        if (nameLower.includes(keyword)) {
            return { category: "camera", subcategory: "camcorder" }
        }
    }

    for (const keyword of CATEGORY_KEYWORDS.film) {
        if (nameLower.includes(keyword)) {
            return { category: "camera", subcategory: "film" }
        }
    }

    for (const keyword of CATEGORY_KEYWORDS.accessory) {
        if (nameLower.includes(keyword)) {
            return { category: "accessory" }
        }
    }

    // Default to camera
    return { category: "camera", subcategory: "digital" }
}

function extractCondition(name: string, description?: string): string {
    const text = `${name} ${description || ""}`.toLowerCase()

    if (/mint|like new/.test(text)) return "Like New"
    if (/excellent/.test(text)) return "Excellent"
    if (/very good/.test(text)) return "Very Good"
    if (/good/.test(text)) return "Good"
    if (/fair/.test(text)) return "Fair"

    return "Good" // Default
}

function generateDescription(name: string, brand?: string, year?: string): string {
    const cleanName = name.replace(/[.-]+$/, "").trim()

    if (name.toLowerCase().includes("polaroid")) {
        return `Vintage ${cleanName}. Capture instant memories with that iconic Polaroid aesthetic. Perfect for parties, events, and creating timeless keepsakes.`
    }

    if (name.toLowerCase().includes("camcorder") || name.toLowerCase().includes("handycam")) {
        return `${cleanName}. Capture your memories in motion with this classic video camera. Great for home movies and documenting special moments.`
    }

    const yearText = year ? `Released in ${year}, this` : "This"
    return `${yearText} ${brand || "vintage"} ${cleanName} is ready for your next adventure. Tested and working, perfect for Y2K photography enthusiasts.`
}

function generateFeatures(name: string, category: string): string {
    const features: string[] = []
    const nameLower = name.toLowerCase()

    if (nameLower.includes("digital")) features.push("Digital sensor for crisp photos")
    if (nameLower.includes("zoom")) features.push("Optical zoom lens")
    if (nameLower.includes("instant")) features.push("Instant photo development")
    if (nameLower.includes("film")) features.push("35mm film compatible")
    if (nameLower.includes("dslr")) features.push("Interchangeable lens system")
    if (nameLower.includes("lcd") || nameLower.includes("screen")) features.push("Built-in LCD screen")
    if (nameLower.includes("coolpix") || nameLower.includes("cybershot")) features.push("Compact and portable")
    if (nameLower.includes("handycam")) features.push("Video recording capability")

    // Add default features
    features.push("Tested and fully working")
    features.push("Cleaned and inspected")

    return JSON.stringify(features)
}

async function processProduct(product: Stripe.Product): Promise<boolean> {
    console.log(`\nProcessing: ${product.name}`)

    const brand = extractBrand(product.name)
    const year = extractYear(product.name)
    const { category, subcategory } = extractCategory(product.name)
    const condition = extractCondition(product.name, product.description || "")
    const longDescription = generateDescription(product.name, brand, year)
    const features = generateFeatures(product.name, category)

    const metadata: GeneratedMetadata = {
        brand: brand || "Vintage",
        category: category,
        subcategory: subcategory,
        year: year || "Classic", // Better than "Unknown"
        condition: condition,
        longDescription: longDescription,
        features: features,
        isTrending: "false",
        isBestseller: "false",
    }

    console.log(`  → Brand: ${metadata.brand}`)
    console.log(`  → Year: ${metadata.year}`)
    console.log(`  → Category: ${metadata.category}${subcategory ? ` (${subcategory})` : ""}`)
    console.log(`  → Condition: ${metadata.condition}`)

    // Update Stripe product
    try {
        await stripe.products.update(product.id, {
            metadata: metadata as Stripe.MetadataParam,
        })
        console.log("  ✓ Updated in Stripe")
        return true
    } catch (error) {
        console.error("  ✗ Error updating:", error)
        return false
    }
}

async function main() {
    console.log("=".repeat(60))
    console.log("Enhanced Product Metadata Generator")
    console.log("=".repeat(60))

    // Fetch all products
    const products = await stripe.products.list({ limit: 100, active: true })
    console.log(`\nFound ${products.data.length} active products\n`)

    let updated = 0
    let errors = 0

    for (const product of products.data) {
        const success = await processProduct(product)
        if (success) updated++
        else errors++
    }

    console.log("\n" + "=".repeat(60))
    console.log(`Done! Updated: ${updated}, Errors: ${errors}`)
    console.log("=".repeat(60))
}

main().catch(console.error)
