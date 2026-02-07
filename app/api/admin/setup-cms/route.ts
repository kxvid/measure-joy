import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

const SEED_DATA = [
    // Hero
    { section: "hero", key: "badge", value: "New drops weekly" },
    { section: "hero", key: "heading_line1", value: "Reviving" },
    { section: "hero", key: "heading_line2", value: "Y2K Tech" },
    { section: "hero", key: "heading_line3", value: "For You" },
    { section: "hero", key: "subtitle", value: "Curated vintage digital cameras tested, cleaned, and ready to shoot. Experience the magic of early digital photography." },
    { section: "hero", key: "cta_primary", value: "Shop All Cameras" },
    { section: "hero", key: "cta_secondary", value: "Our Story" },
    { section: "hero", key: "marquee_items", value: ["TESTED & WORKING", "90-DAY WARRANTY", "FREE RETURNS", "AUTHENTIC Y2K", "EXPERT CURATED", "WORLDWIDE SHIPPING"] },

    // Promo Banner
    { section: "promo_banner", key: "items", value: [
        { text: "FREE SHIPPING ON $75+", href: "/shop" },
        { text: "NEW ARRIVALS WEEKLY", href: "/shop?sort=newest" },
        { text: "90-DAY WARRANTY", href: "/returns" },
        { text: "TESTED & WORKING", href: "/about" },
    ]},

    // Trust Badges
    { section: "trust_badges", key: "items", value: [
        { icon: "Shield", text: "Secure Checkout" },
        { icon: "Truck", text: "Free Shipping $75+" },
        { icon: "RefreshCw", text: "14-Day Returns" },
        { icon: "CreditCard", text: "Stripe Protected" },
    ]},

    // Trust Banner
    { section: "trust_banner", key: "items", value: [
        { icon: "Truck", title: "FREE SHIPPING", description: "On orders over $75", color: "bg-pop-yellow" },
        { icon: "RotateCcw", title: "EASY RETURNS", description: "30-day return policy", color: "bg-pop-pink" },
        { icon: "Shield", title: "90-DAY WARRANTY", description: "Tested & guaranteed", color: "bg-pop-teal" },
        { icon: "Package", title: "SECURE PACKAGING", description: "Safe delivery always", color: "bg-pop-yellow" },
    ]},

    // Trust Story
    { section: "trust_story", key: "badge", value: "Why Choose Us" },
    { section: "trust_story", key: "heading", value: "Trusted by Thousands" },
    { section: "trust_story", key: "subtitle", value: "We're not just reselling old cameras. We're curators, technicians, and fellow Y2K enthusiasts dedicated to bringing vintage tech back to life." },
    { section: "trust_story", key: "points", value: [
        { title: "12-Point Inspection", description: "Every camera is thoroughly tested for sensor quality, lens clarity, battery health, and more." },
        { title: "90-Day Guarantee", description: "Not happy? Full refund within 90 days, no questions asked. We stand behind every camera." },
        { title: "Professionally Restored", description: "Cleaned, calibrated, and restored to peak performance by our Y2K tech specialists." },
    ]},
    { section: "trust_story", key: "stats", value: [
        { value: "2,500+", label: "Happy Customers" },
        { value: "99%", label: "Positive Reviews" },
        { value: "5,000+", label: "Cameras Sold" },
    ]},
    { section: "trust_story", key: "quote", value: "The camera arrived in better condition than described. You can tell they actually test and care for these vintage gems. Will definitely buy again!" },
    { section: "trust_story", key: "quote_attribution", value: "— Verified Buyer, via email" },

    // Testimonials
    { section: "testimonials", key: "heading", value: "Loved by Y2K Camera Enthusiasts" },
    { section: "testimonials", key: "subtitle", value: "Join thousands of happy customers who've discovered the joy of vintage digital photography" },
    { section: "testimonials", key: "items", value: [
        { name: "Sarah Chen", location: "Los Angeles, CA", text: "Bought a Sony Cybershot and it brought back so many memories! The quality is amazing and customer service was super helpful.", rating: 5, product: "Sony Cybershot DSC-P200" },
        { name: "Marcus Rodriguez", location: "Brooklyn, NY", text: "Perfect Y2K aesthetic for my photography project. Fast shipping and the camera works flawlessly. Highly recommend!", rating: 5, product: "Canon PowerShot A520" },
        { name: "Emma Thompson", location: "Portland, OR", text: "I love the nostalgic feel of these cameras. Measure Joy has an amazing selection and everything arrived perfectly packaged.", rating: 5, product: "Fujifilm FinePix Z5fd" },
    ]},

    // Newsletter
    { section: "newsletter", key: "badge", value: "Join The List" },
    { section: "newsletter", key: "heading", value: "Get First Access" },
    { section: "newsletter", key: "subtitle", value: "New finds drop almost daily. Don't miss out on rare cameras and exclusive deals." },
    { section: "newsletter", key: "disclaimer", value: "No spam, ever. Unsubscribe anytime." },

    // Footer
    { section: "footer", key: "tagline", value: "Reviving Y2K digital cameras for a new generation. Experience the magic of early digital photography." },
    { section: "footer", key: "bottom_text", value: "Made for Y2K lovers" },

    // About
    { section: "about", key: "hero_heading", value: "Preserving the magic of Y2K photography" },
    { section: "about", key: "hero_subtitle", value: "Measure Joy started from a simple love for the unique aesthetic of early digital cameras. We believe these devices capture something special—a warmth and authenticity that modern smartphones just can't replicate." },
    { section: "about", key: "story_p1", value: "It all began in 2019 when our founder discovered their grandmother's old Sony Cybershot in a dusty drawer. The photos it produced—slightly soft, beautifully saturated—sparked a deep appreciation for the era." },
    { section: "about", key: "story_p2", value: "What started as a personal collection quickly grew into a mission: to rescue these forgotten gems and share them with a new generation who crave authenticity in an age of AI filters and computational photography." },
    { section: "about", key: "story_p3", value: "Today, Measure Joy is home to hundreds of carefully tested and refurbished cameras from the golden era of digital photography (2003-2010). Each camera tells a story, and we're here to help you write yours." },
    { section: "about", key: "values", value: [
        { title: "Quality First", description: "Every camera is thoroughly tested and comes with a 90-day warranty." },
        { title: "Passion Driven", description: "We're collectors ourselves—we only sell cameras we'd proudly own." },
        { title: "Authentic Experience", description: "Embrace imperfection. The quirks are what make these cameras special." },
        { title: "Community", description: "Join thousands of Y2K photography enthusiasts sharing their captures." },
    ]},
    { section: "about", key: "stats", value: [
        { value: "2,500+", label: "Happy Customers" },
        { value: "50+", label: "Camera Models" },
        { value: "4.9", label: "Average Rating" },
        { value: "2019", label: "Est." },
    ]},
]

