import "server-only";

import { createHash } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";

// Keep delivery routing on the server. Never accept a recipient from a public form.
const INQUIRY_RECIPIENT = "christianvelasquez363@gmail.com";
const MAX_BODY_BYTES = 16_384;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; expires: number }>();
const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      (value) => !/[\r\n\x00-\x1f\x7f]/.test(value),
      "Use a single line of text.",
    );
const email = z
  .string()
  .trim()
  .max(254)
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());
const formFields = {
  email,
  requestToken: z.string().uuid("Please refresh the form and try again."),
  website: z.string().max(200).optional().default(""),
};

export const contactSchema = z.object({
  ...formFields,
  name: singleLine(100),
  topic: singleLine(120),
  message: z
    .string()
    .trim()
    .min(10, "Please enter at least 10 characters.")
    .max(5000),
});

export const repairSchema = z
  .object({
    ...formFields,
    name: singleLine(100),
    service: z.enum(["repair", "restoration", "cleaning", "film-dev", "quote"]),
    brand: singleLine(80),
    model: singleLine(120),
    issues: z.array(singleLine(100)).max(12).default([]),
    description: z
      .string()
      .trim()
      .min(10, "Please describe your request in at least 10 characters.")
      .max(5000),
    phone: z
      .string()
      .trim()
      .max(40)
      .regex(/^[+\d\s().-]*$/, "Enter a valid phone number.")
      .optional()
      .default(""),
    preferredContact: z.enum(["email", "phone"]),
    consent: z.literal(true, {
      errorMap: () => ({
        message: "Please agree to being contacted about this request.",
      }),
    }),
  })
  .superRefine((data, context) => {
    if (
      data.preferredContact === "phone" &&
      data.phone.replace(/\D/g, "").length < 7
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Enter a phone number so we can call you.",
      });
    }
  });

export const subscriptionSchema = z.object({
  ...formFields,
  // Older newsletter clients have no token. Their stable payload hash still makes retries safe.
  requestToken: formFields.requestToken.optional(),
  source: z.enum(["newsletter", "welcome_popup"]).default("newsletter"),
});

export const reviewSchema = z.object({
  productId: singleLine(200).refine(
    (value) => /^[\w-]+$/.test(value),
    "Invalid product.",
  ),
  rating: z.number().int().min(1).max(5),
  title: singleLine(160),
  content: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters.")
    .max(5000),
});

export class FormError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string[] | undefined>,
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "FormError";
  }
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function formResponse(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export function formErrorResponse(
  error: unknown,
  extra: Record<string, unknown> = {},
) {
  if (error instanceof FormError) {
    return formResponse(
      {
        success: false,
        error: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        ...extra,
      },
      error.status,
      error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {},
    );
  }
  // Log no customer content, credentials, or upstream response bodies.
  console.error("[Public forms] An unexpected submission error occurred.");
  return formResponse(
    {
      success: false,
      error: "We couldn't send your request. Please try again.",
      ...extra,
    },
    500,
  );
}

function allowedOrigins(request: Request) {
  const origins = new Set([new URL(request.url).origin]);
  for (const configured of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (!configured) continue;
    try {
      origins.add(
        new URL(
          configured.includes("://") ? configured : `https://${configured}`,
        ).origin,
      );
    } catch {
      /* Ignore invalid optional configuration. */
    }
  }
  return origins;
}

async function readJson(request: Request): Promise<unknown> {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    !allowedOrigins(request).has(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new FormError(
      403,
      "Please submit this form from the Measure Joy website.",
    );
  }
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    throw new FormError(415, "Please submit this form as JSON.");
  }
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    throw new FormError(
      413,
      "Your message is too long. Please shorten it and try again.",
    );
  if (!request.body) throw new FormError(400, "Please complete the form.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new FormError(
          413,
          "Your message is too long. Please shorten it and try again.",
        );
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof FormError) throw error;
    throw new FormError(
      400,
      "We couldn't read this submission. Please try again.",
    );
  } finally {
    reader.releaseLock();
  }
}

// Best-effort per-process abuse control. Provider idempotency also works across instances.
// A deployment firewall is still needed for distributed bot attacks; this is not a global quota.
export function limitFormAttempts(identity: string, maximum = 5) {
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.expires <= now) attempts.delete(key);
  const key = digest(identity);
  const current = attempts.get(key);
  if (current && current.count >= maximum)
    throw new FormError(
      429,
      "Too many requests. Please wait a few minutes before trying again.",
      undefined,
      Math.ceil((current.expires - now) / 1000),
    );
  if (!current && attempts.size >= 10_000)
    throw new FormError(
      429,
      "We're receiving many requests. Please try again in a few minutes.",
      undefined,
      60,
    );
  attempts.set(key, {
    count: (current?.count ?? 0) + 1,
    expires: current?.expires ?? now + WINDOW_MS,
  });
}

