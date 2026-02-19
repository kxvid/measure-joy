
/**
 * Utility to extract brand, year, and category from product names
 * when metadata is missing.
 */

// Common Y2K camera brands
const CAMERA_BRANDS = [
    "Sony",
    "Canon",
    "Nikon",
    "Fujifilm",
    "Fuji",
    "Olympus",
    "Kodak",
    "Samsung",
    "Pentax",
    "Casio",
    "Panasonic",
    "Lumix",
    "HP",
    "Leica",
    "Minolta",
    "Ricoh",
    "Polaroid",
    "GoPro",
    "Sanyo",
    "Kyocera",
    "Konica"
]

export function extractProductInfo(name: string, description: string) {
    const info = {
        brand: undefined as string | undefined,
        year: undefined as string | undefined,
        category: "camera" as "camera" | "accessory"
    }

    const lowerName = name.toLowerCase()

    // 1. Detect Brand
    for (const brand of CAMERA_BRANDS) {
        if (lowerName.includes(brand.toLowerCase())) {
            // Normalize aliases
            if (brand === "Fuji") info.brand = "Fujifilm"
            else if (brand === "Lumix") info.brand = "Panasonic"
            else info.brand = brand
            break
        }
    }

    // 2. Detect Year (2000-2015)
    const yearMatch = name.match(/\b(200\d|201[0-5])\b/) || description.match(/\b(200\d|201[0-5])\b/)
    if (yearMatch) {
        info.year = yearMatch[0]
    }

    // 3. Detect Category (Accessory keywords)
    const accessoryKeywords = ["battery", "charger", "case", "bag", "strap", "tripod", "cable", "card", "memory", "film", "cleaning", "filter", "adapter", "lens cap"]
    if (accessoryKeywords.some(k => lowerName.includes(k))) {
        info.category = "accessory"
    }

    return info
}
