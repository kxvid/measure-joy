/** Editable presentation copy. Catalog details and prices always come from Stripe. */
export const storefrontDefaults = {
  announcement: "A LITTLE NOSTALGIA. A LOT OF JOY.",
  hero_badge: "GOOD CAMERAS. GREAT STORIES.",
  hero_line1: "Little camera.",
  hero_line2: "Big",
  hero_accent: "feeling.",
  hero_description:
    "For the blurry nights, the sun-drenched days,\nand everything you’ll want to remember.",
  hero_button: "Find your camera",
  story_paragraph1:
    "The dinner that became a dance floor. The road trip with no real plan. The people who make an ordinary Tuesday feel like something.",
  story_paragraph2:
    "We find cameras with a past, so you can give them a future. A little nostalgia. A fresh perspective. A good reason to put your phone down.",
  about_paragraph1:
    "A good camera doesn’t stop being a good camera just because something newer comes along. Its quirks, colors, and character are part of what make it special.",
  about_paragraph2:
    "At Measure Joy, we curate vintage cameras and help give them another chapter. Based in Covina, California, we bring the joy of early digital and film photography to a new generation.",
  footer_location: "CURATED IN COVINA, CALIFORNIA. MADE FOR EVERYWHERE.",
};
export type StorefrontCopy = typeof storefrontDefaults;
export function resolveStorefrontCopy(
  value: Record<string, unknown>,
): StorefrontCopy {
  return Object.fromEntries(
    Object.entries(storefrontDefaults).map(([key, fallback]) => [
      key,
      typeof value[key] === "string" && value[key].trim()
        ? value[key]
        : fallback,
    ]),
  ) as StorefrontCopy;
}
