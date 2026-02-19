import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import {
    generateProductCopy,
    generateAllVariants,
    getVariantInfo,
    getAllVariants,
    type ProductInfo,
    type CopyVariant
} from "@/lib/ai-copywriter"

/**
 * Admin API for generating AI product copy
 * 
 * POST /api/admin/generate-copy
 * Body: { productId?: string, generateAll?: boolean, variant?: CopyVariant, allVariants?: boolean }
 * 
 * GET /api/admin/generate-copy?productId=xxx
 * Returns current copy for a product
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { productId, generateAll, variant = "A", allVariants = false } = body

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
            const total = products.data.length

            for (let i = 0; i < products.data.length; i++) {
                const product = products.data[i]
                const productInfo: ProductInfo = {
                    name: product.name,
                    brand: product.metadata?.brand,
                    year: product.metadata?.year,
                    category: product.metadata?.category,
                    subcategory: product.metadata?.subcategory,
                    condition: product.metadata?.condition,
                    imageUrl: product.images?.[0],
                    existingDescription: product.description || undefined,
                    specs: {
                        megapixels: product.metadata?.megapixels,
                        zoom: product.metadata?.zoom,
                        display: product.metadata?.display,
                        storage: product.metadata?.storage,
                    }
                }

                try {
                    const copy = await generateProductCopy(productInfo, variant as CopyVariant)

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
                        progress: `${i + 1}/${total}`,
                    })
                } catch (error) {
                    results.push({
                        id: product.id,
                        name: product.name,
                        success: false,
                        error: String(error),
                        progress: `${i + 1}/${total}`,
                    })
                }

                // Small delay to avoid rate limiting
                if (i < products.data.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500))
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
                subcategory: product.metadata?.subcategory,
                condition: product.metadata?.condition,
                imageUrl: product.images?.[0],
                existingDescription: product.description || undefined,
                specs: {
                    megapixels: product.metadata?.megapixels,
                    zoom: product.metadata?.zoom,
                    display: product.metadata?.display,
                    storage: product.metadata?.storage,
                }
            }

            // Generate all 5 variants if requested
            if (allVariants) {
                const variants = await generateAllVariants(productInfo)

                return NextResponse.json({
                    message: "Generated all 5 variants",
                    product: product.name,
                    productId: product.id,
                    variants,
                    variantInfo: Object.fromEntries(
                        getAllVariants().map(v => [v, getVariantInfo(v)])
                    ),
                })
            }

            // Generate single variant
            const copy = await generateProductCopy(productInfo, variant as CopyVariant)

            return NextResponse.json({
                message: `Generated ${getVariantInfo(variant as CopyVariant).name} variant`,
                product: product.name,
                productId: product.id,
                copy,
                variantInfo: getVariantInfo(variant as CopyVariant),
            })
        }

        return NextResponse.json(
            { error: "Provide productId or set generateAll: true" },
            { status: 400 }
        )
    } catch (error) {
        console.error("[Generate Copy API] Error:", error)
        return NextResponse.json(
            { error: "Failed to generate copy", details: String(error) },
            { status: 500 }
        )
    }
}

/**
 * Apply generated copy to a product
 */
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { productId, copy, variant } = body

        if (!productId || !copy) {
            return NextResponse.json(
                { error: "productId and copy are required" },
                { status: 400 }
            )
        }

        const product = await stripe.products.retrieve(productId)

        await stripe.products.update(productId, {
            description: copy.description,
            metadata: {
                ...product.metadata,
                longDescription: copy.longDescription,
                features: JSON.stringify(copy.features),
                sellingPoints: JSON.stringify(copy.sellingPoints),
                copyVariant: variant || "A",
                copyAppliedAt: new Date().toISOString(),
            },
        })

        return NextResponse.json({
            message: "Copy applied successfully",
            product: product.name,
        })
    } catch (error) {
        console.error("[Generate Copy API] Error applying copy:", error)
        return NextResponse.json(
            { error: "Failed to apply copy" },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (productId) {
        try {
            const product = await stripe.products.retrieve(productId)
            const metadata = product.metadata || {}

            return NextResponse.json({
                product: {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    images: product.images,
                    currentCopy: {
                        description: product.description || "",
                        longDescription: metadata.longDescription || "",
                        features: (() => { try { return metadata.features ? JSON.parse(metadata.features) : [] } catch { return [] } })(),
                        sellingPoints: (() => { try { return metadata.sellingPoints ? JSON.parse(metadata.sellingPoints) : [] } catch { return [] } })(),
                        variant: metadata.copyVariant || null,
                        generatedAt: metadata.copyGeneratedAt || null,
                    },
                    metadata: {
                        brand: metadata.brand,
                        year: metadata.year,
                        category: metadata.category,
                        condition: metadata.condition,
                    }
                }
            })
        } catch (error) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            )
        }
    }

    // Return API usage info
    return NextResponse.json({
        usage: {
            "POST /api/admin/generate-copy": {
                description: "Generate AI product copy",
                body: {
                    productId: "string - Stripe product ID (optional)",
                    generateAll: "boolean - Generate for all products (optional)",
                    variant: "'A' | 'B' | 'C' | 'D' | 'E' - Copy variant style (optional, default: 'A')",
                    allVariants: "boolean - Generate all 5 variants for a product (optional)",
                },
            },
            "PUT /api/admin/generate-copy": {
                description: "Apply generated copy to a product",
                body: {
                    productId: "string - Stripe product ID",
                    copy: "object - The generated copy to apply",
                    variant: "string - Which variant was applied",
                },
            },
            "GET /api/admin/generate-copy?productId=xxx": {
                description: "Get current copy for a product",
            },
        },
        variants: {
            A: { name: "Nostalgic", tone: "warm, sentimental, storytelling" },
            B: { name: "Practical", tone: "professional, informative, value-focused" },
            C: { name: "Trendy", tone: "exciting, contemporary, aesthetic-focused" },
            D: { name: "Collector", tone: "authoritative, exclusive, heritage-focused" },
            E: { name: "Minimalist", tone: "refined, concise, premium" },
        },
    })
}

