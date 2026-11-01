/** Only Stripe's hosted checkout or our exact resumed-session status page may receive navigation. */
export function checkoutRedirectUrl(value: string, currentOrigin: string): string | null {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value) || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const destination = new URL(value);
    if (destination.username || destination.password) return null;
    if (destination.origin === "https://checkout.stripe.com") return destination.href;

    const site = new URL(currentOrigin);
    if (!["https:", "http:"].includes(site.protocol) || destination.origin !== site.origin ||
        destination.pathname !== "/checkout/return" || destination.hash) return null;
    const parameters = Array.from(destination.searchParams.entries());
    if (parameters.length !== 1 || parameters[0][0] !== "session_id" ||
        !/^cs_(?:test_|live_)?[A-Za-z0-9_]{1,200}$/.test(parameters[0][1])) return null;
    return destination.href;
  } catch {
    return null;
  }
}
