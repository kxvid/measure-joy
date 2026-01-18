import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Stripe from "stripe"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

interface CategorizeRequest {
    productId?: string
    name: string
    description: string
}

interface CategorizeResponse {
    category: "camera" | "accessory"
    subcategory?: string
    confidence: number
    reasoning: string
    method?: "llm" | "rules"
}

// Rule-based categorization keywords
const ACCESSORY_KEYWORDS: Record<string, { keywords: string[], subcategory: string }> = {
    memory: {
        keywords: ["sd card", "memory card", "cf card", "xd card", "memory stick", "storage", "1gb", "2gb", "4gb", "8gb", "16gb", "32gb", "64gb", "128gb"],
        subcategory: "memory"
    },
    film: {
        keywords: ["film", "instant film", "polaroid film", "fuji film", "exposure pack", "film pack", "35mm film", "120 film"],
        subcategory: "film"
    },
    power: {
        keywords: ["battery", "charger", "power adapter", "ac adapter", "power supply", "rechargeable"],
        subcategory: "power"
    },
    case: {
        keywords: ["case", "bag", "pouch", "sleeve", "carrying case", "camera bag"],
        subcategory: "case"
    },
    strap: {
        keywords: ["strap", "wrist strap", "neck strap", "hand strap", "lanyard"],
        subcategory: "strap"
    },
    tripod: {
        keywords: ["tripod", "monopod", "gorilla pod", "selfie stick", "stand"],
        subcategory: "tripod"
    },
    cleaning: {
        keywords: ["cleaning kit", "lens cleaner", "cleaning cloth", "microfiber", "blower"],
        subcategory: "cleaning"
    },
    protection: {
        keywords: ["lens cap", "screen protector", "filter", "uv filter", "lens hood"],
        subcategory: "protection"
    },
    cable: {
        keywords: ["cable", "usb cable", "av cable", "hdmi", "adapter", "dongle"],
        subcategory: "cable"
    }
}

const CAMERA_KEYWORDS = [
    "camera", "dslr", "mirrorless", "camcorder", "handycam", "cyber-shot", "cybershot",
    "powershot", "coolpix", "lumix", "eos", "digital camera", "instant camera",
    "point and shoot", "point-and-shoot", "gopro", "action camera"
]

/**
 * Rule-based categorization using keyword matching
 */
function categorizeByRules(name: string, description: string): CategorizeResponse {
    const searchText = `${name} ${description}`.toLowerCase()

    // Check for accessory keywords first (they're more specific)
    for (const [, config] of Object.entries(ACCESSORY_KEYWORDS)) {
        for (const keyword of config.keywords) {
            if (searchText.includes(keyword)) {
                return {
                    category: "accessory",
                    subcategory: config.subcategory,
                    confidence: 0.85,
                    reasoning: `Matched accessory keyword: "${keyword}"`,
                    method: "rules"
                }
            }
        }
    }

    // Check for camera keywords
    for (const keyword of CAMERA_KEYWORDS) {
        if (searchText.includes(keyword)) {
            return {
                category: "camera",
                confidence: 0.9,
                reasoning: `Matched camera keyword: "${keyword}"`,
                method: "rules"
            }
        }
    }

    // Default to camera if no keywords match
    return {
        category: "camera",
        confidence: 0.5,
        reasoning: "No matching keywords found, defaulting to camera",
        method: "rules"
    }
}


/**
 * Categorize a single product using Gemini, with rule-based fallback
 */
async function categorizeProduct(name: string, description: string): Promise<CategorizeResponse> {
    const prompt = `You are a product categorization expert for a Y2K digital camera e-commerce store.

Analyze this product and categorize it as either a "camera" or "accessory".

Product Name: ${name}
Product Description: ${description}

Rules:
- "camera" includes: digital cameras, film cameras, instant cameras, camcorders, disposable cameras
- "accessory" includes: memory cards, SD cards, batteries, chargers, cases, bags, straps, tripods, lens caps, cleaning kits, adapters, cables, film

For accessories, also provide a subcategory from this list:
memory, power, case, strap, tripod, cleaning, protection, film

Respond in this exact JSON format:
{
  "category": "camera" or "accessory",
  "subcategory": "subcategory name" (only for accessories, null for cameras),
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`

    try {
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            console.error("Failed to parse LLM response, using rule-based fallback")
            return categorizeByRules(name, description)
        }

        const parsed = JSON.parse(jsonMatch[0])
        return {
            category: parsed.category === "accessory" ? "accessory" : "camera",
            subcategory: parsed.subcategory || undefined,
            confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8)),
            reasoning: parsed.reasoning || "No reasoning provided",
            method: "llm"
        }
    } catch (error) {
        console.error("Error calling Gemini, using rule-based fallback:", error)
        // Fall back to rule-based categorization
        return categorizeByRules(name, description)
    }
}


