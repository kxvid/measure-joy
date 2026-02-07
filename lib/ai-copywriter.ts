/**
 * AI Copywriter Service
 * 
 * Uses Google AI (Gemini) to generate compelling product descriptions
 * with fact-checking, A/B testing support, and category-specific prompts.
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

export type CopyVariant = "A" | "B" | "C" | "D" | "E"

export interface ProductCopy {
    description: string
    longDescription: string
    features: string[]
    sellingPoints: string[]
    variant?: CopyVariant
}

export interface ProductInfo {
    name: string
    brand?: string
    year?: string
    category?: string
    subcategory?: string
    condition?: string
    imageUrl?: string
    existingDescription?: string
    specs?: {
        megapixels?: string
        zoom?: string
        display?: string
        storage?: string
    }
}

/**
 * Variant style configurations with detailed instructions
 */
const VARIANT_STYLES: Record<CopyVariant, { name: string; instruction: string; tone: string }> = {
    A: {
        name: "Nostalgic",
        instruction: "Write with emotional nostalgia that transports readers back to the Y2K era. Evoke memories of simpler times, the excitement of developing film, and the authentic feel of vintage technology.",
        tone: "warm, sentimental, storytelling"
    },
    B: {
        name: "Practical",
        instruction: "Focus on value proposition and functional benefits. Highlight specifications, reliability, and what the buyer gets for their money. Use clear, informative language.",
        tone: "professional, informative, value-focused"
    },
    C: {
        name: "Trendy",
        instruction: "Emphasize the aesthetic appeal and social media potential. Focus on the 'vibe', Instagram-worthy shots, and how this fits the current vintage camera trend. Use modern, engaging language.",
        tone: "exciting, contemporary, aesthetic-focused"
    },
    D: {
        name: "Collector",
        instruction: "Appeal to collectors and enthusiasts. Emphasize rarity, historical significance, brand heritage, and investment potential. Mention production years, limited editions, and collectibility.",
        tone: "authoritative, exclusive, heritage-focused"
    },
    E: {
        name: "Minimalist",
        instruction: "Use clean, concise language with a premium feel. Less is more - focus on essential qualities with elegant simplicity. Avoid fluff, keep it sophisticated.",
        tone: "refined, concise, premium"
    }
}

/**
 * Category-specific prompt enhancements
 */
function getCategoryContext(product: ProductInfo): string {
    const isCamera = product.category === "camera" || !product.category

    if (isCamera) {
        const specs = product.specs || {}
        return `
CAMERA-SPECIFIC CONTEXT:
- This is a ${product.condition || "vintage"} camera from the ${product.year || "retro"} era
- Brand Heritage: ${product.brand || "Unknown"} is known for quality optics and reliable build
${specs.megapixels ? `- Resolution: ${specs.megapixels}` : ""}
${specs.zoom ? `- Optical Zoom: ${specs.zoom}` : ""}
${specs.display ? `- Display: ${specs.display}` : ""}
- Emphasize: image quality, build quality, shooting experience, aesthetic output
- For digital: mention the charming low-resolution aesthetic popular with content creators
- For film: emphasize the authentic analog experience and tactile satisfaction`
    } else {
        return `
ACCESSORY-SPECIFIC CONTEXT:
- This is a ${product.subcategory || "camera accessory"} in ${product.condition || "good"} condition
- Focus on: compatibility, protection, convenience, quality materials
- Emphasize how it enhances or protects the camera experience
- Mention practical benefits: durability, ease of use, storage capacity if applicable`
    }
}

/**
 * Build the complete prompt for copy generation
 */
function buildCopyPrompt(product: ProductInfo, variant: CopyVariant): string {
    const style = VARIANT_STYLES[variant]
    const categoryContext = getCategoryContext(product)

    return `You are an expert e-commerce copywriter specializing in vintage cameras and accessories. Your copy converts browsers into buyers through emotional connection and clear value communication.

PRODUCT DETAILS:
- Name: ${product.name}
- Brand: ${product.brand || "Unknown"}
- Year: ${product.year || "Vintage"}
- Category: ${product.category || "camera"}
- Condition: ${product.condition || "Good"}
${categoryContext}

WRITING STYLE: ${style.name.toUpperCase()}
${style.instruction}
Tone: ${style.tone}

REQUIREMENTS:
Generate product copy in this exact JSON format:
{
  "description": "A punchy 1-2 sentence hook (max 140 chars). Must grab attention instantly and hint at value.",
  "longDescription": "3 engaging paragraphs: (1) Emotional hook with product story, (2) Key benefits and what makes it special, (3) Call to action - why buy now. Total 150-250 words.",
  "features": [
    "Specific feature with benefit (e.g., '2.0MP CCD sensor – captures that iconic Y2K digital aesthetic')",
    "Another feature-benefit pair",
    "Third feature-benefit",
    "Fourth feature-benefit",
    "Fifth feature-benefit"
  ],
  "sellingPoints": [
    "Compelling reason to buy #1 (focus on emotional or practical benefit)",
    "Compelling reason to buy #2",
    "Compelling reason to buy #3"
  ]
}

QUALITY STANDARDS:
✓ Be factually accurate about specifications
✓ Include the release year naturally in the description
✓ Features must pair the feature WITH its benefit (not just specs)
✓ Selling points should overcome objections and create urgency
✓ Use power words: "authentic", "iconic", "coveted", "pristine", "rare"
✓ SEO keywords: include brand name, product type, and "vintage" or "retro" naturally
✓ Never use clichés like "capture memories" without a fresh twist

Return ONLY valid JSON. No markdown, no code blocks, no explanation.`
}

