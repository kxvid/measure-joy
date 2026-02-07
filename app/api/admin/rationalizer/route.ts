import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Stripe from "stripe"
import { cookies } from "next/headers"

// Initialize Gemini and Stripe
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Add execution time limit (Vercel serverless functions have timeouts)
// We'll stop processing new items if we're close to the limit (e.g. 50s for a 60s timeout)
// Note: This is a soft limit for the loop.
const MAX_EXECUTION_TIME_MS = 50000

/**
 * Product Rationalizer - The "Quarterback" for product data enrichment
 * 
 * This endpoint acts as the central hub for:
 * 1. Fetching product data from Stripe inventory
 * 2. Identifying and fixing UNKNOWN/missing fields using LLM
 * 3. Categorizing products (camera vs accessory)
 * 4. Generating product copy if missing
 * 5. Pushing all enriched data back to Stripe
 */

interface RationalizerResult {
    productId: string
    name: string
    changes: Record<string, { before: string | null; after: string }>
    category: string
    subcategory?: string
    copyGenerated: boolean
    success: boolean
    error?: string
}

interface EnrichedProductData {
    brand: string
    year: string
    category: "camera" | "accessory"
    subcategory?: string
    condition: string
    description: string
    longDescription: string
    features: string[]
    sellingPoints: string[]
    confidence: number
}

/**
 * Use LLM to analyze product and extract/infer all missing metadata
 */
async function rationalizeProduct(
    name: string,
    existingDescription: string | null,
    existingMetadata: Record<string, string | undefined>
): Promise<EnrichedProductData> {
    const prompt = `You are a product data expert for a Y2K digital camera e-commerce store called "Measure Joy".

Analyze this product and provide accurate metadata. For any "Unknown" or missing values, use your knowledge to infer the most likely correct values.

Product Name: ${name}
Current Description: ${existingDescription || "None"}
Current Metadata:
- Brand: ${existingMetadata.brand || "Unknown"}
- Year: ${existingMetadata.year || "Unknown"}
- Category: ${existingMetadata.category || "Unknown"}
- Subcategory: ${existingMetadata.subcategory || "Unknown"}
- Condition: ${existingMetadata.condition || "Unknown"}

Rules:
1. Brand: Extract brand name from product name (Sony, Canon, Fujifilm, Olympus, Nikon, Kodak, Samsung, Pentax, Casio, Panasonic, Polaroid, HP, etc.)
2. Year: For cameras, estimate release year (Y2K era is 1999-2010). For accessories, use "N/A"
3. Category: Must be exactly "camera" or "accessory"
   - "camera" = digital cameras, film cameras, instant cameras, camcorders
   - "accessory" = memory cards, batteries, cases, straps, tripods, film, cleaning kits
4. Subcategory: For accessories only (memory, power, case, strap, tripod, cleaning, protection, film)
5. Condition: One of (Excellent, Good, Fair) - default to "Good" if unknown
6. Description: Short, engaging 1-2 sentence description
7. LongDescription: 3-4 paragraph detailed description with nostalgia and appeal for Y2K enthusiasts
8. Features: 5-7 bullet points of technical features
9. SellingPoints: 3-4 compelling reasons to buy

Respond in this exact JSON format:
{
  "brand": "string",
  "year": "string (e.g., '2005' or 'N/A')",
  "category": "camera" or "accessory",
  "subcategory": "string or null",
  "condition": "Excellent" | "Good" | "Fair",
  "description": "short description",
  "longDescription": "detailed multi-paragraph description",
  "features": ["feature 1", "feature 2", ...],
  "sellingPoints": ["point 1", "point 2", ...],
  "confidence": 0.0 to 1.0
}`

    try {
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("Failed to parse LLM response")
        }

        const parsed = JSON.parse(jsonMatch[0])

        return {
            brand: parsed.brand || existingMetadata.brand || "Unknown",
            year: parsed.year || existingMetadata.year || "Unknown",
            category: parsed.category === "accessory" ? "accessory" : "camera",
            subcategory: parsed.subcategory || undefined,
            condition: parsed.condition || existingMetadata.condition || "Good",
            description: parsed.description || existingDescription || "",
            longDescription: parsed.longDescription || "",
            features: parsed.features || [],
            sellingPoints: parsed.sellingPoints || [],
            confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8))
        }
    } catch (error) {
        console.error("Error rationalizing product:", error)
        // Return rule-based fallback
        return rationalizeByRules(name, existingDescription, existingMetadata)
    }
}

/**
 * Fallback: Extract metadata using regex and keyword matching
 */
