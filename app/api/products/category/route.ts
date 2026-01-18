import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * POST: Update a single product's category in Stripe metadata
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { productId, category, subcategory } = body

        if (!productId || !category) {
            return NextResponse.json(
                { error: "productId and category are required" },
                { status: 400 }
            )
        }

        if (!["camera", "accessory"].includes(category)) {
            return NextResponse.json(
                { error: "category must be 'camera' or 'accessory'" },
                { status: 400 }
            )
        }

        // Update Stripe product metadata
        await stripe.products.update(productId, {
            metadata: {
                category,
                ...(subcategory && { subcategory }),
                ...(!subcategory && category === "camera" && { subcategory: "" }), // Clear subcategory for cameras
                categorized_by_llm: "false", // Mark as manually categorized
                categorized_at: new Date().toISOString()
            }
        })

        return NextResponse.json({
            success: true,
            productId,
            category,
            subcategory: subcategory || null
        })
    } catch (error) {
        console.error("[Products Category API] Error:", error)
        return NextResponse.json(
            { error: "Failed to update product category" },
            { status: 500 }
        )
    }
}
