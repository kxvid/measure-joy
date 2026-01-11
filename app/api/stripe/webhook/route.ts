import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { PRODUCTS } from "@/lib/products"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Webhook secret from Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error("[v0] No Stripe signature found")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("[v0] Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("[v0] Received webhook event:", event.type)

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      console.log("[v0] Processing completed checkout session:", session.id)

      // Extract order data from metadata
      const userId = session.metadata?.userId
      const cartItemsEncoded = session.metadata?.cartItems || ""

      // Parse cart items from compact format: "productId:qty,productId:qty"
      const cartItemPairs = cartItemsEncoded.split(",").filter(Boolean)
      const items = cartItemPairs.map((pair) => {
        const [productId, quantity] = pair.split(":")
        const product = PRODUCTS.find((p) => p.id === productId)
        if (!product) {
          throw new Error(`Product not found: ${productId}`)
        }
        return {
          productId: product.id,
          name: product.name,
          quantity: Number.parseInt(quantity, 10),
          priceInCents: product.price,
          image: product.image,
        }
      })

      const totalInCents = items.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0)

      // Save order to Supabase
      const supabase = await createClient()

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId || null,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          items: items,
          total_cents: totalInCents,
          status: "completed",
          customer_email: session.customer_details?.email || null,
          shipping_address: session.shipping_details?.address
            ? {
              line1: session.shipping_details.address.line1,
              line2: session.shipping_details.address.line2,
              city: session.shipping_details.address.city,
              state: session.shipping_details.address.state,
              postal_code: session.shipping_details.address.postal_code,
              country: session.shipping_details.address.country,
            }
            : null,
        })
        .select()
        .single()

      if (orderError) {
        console.error("[v0] Error saving order to database:", orderError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      console.log("[v0] Order saved to database:", order.id)

      // Send confirmation email
      if (session.customer_details?.email) {
        try {
          await sendOrderConfirmationEmail({
            email: session.customer_details.email,
            orderId: order.id,
            items: items,
            totalInCents: totalInCents,
            shippingAddress: order.shipping_address,
          })
          console.log("[v0] Confirmation email sent to:", session.customer_details.email)
        } catch (emailError) {
          console.error("[v0] Error sending confirmation email:", emailError)
          // Don't fail the webhook if email fails
        }
      }

      return NextResponse.json({ received: true })
    }

    // Handle product events for inventory sync
    if (event.type === "product.created" || event.type === "product.updated") {
      const product = event.data.object as Stripe.Product
      console.log(`[v0] Product ${event.type}:`, product.id, product.name)

      // If using Supabase cache, update it here
      // const supabase = await createClient()
      // await supabase.from("products_cache").upsert({
      //   stripe_product_id: product.id,
      //   name: product.name,
      //   metadata: product.metadata,
      //   images: product.images,
      //   updated_at: new Date().toISOString(),
      // })

      // For now, just log - Next.js will fetch fresh data on next request
      console.log(`[v0] Product sync complete for: ${product.name}`)
      return NextResponse.json({ received: true })
    }

    if (event.type === "product.deleted") {
      const product = event.data.object as Stripe.Product
      console.log(`[v0] Product deleted:`, product.id)

      // If using Supabase cache, remove it here
      // const supabase = await createClient()
      // await supabase.from("products_cache").delete().eq("stripe_product_id", product.id)

      return NextResponse.json({ received: true })
    }

    // Handle price updates
    if (event.type === "price.created" || event.type === "price.updated") {
      const price = event.data.object as Stripe.Price
      console.log(`[v0] Price ${event.type}:`, price.id, `$${(price.unit_amount || 0) / 100}`)

      // If using Supabase cache, update the price here
      // const supabase = await createClient()
      // await supabase.from("products_cache")
      //   .update({ price_cents: price.unit_amount })
      //   .eq("stripe_product_id", price.product)

      return NextResponse.json({ received: true })
    }

    // Return 200 for other event types
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

// Email sending function
async function sendOrderConfirmationEmail({
  email,
  orderId,
  items,
  totalInCents,
  shippingAddress,
}: {
  email: string
  orderId: string
  items: Array<{ name: string; quantity: number; priceInCents: number }>
  totalInCents: number
  shippingAddress: any
}) {
  // For now, we'll use a simple fetch to send email
  // You can replace this with Resend, SendGrid, or any email service

  const emailHtml = generateOrderConfirmationHTML({
    orderId,
    items,
    totalInCents,
    shippingAddress,
  })

  // Option 1: Use Resend (recommended)
  // Uncomment and add RESEND_API_KEY to env vars
  /*
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Measure Joy <orders@measurejoy.org>",
      to: email,
      subject: `Order Confirmation - #${orderId.slice(0, 8)}`,
      html: emailHtml,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to send email via Resend")
  }
  */

  // Option 2: Log email for now (development)
  console.log("[v0] Email would be sent to:", email)
  console.log("[v0] Email content:", emailHtml)

  // In production, integrate with your preferred email service
}

function generateOrderConfirmationHTML({
  orderId,
  items,
  totalInCents,
  shippingAddress,
}: {
  orderId: string
  items: Array<{ name: string; quantity: number; priceInCents: number }>
  totalInCents: number
  shippingAddress: any
}) {
  const itemsHTML = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.priceInCents / 100).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ec4899 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">MEASURE JOY</h1>
    <p style="color: white; margin: 10px 0 0 0;">Y2K Camera Specialists</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
    <h2 style="color: #333; margin-top: 0;">Order Confirmed! 📸</h2>
    <p style="font-size: 16px;">Thank you for your purchase! Your vintage camera is being prepared for shipment.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ec4899;">
      <p style="margin: 0; font-size: 14px; color: #666;">Order ID</p>
      <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #ec4899;">#${orderId.slice(0, 8).toUpperCase()}</p>
    </div>

    <h3 style="color: #333; margin-top: 30px;">Order Details</h3>
    <table style="width: 100%; background: white; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f1f1f1;">
          <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
          <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
          <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
        <tr>
          <td colspan="2" style="padding: 16px; font-weight: 600; border-top: 2px solid #333;">Total</td>
          <td style="padding: 16px; text-align: right; font-weight: 600; font-size: 18px; border-top: 2px solid #333;">$${(totalInCents / 100).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    ${shippingAddress
      ? `
    <h3 style="color: #333; margin-top: 30px;">Shipping Address</h3>
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <p style="margin: 5px 0;">${shippingAddress.line1}</p>
      ${shippingAddress.line2 ? `<p style="margin: 5px 0;">${shippingAddress.line2}</p>` : ""}
      <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}</p>
      <p style="margin: 5px 0;">${shippingAddress.country}</p>
    </div>
    `
      : ""
    }

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;"><strong>🎉 What's Next?</strong></p>
      <p style="margin: 10px 0 0 0; font-size: 14px;">Your camera has been professionally tested and is ready to shoot. You'll receive a shipping notification within 1-2 business days.</p>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #ddd;">
      <p style="margin: 0; font-size: 14px; color: #666;">Questions? Email us at <a href="mailto:christianvelasquez363@gmail.com" style="color: #ec4899;">christianvelasquez363@gmail.com</a></p>
      <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
        <a href="https://measurejoy.org/account/orders" style="color: #ec4899; text-decoration: none;">View Order Status</a> · 
        <a href="https://measurejoy.org/faq" style="color: #ec4899; text-decoration: none;">FAQ</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}
