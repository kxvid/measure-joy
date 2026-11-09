const SHOP_URL = "https://www.measurejoy.org/shop";

// Fixed, non-personal campaign tags keep shared links consistent across reports.
const campaigns = [
  { label: "Instagram", source: "instagram", medium: "social", campaign: "profile", content: "bio" },
  { label: "TikTok", source: "tiktok", medium: "social", campaign: "profile", content: "bio" },
  { label: "Facebook", source: "facebook", medium: "social", campaign: "profile", content: "bio" },
  { label: "YouTube", source: "youtube", medium: "social", campaign: "profile", content: "description" },
  { label: "Newsletter", source: "newsletter", medium: "email", campaign: "weekly_drop", content: "email_link" },
] as const;

export const CAMPAIGN_LINKS = campaigns.map(({ label, source, medium, campaign, content }) => {
  const url = new URL(SHOP_URL);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", content);
  return { label, source, url: url.toString() };
});