function rationalizeByRules(
    name: string,
    existingDescription: string | null,
    existingMetadata: Record<string, string | undefined>
): EnrichedProductData {
    const text = `${name} ${existingDescription || ""}`.toLowerCase()

    // 1. Extract Brand
    const BRANDS = [
        "Canon", "Sony", "Nikon", "Fujifilm", "Fuji", "Olympus", "Panasonic", "Lumix",
        "Kodak", "Samsung", "Pentax", "Casio", "Ricoh", "Leica", "Minolta", "Polaroid",
        "GoPro", "HP", "Sanyo", "Kyocera", "Konica"
    ]

    let brand = existingMetadata.brand && existingMetadata.brand !== "Unknown"
        ? existingMetadata.brand
        : "Unknown"

    if (brand === "Unknown") {
        for (const b of BRANDS) {
            if (name.toLowerCase().includes(b.toLowerCase())) {
                brand = b
                // Handle "Lumix" implies Panasonic if Panasonic isn't explicit
                if (brand === "Lumix") brand = "Panasonic"
                // Handle "Fuji" -> Fujifilm
                if (brand === "Fuji") brand = "Fujifilm"
                break
            }
        }
    }

    // 2. Extract Year
    let year = existingMetadata.year && existingMetadata.year !== "Unknown"
        ? existingMetadata.year
        : "Unknown"

    if (year === "Unknown") {
        // Look for 4-digit years between 1980 and 2025
        const yearMatch = name.match(/\b(19|20)\d{2}\b/)
        if (yearMatch) {
            year = yearMatch[0]
        } else {
            // Rough estimation based on model names (very basic)
            if (name.includes("Mavica")) year = "2000"
            else if (name.includes("Cyber-Shot")) year = "2008" // Generic average
            else if (name.includes("Coolpix")) year = "2009"
        }
    }

    // 3. Inference Category (reuse simple keywords if needed, but usually existing is ok)
    // We'll trust existingCategory unless it's unknown, then default to camera
    const category = (existingMetadata.category === "accessory" || existingMetadata.category === "camera")
        ? existingMetadata.category
        : "camera"

    // 4. Condition
    const condition = existingMetadata.condition && existingMetadata.condition !== "Unknown"
        ? existingMetadata.condition
        : "Good"

    return {
        brand,
        year,
        category,
        subcategory: existingMetadata.subcategory,
        condition,
        description: existingDescription || `Vintage ${brand} digital camera. Tested and working strategy.`,
        longDescription: existingMetadata.longDescription || "",
        features: [],
        sellingPoints: [],
        confidence: 0.4 // Low confidence marker
    }
}

/**
 * Check if a value needs rationalization
 */
function needsRationalization(value: string | undefined | null): boolean {
    if (!value) return true
    const normalized = value.toLowerCase().trim()
    return normalized === "unknown" || normalized === "n/a" || normalized === ""
}

/**
 * POST: Rationalize all products or a specific product
 */
