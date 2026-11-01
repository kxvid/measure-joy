import { requireAdminRequest, readAdminJson, adminErrorResponse } from "@/lib/admin-auth"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

// This endpoint creates the WELCOME10 promo code in Stripe
// Run once from the authenticated admin interface.
export async function POST(request: Request) {
    try {
        await requireAdminRequest(request)
        await readAdminJson(request)
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
            promotion: {
                type: "coupon",
                coupon: coupon.id,
            },
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
        return adminErrorResponse(error)
    }
}
