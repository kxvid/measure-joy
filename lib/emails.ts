import "server-only"

import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendOrderConfirmationEmail({
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
  const emailHtml = generateOrderConfirmationHTML({
    orderId,
    items,
    totalInCents,
    shippingAddress,
  })

  if (resend) {
    await resend.emails.send({
      from: "Measure Joy <orders@measurejoy.org>",
      to: email,
      subject: `Order Confirmation - #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    })
  } else {
    console.log("[Email] Resend not configured. Order confirmation would be sent to:", email)
  }
}

export async function sendShippingUpdateEmail({
  email,
  orderId,
  trackingNumber,
  carrier,
  items,
}: {
  email: string
  orderId: string
  trackingNumber: string
  carrier: string
  items: Array<{ name: string; quantity: number }>
}) {
  const trackingUrl = getCarrierTrackingUrl(carrier, trackingNumber)

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipping Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">MEASURE JOY</h1>
    <p style="color: white; margin: 10px 0 0 0;">Your order is on its way!</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
    <h2 style="color: #333; margin-top: 0;">Your Order Has Shipped!</h2>
    <p style="font-size: 16px;">Great news — your vintage camera is headed your way.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #14b8a6;">
      <p style="margin: 0; font-size: 14px; color: #666;">Order ID</p>
      <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #14b8a6;">#${orderId.slice(0, 8).toUpperCase()}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">Carrier</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${carrier.toUpperCase()}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Tracking Number</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${trackingNumber}</p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${trackingUrl}" style="display: inline-block; background: #14b8a6; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px;">
        Track Your Package
      </a>
    </div>

    <h3 style="color: #333; margin-top: 30px;">Items Shipped</h3>
    <div style="background: white; padding: 15px; border-radius: 8px;">
      ${items.map((item) => `<p style="margin: 5px 0;">${item.name} x${item.quantity}</p>`).join("")}
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #ddd;">
      <p style="margin: 0; font-size: 14px; color: #666;">Questions? Email us at <a href="mailto:christianvelasquez363@gmail.com" style="color: #14b8a6;">christianvelasquez363@gmail.com</a></p>
      <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
        <a href="https://measurejoy.org/account/orders" style="color: #14b8a6; text-decoration: none;">View Order Status</a> ·
        <a href="https://measurejoy.org/faq" style="color: #14b8a6; text-decoration: none;">FAQ</a>
      </p>
    </div>
  </div>
</body>
</html>
  `

  if (resend) {
    await resend.emails.send({
      from: "Measure Joy <orders@measurejoy.org>",
      to: email,
      subject: `Your Order Has Shipped! - #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    })
  } else {
    console.log("[Email] Resend not configured. Shipping email would be sent to:", email)
  }
}

function getCarrierTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierLower = carrier.toLowerCase()
  if (carrierLower === "usps") return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
  if (carrierLower === "ups") return `https://www.ups.com/track?tracknum=${trackingNumber}`
  if (carrierLower === "fedex") return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`
  if (carrierLower === "dhl") return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${trackingNumber}`
  return `https://measurejoy.org/account/orders`
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
    <h2 style="color: #333; margin-top: 0;">Order Confirmed!</h2>
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
      <p style="margin: 0; font-size: 14px;"><strong>What's Next?</strong></p>
      <p style="margin: 10px 0 0 0; font-size: 14px;">Your camera has been professionally tested and is ready to shoot. You'll receive a shipping notification with tracking within 1-2 business days.</p>
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
