/**
 * AI Copywriter Service
 * 
 * Uses Google AI (Gemini) to generate compelling product descriptions
 * with fact-checking and A/B testing support.
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

export interface ProductCopy {
    description: string
    longDescription: string
    features: string[]
    sellingPoints: string[]
    variant?: "A" | "B" | "C"
}

export interface ProductInfo {
    name: string
    brand?: string
    year?: string
    category?: string
    imageUrl?: string
    existingDescription?: string
}

/**
 * Generate AI-powered product copy
 */
export async function generateProductCopy(
    product: ProductInfo,
    variant: "A" | "B" | "C" = "A"
): Promise<ProductCopy> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const variantInstructions = {
        A: "Write in a nostalgic, emotional tone that appeals to Y2K enthusiasts and collectors.",
        B: "Write in a practical, feature-focused tone that highlights value and functionality.",
        C: "Write in an exciting, trendy tone that emphasizes the aesthetic and social media potential.",
    }

    const prompt = `You are a product copywriter for an e-commerce store selling vintage and Y2K-era cameras.

Product: ${product.name}
Brand: ${product.brand || "Unknown"}
Year Released: ${product.year || "Vintage"}
Category: ${product.category || "Camera"}

Style: ${variantInstructions[variant]}

Generate compelling product copy in JSON format:
{
  "description": "A concise 1-2 sentence product description (max 150 chars)",
  "longDescription": "A detailed 2-3 paragraph description that tells a story and sells the product",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "sellingPoints": ["Why buy this 1", "Why buy this 2", "Why buy this 3"]
}

Important:
- Be accurate about the camera's capabilities
- Include the release year in the description
- Mention the brand heritage
- For vintage cameras, emphasize the aesthetic and nostalgia
- For digital cameras, mention megapixels, LCD, zoom if known
- Keep descriptions engaging and conversion-focused

Return ONLY valid JSON, no markdown.`

    try {
        const result = await model.generateContent(prompt)
        const response = result.response.text()

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("No JSON found in response")
        }

        const parsed = JSON.parse(jsonMatch[0])

        return {
            description: parsed.description || "",
            longDescription: parsed.longDescription || "",
            features: parsed.features || [],
            sellingPoints: parsed.sellingPoints || [],
            variant,
        }
    } catch (error) {
        console.error("[AI Copywriter] Error generating copy:", error)

        // Fallback to basic copy
        return {
            description: `${product.brand || "Vintage"} ${product.name}. Ready for your next adventure.`,
            longDescription: `The ${product.name} is a ${product.year || "classic"} ${product.brand || "vintage"} camera that's perfect for photography enthusiasts. Tested and working, this camera is ready to capture your memories.`,
            features: ["Tested and working", "Cleaned and inspected", "Ready to use"],
            sellingPoints: ["Perfect for Y2K photography", "Great for collectors", "Unique aesthetic"],
            variant,
        }
    }
}

/**
 * Generate multiple variants for A/B testing
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
 * Fact-check a product description
 */
export async function factCheckDescription(
    product: ProductInfo,
    description: string
): Promise<{ isAccurate: boolean; corrections: string[] }> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
