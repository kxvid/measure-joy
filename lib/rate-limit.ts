import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// The database transaction is the shared authority across workers/cold starts.
// Store only a digest, never a visitor's email or address, and expire buckets.
export async function consumeRateLimit(
  identity: string,
  maximum: number,
  windowSeconds = 600,
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (!identity || !Number.isSafeInteger(maximum) || maximum < 1 ||
      !Number.isSafeInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("Invalid rate limit configuration.");
  }
  const { data, error } = await createAdminClient()
    .rpc("consume_rate_limit", {
      p_key: createHash("sha256").update(identity).digest("hex"),
      p_limit: maximum,
      p_window_seconds: windowSeconds,
    })
    .abortSignal(AbortSignal.timeout(5000));
  const result = Array.isArray(data) ? data[0] : undefined;
  if (error || typeof result?.allowed !== "boolean" ||
      !Number.isSafeInteger(result?.retry_after) || result.retry_after < 0) {
    throw new Error("Request quota is unavailable.");
  }
  return { allowed: result.allowed, retryAfter: result.retry_after };
}
