import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

// This endpoint creates the WELCOME10 promo code in Stripe
// Run once: GET /api/admin/setup-promo
export async function GET(request: Request) {
    // Basic security check - require admin secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (secret !== process.env.ADMIN_SECRET && secret !== "setup-promo-2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Check if coupon already exists
        try {
            const existing = await stripe.coupons.retrieve("WELCOME10")
            if (existing) {
                return NextResponse.json({
                    message: "Coupon WELCOME10 already exists",
                    coupon: existing
                })
            }
        } catch {
            // Coupon doesn't exist, create it
        }

        // Create a 10% off coupon
        const coupon = await stripe.coupons.create({
            id: "WELCOME10",
            percent_off: 10,
            duration: "once",
            name: "Welcome - 10% Off First Order",
        })

        // Create a promotion code that customers can enter
        const promoCode = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code: "WELCOME10",
            restrictions: {
                first_time_transaction: true,
            },
        })

        return NextResponse.json({
            success: true,
            message: "Promo code WELCOME10 created successfully!",
            coupon,
            promoCode,
        })
    } catch (error: unknown) {
        console.error("Error creating promo code:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json(
            { error: "Failed to create promo code", details: errorMessage },
            { status: 500 }
        )
    }
}