export async function readPublicForm<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  // Vercel supplies this trusted client address. Never trust an arbitrary forwarded header.
  const trustedIp =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim()
      : null;
  if (trustedIp) limitFormAttempts(`ip:${trustedIp}`);
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success)
    throw new FormError(
      400,
      "Please check the form and try again.",
      parsed.error.flatten().fieldErrors,
    );
  if (parsed.data.website?.trim())
    throw new FormError(400, "This submission could not be accepted.");
  limitFormAttempts(`email:${parsed.data.email}`);
  return parsed.data;
}

export function requireEmailDelivery() {
  if (!process.env.RESEND_API_KEY?.trim())
    throw new FormError(
      503,
      "Email delivery is temporarily unavailable. Please try again later.",
    );
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

type Notification = {
  kind: "contact" | "repair" | "subscription" | "review";
  token: string;
  replyTo: string;
  subject: string;
  fields: Array<[string, string]>;
};

export async function sendInquiryNotification({
  kind,
  token,
  replyTo,
  subject,
  fields,
}: Notification) {
  requireEmailDelivery();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const text = fields
    .map(([label, value]) => `${label}:\n${value || "Not provided"}`)
    .join("\n\n");
  const html = `<h1>${escapeHtml(subject)}</h1>${fields.map(([label, value]) => `<h2>${escapeHtml(label)}</h2><p style="white-space:pre-wrap">${escapeHtml(value || "Not provided")}</p>`).join("")}`;
  const options = {
    idempotencyKey: `measurejoy-${kind}-${digest(token)}`,
    signal: AbortSignal.timeout(12_000),
  };
  const result = await resend.emails.send(
    {
      from:
        process.env.RESEND_FROM_EMAIL?.trim() ||
        "Measure Joy <orders@measurejoy.org>",
      to: [INQUIRY_RECIPIENT],
      replyTo,
      subject,
      text,
      html,
    },
    options,
  );
  if (result.error || !result.data?.id) {
    if (result.error?.statusCode === 409)
      throw new FormError(
        409,
        "This submission changed after it was sent. Please start a new request.",
      );
    throw new FormError(
      502,
      "We couldn't confirm email delivery. Please retry the same submission.",
    );
  }
}

export async function sendContact(data: z.infer<typeof contactSchema>) {
  await sendInquiryNotification({
    kind: "contact",
    token: data.requestToken,
    replyTo: data.email,
    subject: `Measure Joy contact: ${data.topic}`,
    fields: [
      ["Name", data.name],
      ["Email", data.email],
      ["Topic", data.topic],
      ["Message", data.message],
    ],
  });
}

export async function sendRepair(data: z.infer<typeof repairSchema>) {
  await sendInquiryNotification({
    kind: "repair",
    token: data.requestToken,
    replyTo: data.email,
    subject: `Measure Joy ${data.service}: ${data.brand} ${data.model}`,
    fields: [
      ["Service", data.service],
      ["Camera brand", data.brand],
      ["Camera model", data.model],
      ["Issues", data.issues.join(", ")],
      ["Description", data.description],
      ["Name", data.name],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Preferred contact", data.preferredContact],
      ["Permission to contact", "Yes"],
    ],
  });
}

export function subscriptionToken(data: z.infer<typeof subscriptionSchema>) {
  return data.requestToken || digest(`${data.email}:${data.source}`);
}

export async function sendSubscriptionWelcome(
  emailAddress: string,
  token: string,
) {
  requireEmailDelivery();
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
    {
      from:
        process.env.RESEND_FROM_EMAIL?.trim() ||
        "Measure Joy <orders@measurejoy.org>",
      to: [emailAddress],
      subject: "Welcome to Measure Joy",
      text: "You're on the Measure Joy list. We'll share camera drops and shop news. Browse cameras at https://measurejoy.org/shop. To unsubscribe, reply to this email.",
      html: '<h1>Welcome to Measure Joy</h1><p>You’re on the list. We’ll share camera drops and shop news.</p><p><a href="https://measurejoy.org/shop">Browse cameras</a></p><p>To unsubscribe, reply to this email.</p>',
      replyTo: INQUIRY_RECIPIENT,
    },
    { idempotencyKey: `measurejoy-welcome-${digest(token)}` },
  );
  return !result.error && Boolean(result.data?.id);
}
