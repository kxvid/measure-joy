import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { generateProductCopy, generateABVariants, type ProductInfo } from "@/lib/ai-copywriter"

/**
 * Admin API for generating AI product copy
 * 
 * POST /api/admin/generate-copy
 * Body: { productId?: string, generateAll?: boolean, variant?: "A" | "B" | "C" }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { productId, generateAll, variant = "A" } = body

        // Check for API key
        if (!process.env.GOOGLE_AI_API_KEY) {
            return NextResponse.json(
                { error: "Google AI API key not configured. Add GOOGLE_AI_API_KEY to .env.local" },
                { status: 500 }
            )
        }

        // Generate for all products
        if (generateAll) {
            const products = await stripe.products.list({ limit: 100, active: true })
            const results = []

            for (const product of products.data) {
                const productInfo: ProductInfo = {
                    name: product.name,
                    brand: product.metadata?.brand,
                    year: product.metadata?.year,
                    category: product.metadata?.category,
                    imageUrl: product.images?.[0],
                    existingDescription: product.description || undefined,
                }

                try {
                    const copy = await generateProductCopy(productInfo, variant as "A" | "B" | "C")

                    // Update Stripe with new copy
                    await stripe.products.update(product.id, {
                        description: copy.description,
                        metadata: {
                            ...product.metadata,
                            longDescription: copy.longDescription,
                            features: JSON.stringify(copy.features),
                            sellingPoints: JSON.stringify(copy.sellingPoints),
                            copyVariant: variant,
                            copyGeneratedAt: new Date().toISOString(),
                        },
                    })

                    results.push({
                        id: product.id,
                        name: product.name,
                        success: true,
                        copy: copy,
                    })
                } catch (error) {
                    results.push({
                        id: product.id,
                        name: product.name,
                        success: false,
                        error: String(error),
                    })
                }
            }

            return NextResponse.json({
                message: `Generated copy for ${results.filter(r => r.success).length}/${results.length} products`,
                results,
            })
        }

        // Generate for single product
        if (productId) {
            const product = await stripe.products.retrieve(productId)

            const productInfo: ProductInfo = {
                name: product.name,
                brand: product.metadata?.brand,
                year: product.metadata?.year,
                category: product.metadata?.category,
                imageUrl: product.images?.[0],
                existingDescription: product.description || undefined,
            }

            // Generate all A/B variants
            const variants = await generateABVariants(productInfo)

            // Update Stripe with variant A copy
            await stripe.products.update(product.id, {
                description: variants.A.description,
                metadata: {
                    ...product.metadata,
                    longDescription: variants.A.longDescription,
                    features: JSON.stringify(variants.A.features),
                    sellingPoints: JSON.stringify(variants.A.sellingPoints),
                    copyVariant: "A",
                    copyGeneratedAt: new Date().toISOString(),
                    // Store all variants for A/B testing
                    variantA_desc: variants.A.description,
                    variantB_desc: variants.B.description,
                    variantC_desc: variants.C.description,
                },
            })

            return NextResponse.json({
                message: "Generated A/B variants",
                product: product.name,
                variants,
            })
        }

        return NextResponse.json(
            { error: "Provide productId or set generateAll: true" },
            { status: 400 }
        )
    } catch (error) {
        console.error("[Generate Copy API] Error:", error)
        return NextResponse.json(
            { error: "Failed to generate copy" },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({
        usage: {
            "POST /api/admin/generate-copy": {
                description: "Generate AI product copy",
                body: {
                    productId: "string - Stripe product ID (optional)",
                    generateAll: "boolean - Generate for all products (optional)",
                    variant: "'A' | 'B' | 'C' - Copy variant style (optional, default: 'A')",
                },
                variants: {
                    A: "Nostalgic, emotional tone for Y2K enthusiasts",
                    B: "Practical, feature-focused tone",
                    C: "Trendy, social media-focused tone",
                },
            },
        },
    })
}
