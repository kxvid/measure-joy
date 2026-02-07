#!/usr/bin/env node
/**
 * Setup script for CMS site_content table.
 * Run: node scripts/setup-cms.mjs
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read .env.local manually
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf8")
const env = {}
for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx > 0) {
        env[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1)
    }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
}

const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")

async function main() {
    console.log("Setting up CMS site_content table...")
    console.log(`Project: ${projectRef}`)

    const sqlFile = readFileSync(
        resolve(__dirname, "../supabase/migrations/001_create_site_content.sql"),
        "utf8"
    )

    // Try various SQL execution endpoints
    const endpoints = [
        { url: `${SUPABASE_URL}/pg/sql`, name: "pg/sql" },
    ]

    for (const ep of endpoints) {
        try {
            console.log(`Trying ${ep.name}...`)
            const resp = await fetch(ep.url, {
                method: "POST",
                headers: {
                    "apikey": SERVICE_KEY,
                    "Authorization": `Bearer ${SERVICE_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: sqlFile }),
            })
            const text = await resp.text()
            if (resp.ok) {
                console.log(`Success via ${ep.name}!`)
                console.log(text.substring(0, 300))
                return
            }
            console.log(`${ep.name} returned ${resp.status}: ${text.substring(0, 200)}`)
        } catch (err) {
            console.log(`${ep.name} failed: ${err.message}`)
        }
    }

    console.log("\n--- Manual Setup Required ---")
    console.log("Please run the SQL migration manually in the Supabase Dashboard:")
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`)
    console.log(`\nSQL file: supabase/migrations/001_create_site_content.sql`)
    console.log("\nCopy the contents of that file and paste it into the SQL Editor, then click Run.")
}

main()
