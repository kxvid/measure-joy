import { getAdminAnalytics } from "@/lib/admin-analytics";
import { adminErrorResponse } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const days = query.getAll("days");
    const result = await getAdminAnalytics(
      days.length > 1 ? null : (days[0] ?? 30),
    );
    return Response.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
