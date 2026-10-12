import Stripe from "stripe";
import { z } from "zod";
import {
  AdminRequestError,
  adminErrorResponse,
  readAdminJson,
  requireAdminRequest,
} from "@/lib/admin-auth";

const categorySchema = z.object({
  productId: z
    .string()
    .regex(/^prod_[a-zA-Z0-9]+$/)
    .max(255),
  category: z.enum(["camera", "accessory"]),
  subcategory: z
    .enum([
      "memory",
      "power",
      "case",
      "strap",
      "tripod",
      "cleaning",
      "protection",
      "cable",
      "film",
      "other",
      "",
    ])
    .optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdminRequest(request);
    const parsed = categorySchema.safeParse(await readAdminJson(request));
    if (!parsed.success)
      throw new AdminRequestError(
        400,
        "Select a valid product, category, and subcategory.",
      );
    const { productId, category, subcategory } = parsed.data;
    if (!process.env.STRIPE_SECRET_KEY)
      throw new AdminRequestError(
        503,
        "Catalog updates are temporarily unavailable.",
      );
    await new Stripe(process.env.STRIPE_SECRET_KEY).products.update(productId, {
      metadata: {
        category,
        subcategory: category === "camera" ? "" : subcategory || "",
        categorized_by_llm: "false",
        categorized_at: new Date().toISOString(),
      },
    });
    return Response.json(
      {
        success: true,
        productId,
        category,
        subcategory: category === "camera" ? null : subcategory || null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
