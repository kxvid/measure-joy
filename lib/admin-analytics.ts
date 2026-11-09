import "server-only";
import { getAdminStatus } from "@/app/actions/auth-admin";
import { AdminRequestError } from "./admin-auth";
import { loadGa4Report, parseReportDays } from "./ga4-reporting";

/** Authorize every read, including reads satisfied by the shared server cache. */
export async function getAdminAnalytics(days: unknown = 30) {
  const status = await getAdminStatus();
  if (!status.isSignedIn) throw new AdminRequestError(401, "Sign in required.");
  if (!status.isAdmin)
    throw new AdminRequestError(403, "Administrator access required.");
  const range = parseReportDays(days);
  if (!range)
    throw new AdminRequestError(400, "Choose a 7, 30, or 90 day report.");
  return loadGa4Report(range);
}