export async function POST() {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get("admin_access")?.value === "true"
    if (!isAdmin) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const supabase = createAdminClient()

        // Check if table exists by trying to query it
        const { error: checkError } = await supabase
            .from("site_content")
            .select("id")
            .limit(1)

        if (checkError?.message?.includes("Could not find")) {
            return Response.json({
                error: "Table 'site_content' does not exist. Please run the SQL migration first.",
                migration_url: "https://supabase.com/dashboard/project/tffjckyzkowizxajxzkm/sql/new",
                migration_file: "supabase/migrations/001_create_site_content.sql"
            }, { status: 400 })
        }

        // Upsert all seed data
        const rows = SEED_DATA.map(d => ({
            section: d.section,
            key: d.key,
            value: d.value,
            updated_at: new Date().toISOString(),
            updated_by: "system",
        }))

        const { error: upsertError } = await supabase
            .from("site_content")
            .upsert(rows, { onConflict: "section,key", ignoreDuplicates: true })

        if (upsertError) {
            return Response.json({ error: upsertError.message }, { status: 500 })
        }

        // Count rows
        const { count } = await supabase
            .from("site_content")
            .select("*", { count: "exact", head: true })

        return Response.json({
            success: true,
            message: `CMS seeded successfully. ${count} content entries.`,
            count,
        })
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 })
    }
}
