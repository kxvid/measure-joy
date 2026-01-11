"use server"

import { stripe } from "@/lib/stripe"
import { getStripeProductById } from "@/lib/stripe-products"
import { createClient } from "@/lib/supabase/server"

interface CheckoutItem {
  productId: string
  quantity: number
}

export async function startCheckoutSession(items: CheckoutItem[], userId?: string) {
  // Fetch products from Stripe and build line items (filter out products not found)
  const lineItemsPromises = items.map(async (item) => {
    const product = await getStripeProductById(item.productId)
    if (!product) {
      console.warn(`[Checkout] Product ${item.productId} not found in Stripe, skipping`)
      return null
    }
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          description: product.description,
          images: product.images?.slice(0, 1) || [],
        },
        unit_amount: product.priceInCents,
      },
      quantity: item.quantity,
      productId: item.productId,
    }
  })

  const lineItemsWithNull = await Promise.all(lineItemsPromises)
  const validItems = lineItemsWithNull.filter((item): item is NonNullable<typeof item> => item !== null)

  if (validItems.length === 0) {
    throw new Error("No valid items in cart. Your cart may contain outdated products - please clear your cart and add items again.")
  }

  const compactItems = validItems.map((item) => `${item.productId}:${item.quantity}`).join(",")

  // Remove productId from line items before sending to Stripe
  const stripeLineItems = validItems.map(({ productId, ...rest }) => rest)

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: stripeLineItems,
    mode: "payment",
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU"],
    },
    metadata: {
      user_id: userId || "",
      // Store compact format: "product-id:qty,product-id:qty"
      items: compactItems,
    },
  })

  return session.client_secret
}

export async function startSingleProductCheckout(productId: string, userId?: string) {
  const product = await getStripeProductById(productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
            images: product.images?.slice(0, 1) || [],
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU"],
    },
    metadata: {
      user_id: userId || "",
      items: `${productId}:1`,
    },
  })

  return session.client_secret
}

export async function saveOrderFromCheckout(sessionId: string) {
  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    })

    if (session.payment_status !== "paid") {
      return { success: false, error: "Payment not completed" }
    }

    const userId = session.metadata?.user_id

    // Parse items from metadata and fetch product details
    const compactItems = session.metadata?.items || ""
    const itemPairs = compactItems.split(",").filter(Boolean)

    const items = await Promise.all(
      itemPairs.map(async (item) => {
        const [productId, quantity] = item.split(":")
        const product = await getStripeProductById(productId)
        return {
          productId,
          name: product?.name || "",
          quantity: Number.parseInt(quantity) || 1,
          priceInCents: product?.priceInCents || 0,
          image: product?.images?.[0] || "",
        }
      })
    )

    // Get shipping details from customer_details
    const shippingAddress = session.customer_details?.address
      ? {
        name: session.customer_details.name || "",
        line1: session.customer_details.address.line1 || "",
        line2: session.customer_details.address.line2 || "",
        city: session.customer_details.address.city || "",
        state: session.customer_details.address.state || "",
        postal_code: session.customer_details.address.postal_code || "",
        country: session.customer_details.address.country || "",
      }
      : null

    // Only save to database if we have a user ID
    if (userId) {
      const supabase = await createClient()

      // Check if order already exists (prevent duplicates)
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .single()

      if (!existingOrder) {
        const { error } = await supabase.from("orders").insert({
          user_id: userId,
          stripe_session_id: session.id,
          status: "completed",
          total_cents: session.amount_total || 0,
          items: items,
          shipping_address: shippingAddress,
        })

        if (error) {
          console.error("Error saving order:", error)
          return { success: false, error: "Failed to save order" }
        }
      }
    }

    return {
      success: true,
      orderId: session.id,
      email: session.customer_details?.email,
    }
  } catch (error) {
    console.error("Error processing checkout:", error)
    return { success: false, error: "Failed to process checkout" }
  }
}