/**
 * Update Stripe product metadata with category
 */
async function updateStripeProductCategory(
    productId: string,
    category: string,
    subcategory?: string
): Promise<boolean> {
    try {
        await stripe.products.update(productId, {
            metadata: {
                category,
                ...(subcategory && { subcategory }),
                categorized_by_llm: "true",
                categorized_at: new Date().toISOString()
            }
        })
        return true
    } catch (error) {
        console.error(`Failed to update Stripe product ${productId}:`, error)
        return false
    }
}

/**
 * POST: Categorize a single product
 */
export async function POST(request: Request) {
    try {
        const body: CategorizeRequest = await request.json()

        if (!body.name) {
            return NextResponse.json(
                { error: "Product name is required" },
                { status: 400 }
            )
        }

        const result = await categorizeProduct(body.name, body.description || "")

        // If productId provided, update Stripe metadata
        if (body.productId) {
            const updated = await updateStripeProductCategory(
                body.productId,
                result.category,
                result.subcategory
            )
            return NextResponse.json({ ...result, stripeUpdated: updated })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("[Categorize API] Error:", error)
        return NextResponse.json(
            { error: "Failed to categorize product" },
            { status: 500 }
        )
    }
}

/**
 * GET: Categorize all uncategorized products in Stripe
 * Query params:
 *   - force=true: Re-categorize all products regardless of existing category
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const forceRecategorize = url.searchParams.get("force") === "true"

        // Fetch all products from Stripe
        const products = await stripe.products.list({
            active: true,
            limit: 100
        })

        const results: Array<{
            id: string
            name: string
            category: string
            subcategory?: string
            wasUncategorized: boolean
            updated: boolean
        }> = []

        for (const product of products.data) {
            const existingCategory = product.metadata?.category
            const wasAlreadyCategorized = !!existingCategory && product.metadata?.categorized_by_llm !== "true"

            // Skip if manually categorized (not by LLM) - unless force is enabled
            if (wasAlreadyCategorized && !forceRecategorize) {
                results.push({
                    id: product.id,
                    name: product.name,
                    category: existingCategory,
                    subcategory: product.metadata?.subcategory,
                    wasUncategorized: false,
                    updated: false
                })
                continue
            }

            // Categorize using LLM
            console.log(`[Categorize] Processing: ${product.name}`)
            const categorization = await categorizeProduct(
                product.name,
                product.description || ""
            )
            console.log(`[Categorize] Result for ${product.name}:`, categorization)

            // Update Stripe if confident enough
            let updated = false
            if (categorization.confidence >= 0.7) {
                updated = await updateStripeProductCategory(
                    product.id,
                    categorization.category,
                    categorization.subcategory
                )
                console.log(`[Categorize] Updated Stripe for ${product.name}: ${updated}`)
            } else {
                console.log(`[Categorize] Skipping update for ${product.name} - low confidence: ${categorization.confidence}`)
            }

            results.push({
                id: product.id,
                name: product.name,
                category: categorization.category,
                subcategory: categorization.subcategory,
                wasUncategorized: !existingCategory,
                updated
            })

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200))
        }

        const summary = {
            total: results.length,
            categorized: results.filter(r => r.updated).length,
            alreadyCategorized: results.filter(r => !r.wasUncategorized && !r.updated).length,
            cameras: results.filter(r => r.category === "camera").length,
            accessories: results.filter(r => r.category === "accessory").length
        }

        return NextResponse.json({ summary, products: results })
    } catch (error) {
        console.error("[Categorize API] Bulk categorization error:", error)
        return NextResponse.json(
            { error: "Failed to categorize products" },
            { status: 500 }
        )
    }
}
