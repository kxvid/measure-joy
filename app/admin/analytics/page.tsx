import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/app/actions/auth-admin";
import { getAdminAnalytics } from "@/lib/admin-analytics";
import { AdminRequestError } from "@/lib/admin-auth";
import { getStripeProducts } from "@/lib/stripe-products";
import type {
  AnalyticsReportResult,
  ReportDays,
} from "@/lib/analytics-report-types";
import { AnalyticsDashboard, ReportUnavailable } from "./analytics-dashboard";

export const metadata = {
  title: "Analytics reports",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>;
}) {
  // Authorize before reading the report or calling any analytics provider.
  if (!(await checkAdminAccess())) redirect("/");
  const { days: requestedDays } = await searchParams;
  const days: ReportDays =
    requestedDays === "7" ? 7 : requestedDays === "90" ? 90 : 30;
  const invalidPeriod =
    requestedDays !== undefined &&
    !["7", "30", "90"].includes(
      typeof requestedDays === "string" ? requestedDays : "",
    );
  let result: AnalyticsReportResult;
  try {
    result = await getAdminAnalytics(days);
  } catch (error) {
    if (
      error instanceof AdminRequestError &&
      (error.status === 401 || error.status === 403)
    )
      redirect("/");
    throw error;
  }
  if ("report" in result) {
    const productNames: Record<string, string> = {};
    if (result.report.products.length) {
      try {
        const reportedIds = new Set(
          result.report.products.map((product) => product.itemId),
        );
        for (const product of await getStripeProducts()) {
          if (reportedIds.has(product.id))
            productNames[product.id] = product.name;
        }
      } catch {
        /* Product IDs remain usable when the optional name lookup fails. */
      }
    }
    return (
      <AnalyticsDashboard
        report={result.report}
        productNames={productNames}
        invalidPeriod={invalidPeriod}
      />
    );
  }
  return (
    <ReportUnavailable
      days={days}
      configured={result.status !== "not_configured"}
      message={result.message}
      invalidPeriod={invalidPeriod}
    />
  );
}