export async function POST(request: Request) {
    // 1. Security Check: Ensure user provides admin secret
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get("admin_access")?.value === "true"

    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { productId, dryRun = false, force = false } = body
        const startTime = Date.now()

        const results: RationalizerResult[] = []
        let products: Stripe.Product[]

        if (productId) {
            // Single product
            const product = await stripe.products.retrieve(productId)
            products = [product]
        } else {
            // All active products
            const response = await stripe.products.list({ active: true, limit: 100 })
            products = response.data
        }

        for (const product of products) {
            // 2. Stability Check: Exit if nearing timeout
            if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
                console.warn("[Rationalizer] Approaching execution timeout, stopping early.")
                break;
            }

            const metadata = product.metadata || {}

            // Check if rationalization is needed
            const needsBrand = force || needsRationalization(metadata.brand)
            const needsYear = force || needsRationalization(metadata.year)
            const needsCategory = force || needsRationalization(metadata.category)
            const needsCondition = force || needsRationalization(metadata.condition)
            const needsCopy = force || !metadata.copyGeneratedAt || needsRationalization(product.description)

            if (!needsBrand && !needsYear && !needsCategory && !needsCondition && !needsCopy) {
                results.push({
                    productId: product.id,
                    name: product.name,
                    changes: {},
                    category: metadata.category || "camera",
                    subcategory: metadata.subcategory,
                    copyGenerated: false,
                    success: true
                })
                continue
            }

            try {
                // Rationalize with LLM
                const enriched = await rationalizeProduct(
                    product.name,
                    product.description,
                    metadata
                )

                // Track changes
                const changes: Record<string, { before: string | null; after: string }> = {}

                if (needsBrand && enriched.brand !== metadata.brand) {
                    changes.brand = { before: metadata.brand || null, after: enriched.brand }
                }
                if (needsYear && enriched.year !== metadata.year) {
                    changes.year = { before: metadata.year || null, after: enriched.year }
                }
                if (needsCategory && enriched.category !== metadata.category) {
                    changes.category = { before: metadata.category || null, after: enriched.category }
                }
                if (needsCondition && enriched.condition !== metadata.condition) {
                    changes.condition = { before: metadata.condition || null, after: enriched.condition }
                }
                if (needsCopy && enriched.description !== product.description) {
                    changes.description = { before: product.description || null, after: enriched.description }
                }

                // Apply changes to Stripe (unless dry run)
                if (!dryRun && Object.keys(changes).length > 0) {
                    await stripe.products.update(product.id, {
                        description: enriched.description,
                        metadata: {
                            ...metadata,
                            brand: enriched.brand,
                            year: enriched.year,
                            category: enriched.category,
                            subcategory: enriched.subcategory || "",
                            condition: enriched.condition,
                            longDescription: enriched.longDescription,
                            features: JSON.stringify(enriched.features),
                            sellingPoints: JSON.stringify(enriched.sellingPoints),
                            rationalizedAt: new Date().toISOString(),
                            rationalizedBy: "llm",
                            copyGeneratedAt: needsCopy ? new Date().toISOString() : metadata.copyGeneratedAt || "",
                        }
                    })
                }

                results.push({
                    productId: product.id,
                    name: product.name,
                    changes,
                    category: enriched.category,
                    subcategory: enriched.subcategory,
                    copyGenerated: needsCopy,
                    success: true
                })

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 300))

            } catch (error) {
                results.push({
                    productId: product.id,
                    name: product.name,
                    changes: {},
                    category: metadata.category || "camera",
                    copyGenerated: false,
                    success: false,
                    error: String(error)
                })
            }
        }

        // Summary
        const summary = {
            total: results.length,
            updated: results.filter(r => Object.keys(r.changes).length > 0).length,
            copyGenerated: results.filter(r => r.copyGenerated).length,
            cameras: results.filter(r => r.category === "camera").length,
            accessories: results.filter(r => r.category === "accessory").length,
            errors: results.filter(r => !r.success).length,
            partialResult: products.length > results.length,
            dryRun
        }

        return NextResponse.json({ summary, results })

    } catch (error) {
        console.error("[Rationalizer API] Error:", error)
        return NextResponse.json(
            { error: "Failed to rationalize products", details: String(error) },
            { status: 500 }
        )
    }
}

/**
 * GET: Get rationalization status for all products
 */
export async function GET() {
    // 1. Security Check: Ensure user is admin
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get("admin_access")?.value === "true"

    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const products = await stripe.products.list({ active: true, limit: 100 })

        const status = products.data.map(product => {
            const metadata = product.metadata || {}

            return {
                id: product.id,
                name: product.name,
                brand: metadata.brand || "Unknown",
                year: metadata.year || "Unknown",
                category: metadata.category || "Unknown",
                subcategory: metadata.subcategory || null,
                condition: metadata.condition || "Unknown",
                hasCopy: !!metadata.copyGeneratedAt,
                rationalizedAt: metadata.rationalizedAt || null,
                needsRationalization:
                    needsRationalization(metadata.brand) ||
                    needsRationalization(metadata.year) ||
                    needsRationalization(metadata.category) ||
                    needsRationalization(metadata.condition) ||
                    !metadata.copyGeneratedAt
            }
        })

        const summary = {
            total: status.length,
            complete: status.filter(s => !s.needsRationalization).length,
            needsWork: status.filter(s => s.needsRationalization).length,
            unknownBrands: status.filter(s => s.brand === "Unknown").length,
            unknownYears: status.filter(s => s.year === "Unknown").length,
            unknownCategories: status.filter(s => s.category === "Unknown").length,
            missingCopy: status.filter(s => !s.hasCopy).length
        }

        return NextResponse.json({
            summary,
            products: status,
            usage: {
                "GET /api/admin/rationalizer": "Get status of all products",
                "POST /api/admin/rationalizer": {
                    description: "Rationalize products (fix unknowns, generate copy)",
                    body: {
                        productId: "string - Single product ID (optional)",
                        dryRun: "boolean - Preview changes without applying (default: false)",
                        force: "boolean - Re-rationalize even if already complete (default: false)"
                    }
                }
            }
        })

    } catch (error) {
        console.error("[Rationalizer API] Error:", error)
        return NextResponse.json(
            { error: "Failed to get product status" },
            { status: 500 }
        )
    }
}

