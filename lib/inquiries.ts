import "server-only";

import { createHash } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rate-limit";

// Keep delivery routing on the server. Never accept a recipient from a public form.
const INQUIRY_RECIPIENT = "christianvelasquez363@gmail.com";
const MAX_BODY_BYTES = 16_384;
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
      error: "Please agree to being contacted about this request.",
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

// Durable quota shared by every form type, instance and cold start.
export async function limitFormAttempts(identity: string, maximum = 5) {
  let result;
  try {
    result = await consumeRateLimit(`forms:${identity}`, maximum);
  } catch {
    throw new FormError(503, "Requests are temporarily unavailable. Please try again shortly.");
  }
  if (!result.allowed)
    throw new FormError(
      429,
      "Too many requests. Please wait a few minutes before trying again.",
      undefined,
      Math.max(1, result.retryAfter),
    );
}

export async function readPublicForm<T extends z.ZodType<{ email: string; website?: string }>>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  // Reject cross-site/media/body violations before touching the shared quota.
  const raw = await readJson(request);
  // Vercel supplies this trusted client address. Never trust an arbitrary forwarded header.
  const trustedIp =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim()
      : null;
  if (trustedIp) await limitFormAttempts(`ip:${trustedIp}`);
  else if (process.env.VERCEL === "1")
    throw new FormError(503, "Requests are temporarily unavailable. Please try again shortly.");
  const parsed = schema.safeParse(raw);
  if (!parsed.success)
    throw new FormError(
      400,
      "Please check the form and try again.",
      parsed.error.flatten().fieldErrors,
    );
  if (parsed.data.website?.trim())
    throw new FormError(400, "This submission could not be accepted.");
  await limitFormAttempts(`email:${parsed.data.email}`);
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
  kind: "subscription" | "review";
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
  return sendFormSubmission({
    kind: "Contact inquiry",
    sourcePage: "https://www.measurejoy.org/contact",
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
  return sendFormSubmission({
    kind: "Service inquiry",
    sourcePage: "https://www.measurejoy.org/repair",
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

const FORM_CANONICAL_URL = "https://www.measurejoy.org/";
// FormSubmit returns this explicit setup state as success:"false", even after
// requesting activation. Other negative responses must remain failures.
const FORM_ACTIVATION_MESSAGE =
  "This form needs Activation. We've sent you an email containing an 'Activate Form' link. Just click it and your form will be actived!";

async function sendFormSubmission({
  kind,
  sourcePage,
  token,
  replyTo,
  subject,
  fields,
}: Omit<Notification, "kind"> & { kind: string; sourcePage: string }): Promise<{
  status: "accepted" | "activation_pending";
}> {
  try {
    const response = await fetch(
      `https://formsubmit.co/ajax/${INQUIRY_RECIPIENT}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Referer: FORM_CANONICAL_URL,
        },
        // These are plain form fields, never a caller-supplied HTML template.
        // Both forms share one activation URL; their page is only message content.
        body: JSON.stringify({
          ...Object.fromEntries(fields),
          "Request kind": kind,
          "Source page": sourcePage,
          // FormSubmit documents no idempotency guarantee. This is a reference
          // for recognizing retries, not a promise of duplicate suppression.
          "Request reference": token,
          email: replyTo,
          _replyto: replyTo,
          _subject: subject,
          _template: "table",
          _url: FORM_CANONICAL_URL,
          // Public routes already enforce origin, validation, honeypot and limits.
          _captcha: "false",
        }),
        signal: AbortSignal.timeout(12_000),
        redirect: "error",
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error("Submission rejected");
    // Its AJAX endpoint can return valid JSON with a text/html content type.
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || Array.isArray(result))
      throw new Error("Invalid submission response");
    const { success, message } = result as Record<string, unknown>;
    if (typeof message !== "string" || !message.trim())
      throw new Error("Invalid submission response");
    if (
      (success === "false" || success === false) &&
      message.trim() === FORM_ACTIVATION_MESSAGE
    ) {
      return { status: "activation_pending" };
    }
    if (success !== "true" && success !== true)
      throw new Error("Submission rejected");
    return { status: "accepted" };
  } catch {
    // Do not expose provider responses, connection errors or customer content.
    throw new FormError(
      502,
      "We couldn't confirm your request was accepted. Please try again later.",
    );
  }
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
