import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { sendOrderConfirmationEmail } from "@/lib/emails"

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

      // Retrieve line items from Stripe session
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      })

      const items = lineItems.data.map((item) => {
        const product = item.price?.product as Stripe.Product
        return {
          productId: product?.id || 'unknown',
          name: item.description || product?.name || 'Unknown Product',
          quantity: item.quantity || 1,
          priceInCents: item.amount_total || 0,
          image: product?.images?.[0] || null,
        }
      })

      const totalInCents = items.reduce((sum, item) => sum + item.priceInCents, 0)

      // Decrement inventory for each purchased product
      // Uses Stripe product metadata as source of truth for stockCount
      for (const item of items) {
        if (item.productId === "unknown") continue
        try {
          await decrementProductStock(item.productId, item.quantity)
        } catch (stockError) {
          console.error(`[v0] Failed to decrement stock for ${item.productId}:`, stockError)
          // Don't fail the webhook if stock update fails - order is already paid
        }
      }

      // Send confirmation email
      if (session.customer_details?.email) {
        try {
          await sendOrderConfirmationEmail({
            email: session.customer_details.email,
            orderId: session.id,
            items: items,
            totalInCents: totalInCents,
            shippingAddress: (session as any).shipping_details?.address,
          })
          console.log("[v0] Confirmation email sent to:", session.customer_details.email)
        } catch (emailError) {
          console.error("[v0] Error sending confirmation email:", emailError)
        }
      }

      return NextResponse.json({ received: true })
    }

    // Handle product events for inventory sync (Log only, no DB)
    if (event.type === "product.created" || event.type === "product.updated") {
      const product = event.data.object as Stripe.Product
      console.log(`[v0] Product ${event.type}:`, product.id, product.name)
      return NextResponse.json({ received: true })
    }

    if (event.type === "product.deleted") {
      const product = event.data.object as Stripe.Product
      console.log(`[v0] Product deleted:`, product.id)
      return NextResponse.json({ received: true })
    }

    // Handle price updates
    if (event.type === "price.created" || event.type === "price.updated") {
      const price = event.data.object as Stripe.Price
      console.log(`[v0] Price ${event.type}:`, price.id, `$${(price.unit_amount || 0) / 100}`)
      return NextResponse.json({ received: true })
    }

    // Return 200 for other event types
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

// Decrement a product's stockCount in Stripe metadata by the given quantity.
// Marks the product as out-of-stock (inStock: "false") when count hits 0.
// If stockCount is not set on the product, this is a no-op (inventory untracked).
async function decrementProductStock(productId: string, quantity: number) {
  const product = await stripe.products.retrieve(productId)
  const currentStockRaw = product.metadata?.stockCount

  // Skip if inventory isn't tracked for this product
  if (!currentStockRaw) {
    console.log(`[v0] Product ${productId} has no stockCount metadata - skipping decrement`)
    return
  }

  const currentStock = parseInt(currentStockRaw, 10)
  if (isNaN(currentStock)) {
    console.warn(`[v0] Invalid stockCount "${currentStockRaw}" for product ${productId}`)
    return
  }

  const newStock = Math.max(0, currentStock - quantity)

  const newMetadata: Record<string, string> = {
    ...product.metadata,
    stockCount: newStock.toString(),
  }

  // Auto-mark as out of stock when depleted
  if (newStock === 0) {
    newMetadata.inStock = "false"
  }

  await stripe.products.update(productId, { metadata: newMetadata })
  console.log(`[v0] Decremented stock for ${productId}: ${currentStock} → ${newStock}`)
}
