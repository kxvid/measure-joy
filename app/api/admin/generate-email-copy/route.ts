import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { checkAdminAccess } from "@/app/actions/auth-admin"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "")

const TONE_INSTRUCTIONS: Record<string, string> = {
    nostalgic:
        "Warm, sentimental, storytelling. Evoke Y2K memories, film cameras, the magic of early digital photography. Reference feelings more than features.",
    trendy:
        "Exciting, contemporary, aesthetic-focused. Emphasize vibe, Instagram-worthy shots, how vintage cameras are having a moment. Modern and energetic.",
    minimalist:
        "Refined, concise, premium. Short punchy sentences. Less is more. No fluff. Sophisticated and confident.",
}

const BRAND_CONTEXT = `BRAND: Measure Joy — a curated e-commerce store selling vintage Y2K digital cameras (2003-2010 era) and camera accessories. Every camera is tested, cleaned, and verified working. Brands include Sony, Canon, Fujifilm, Olympus, Nikon, Kodak.

BRAND VOICE: Playful, nostalgic, confident, slightly irreverent about retro tech. Appeals to Gen Z photographers, content creators, camera collectors, and Y2K aesthetic enthusiasts. Never corporate, never stiff.

TYPICAL CUSTOMER: 18-35, creative, values aesthetic and authenticity over convenience, posts on Instagram, loves the digital grain and imperfections of old cameras.`

export async function POST(request: Request) {
    if (!(await checkAdminAccess())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
        return NextResponse.json(
            { error: "GOOGLE_AI_API_KEY not configured" },
            { status: 500 }
        )
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const {
        mode,
        brief,
        templateType,
        tone = "trendy",
        subject,
        blockType,
        surroundingContext,
    } = body as {
        mode: "full" | "single"
        brief?: string
        templateType?: string
        tone?: "nostalgic" | "trendy" | "minimalist"
        subject?: string
        blockType?: "heading" | "text"
        surroundingContext?: string
    }

    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.trendy

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        })

        if (mode === "single") {
            if (!blockType) {
                return NextResponse.json(
                    { error: "blockType required for single mode" },
                    { status: 400 }
                )
            }

            const prompt = `${BRAND_CONTEXT}

TASK: Write copy for a single ${blockType} block in an email.

TONE: ${toneInstruction}

${subject ? `EMAIL SUBJECT LINE: "${subject}"` : ""}
${surroundingContext ? `SURROUNDING CONTEXT (nearby blocks):\n${surroundingContext}\n` : ""}

REQUIREMENTS:
${
    blockType === "heading"
        ? `- 2-6 words maximum
- Uppercase-friendly (it will be rendered ALL CAPS)
- Punchy, emotional, attention-grabbing
- No punctuation at the end
- Examples: "FRESH DROP ALERT", "JUST LANDED", "BACK IN THE GAME", "SHOT ON Y2K"`
        : `- 1-3 short sentences (max 280 chars)
- Conversational, on-brand
- No em-dashes or corporate speak
- Leave recipient curious or excited to click through`
}

Return ONLY a JSON object: { "content": "your copy here" }
No markdown, no code blocks, no explanation.`

            const result = await model.generateContent(prompt)
            const response = result.response.text()

            const parsed = parseJsonResponse(response)
            return NextResponse.json({ content: parsed.content || "" })
        }

        // mode === "full"
        if (!brief || !templateType) {
            return NextResponse.json(
                { error: "brief and templateType required for full mode" },
                { status: 400 }
            )
        }

        const prompt = `${BRAND_CONTEXT}

TASK: Generate a complete marketing email for a "${templateType}" campaign.

CAMPAIGN BRIEF FROM ADMIN:
${brief}

TONE: ${toneInstruction}

REQUIREMENTS:
Generate a JSON response with this exact structure:
{
  "subject": "Compelling subject line (30-60 chars, emoji ok, no clickbait)",
  "headings": ["2-6 word heading", "optional second heading", ...],
  "texts": ["1-3 sentence paragraph", "another paragraph", ...],
  "button": "CTA button text (2-4 words, uppercase-friendly)"
}

QUALITY STANDARDS:
- Subject lines should make people want to open — specific, emotional, or mysterious
- Headings are ALL CAPS rendered — write them without caps, they'll be uppercased
- Body text must sound human, not marketing-speak
- Use sensory language: "mint condition", "crisp", "buttery", "grainy", "iconic"
- Never say "elevate your photography" or similar cliches
- For sales: create urgency without hype ("48 hours only", "just 3 left")
- For drops: name the specific model if mentioned in brief
- For newsletters: tell a mini-story, don't just announce
- Button text is active and specific ("Shop the Drop", "Claim Your Deal", "Read the Story")

Provide 2-4 headings and 2-4 texts depending on what the template needs.

Return ONLY valid JSON. No markdown, no code blocks, no explanation.`

        const result = await model.generateContent(prompt)
        const response = result.response.text()

        const parsed = parseJsonResponse(response)
        return NextResponse.json({
            subject: parsed.subject || "",
            headings: Array.isArray(parsed.headings) ? parsed.headings : [],
            texts: Array.isArray(parsed.texts) ? parsed.texts : [],
            button: parsed.button || "",
        })
    } catch (error: any) {
        console.error("[generate-email-copy]", error)
        return NextResponse.json(
            { error: error?.message || "Failed to generate copy" },
            { status: 500 }
        )
    }
}

function parseJsonResponse(response: string): any {
    let jsonStr = response.trim()
    if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "")
    }
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in AI response")
    return JSON.parse(jsonMatch[0])
}
