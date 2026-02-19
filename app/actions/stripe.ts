"use server"

import { stripe } from "@/lib/stripe"
import { getStripeProductById } from "@/lib/stripe-products"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://measurejoy.org"

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
    redirect_on_completion: "if_required",
    return_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    line_items: stripeLineItems,
    mode: "payment",
    allow_promotion_codes: true,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "usd",
          },
          display_name: "Free Shipping",
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 3,
            },
            maximum: {
              unit: "business_day",
              value: 5,
            },
          },
        },
      },
    ],
    phone_number_collection: {
      enabled: true,
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
    redirect_on_completion: "if_required",
    return_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
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
    allow_promotion_codes: true,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "usd",
          },
          display_name: "Free Shipping",
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 3,
            },
            maximum: {
              unit: "business_day",
              value: 5,
            },
          },
        },
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
    metadata: {
      user_id: userId || "",
      items: `${productId}:1`,
    },
  })

  return session.client_secret
}

export async function getCheckoutSessionStatus(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return {
    status: session.status,
    customerEmail: session.customer_details?.email ?? null,
  }
}

