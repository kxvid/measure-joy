import { NextResponse } from "next/server";
import { requireAdminRequest, readAdminJson, adminErrorResponse, AdminRequestError } from "@/lib/admin-auth";
import { reconcileInventory } from "@/lib/inventory";
import { stripe } from "@/lib/stripe";

// Authenticated, same-origin operator retry. The response contains no order,
// customer or reservation identifiers; detailed identifiers stay in server logs.
export async function POST(request: Request) {
  try {
    await requireAdminRequest(request);
    const body = await readAdminJson(request) as { productIds?: unknown };
    const ids = body.productIds;
    if (ids !== undefined && (!Array.isArray(ids) || ids.length < 1 || ids.length > 20 || ids.some(id => typeof id !== "string" || !/^prod_[A-Za-z0-9]{1,250}$/.test(id)))) {
      throw new AdminRequestError(400, "Choose up to 20 valid catalog products.");
    }
    return NextResponse.json(await reconcileInventory(stripe, ids as string[] | undefined, true), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