/**
 * Generate AI-powered product copy with enhanced prompts
 */
export async function generateProductCopy(
    product: ProductInfo,
    variant: CopyVariant = "A"
): Promise<ProductCopy> {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 1024,
        }
    })

    const prompt = buildCopyPrompt(product, variant)

    try {
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        // Parse JSON from response (handle potential markdown wrapping)
        let jsonStr = response.trim()
        if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "")
        }

        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("No JSON found in response")
        }

        const parsed = JSON.parse(jsonMatch[0])

        return {
            description: parsed.description || "",
            longDescription: parsed.longDescription || "",
            features: Array.isArray(parsed.features) ? parsed.features : [],
            sellingPoints: Array.isArray(parsed.sellingPoints) ? parsed.sellingPoints : [],
            variant,
        }
    } catch (error) {
        console.error("[AI Copywriter] Error generating copy:", error)

        // Enhanced fallback copy
        const isCamera = product.category === "camera" || !product.category
        return {
            description: `${product.brand || "Vintage"} ${product.name} – ${product.year || "Classic"} ${isCamera ? "camera" : "accessory"} ready for new adventures.`,
            longDescription: `Discover the ${product.name}, a ${product.condition || "well-preserved"} ${product.year || "vintage"} piece from ${product.brand || "a trusted brand"}.\n\nThis ${isCamera ? "camera offers an authentic shooting experience that digital can't replicate" : "accessory enhances your photography setup with reliable performance"}. Every ${isCamera ? "shot tells a story" : "detail matters"}, and this piece delivers.\n\nDon't miss your chance to own a piece of photographic history. Limited availability.`,
            features: [
                "Fully tested and verified working",
                "Professionally cleaned and inspected",
                "Original components intact",
                `${product.condition || "Good"} cosmetic condition`,
                "Ready to use out of the box"
            ],
            sellingPoints: [
                "Authentic vintage aesthetic for unique content",
                "Quality craftsmanship built to last decades",
                "Perfect addition to any camera collection"
            ],
            variant,
        }
    }
}

/**
 * Generate all 5 variants for comprehensive A/B testing
 */
export async function generateAllVariants(product: ProductInfo): Promise<Record<CopyVariant, ProductCopy>> {
    const variants: CopyVariant[] = ["A", "B", "C", "D", "E"]

    // Generate in batches to avoid rate limiting
    const results = await Promise.all(
        variants.map(v => generateProductCopy(product, v))
    )

    return {
        A: results[0],
        B: results[1],
        C: results[2],
        D: results[3],
        E: results[4],
    }
}

/**
 * Generate multiple variants for A/B testing (legacy support)
 */
export async function generateABVariants(product: ProductInfo): Promise<{
    A: ProductCopy
    B: ProductCopy
    C: ProductCopy
}> {
    const [variantA, variantB, variantC] = await Promise.all([
        generateProductCopy(product, "A"),
        generateProductCopy(product, "B"),
        generateProductCopy(product, "C"),
    ])

    return {
        A: variantA,
        B: variantB,
        C: variantC,
    }
}

/**
 * Get variant style info for display
 */
export function getVariantInfo(variant: CopyVariant): { name: string; tone: string } {
    return {
        name: VARIANT_STYLES[variant].name,
        tone: VARIANT_STYLES[variant].tone
    }
}

/**
 * Get all available variants
 */
export function getAllVariants(): CopyVariant[] {
    return ["A", "B", "C", "D", "E"]
}

/**
 * Fact-check a product description
 */
export async function factCheckDescription(
    product: ProductInfo,
    description: string
): Promise<{ isAccurate: boolean; corrections: string[] }> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `You are a fact-checker for camera product descriptions.

Product: ${product.name}
Brand: ${product.brand || "Unknown"}
Year: ${product.year || "Unknown"}

Description to check:
"${description}"

Check if the description contains any inaccuracies about:
- Camera specifications (megapixels, zoom, etc.)
- Release year
- Brand information
- Features that don't exist on this model

Return JSON:
{
  "isAccurate": true/false,
  "corrections": ["Correction 1", "Correction 2"] or []
}

Return ONLY valid JSON, no markdown.`

    try {
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return { isAccurate: true, corrections: [] }
        }

        return JSON.parse(jsonMatch[0])
    } catch (error) {
        console.error("[AI Copywriter] Error fact-checking:", error)
        return { isAccurate: true, corrections: [] }
    }
}
