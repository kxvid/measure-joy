import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    const { email, source = "newsletter" } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    // Store subscriber in Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from("subscribers")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          source,
          subscribed_at: new Date().toISOString(),
          is_active: true
        },
        { onConflict: "email" }
      )

    if (dbError) {
      console.error("Database error:", dbError)
      // Continue anyway - email capture is more important than DB storage
    }

    // Send welcome email via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: "Measure Joy <hello@measurejoy.org>",
          to: email,
          subject: "Welcome to Measure Joy! 📸",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: 800; margin: 0; color: #1a1a1a;">MEASURE JOY</h1>
                <p style="color: #666; margin-top: 8px;">Y2K Digital Cameras & Retro Tech</p>
              </div>
              
              <h2 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">You're on the list! 🎉</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #444;">
                Thanks for joining the Measure Joy community. You'll be the first to know about:
              </p>
              
              <ul style="font-size: 16px; line-height: 1.8; color: #444; padding-left: 20px;">
                <li><strong>New camera drops</strong> – We add rare finds almost daily</li>
                <li><strong>Exclusive deals</strong> – Subscriber-only discounts</li>
                <li><strong>Y2K tech tips</strong> – Get the most out of your vintage camera</li>
              </ul>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://measurejoy.org/shop" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Shop Now →
                </a>
              </div>
              
              <p style="font-size: 14px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 24px;">
                © ${new Date().getFullYear()} Measure Joy. Curated Y2K tech with love.
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Email send error:", emailError)
        // Don't fail the request if email fails - subscription still succeeded
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!"
    })

  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    )
  }
}
