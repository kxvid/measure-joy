import "server-only";
import { JWT } from "google-auth-library";
import type {
  AnalyticsReport,
  AnalyticsReportResult,
  ReportDays,
  ReportPeriod,
  ReportTotals,
} from "./analytics-report-types";

const API = "https://analyticsdata.googleapis.com/v1beta";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOTAL_METRICS = [
  "activeUsers",
  "sessions",
  "screenPageViews",
  "ecommercePurchases",
  "purchaseRevenue",
];
const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 8_000;
const cache = new Map<
  string,
  { expires: number; result: AnalyticsReportResult }
>();
const inFlight = new Map<string, Promise<AnalyticsReportResult>>();
let authClient: JWT | undefined;

export function parseReportDays(value: unknown): ReportDays | null {
  if (value === 7 || value === "7") return 7;
  if (value === 30 || value === "30") return 30;
  if (value === 90 || value === "90") return 90;
  return null;
}
export function reportingPeriod(
  days: ReportDays,
  now = new Date(),
): ReportPeriod {
  if (!parseReportDays(days)) throw new Error("Invalid report period.");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  const today = Date.UTC(
    Number(part("year")),
    Number(part("month")) - 1,
    Number(part("day")),
  );
  const date = (offset: number) =>
    new Date(today + offset * 86_400_000).toISOString().slice(0, 10);
  return {
    days,
    startDate: date(-days),
    endDate: date(-1),
    previousStartDate: date(-days * 2),
    previousEndDate: date(-days - 1),
    timeZone: "America/Los_Angeles",
  };
}

type Config = { propertyId: string; email: string; key: string };
function configuration(): Config | null {
  const propertyId = process.env.GA4_PROPERTY_ID || "";
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON || "";
  if (!/^[1-9]\d{3,14}$/.test(propertyId) || raw.length > 20_000) return null;
  try {
    const c = JSON.parse(raw);
    if (
      c.type !== "service_account" ||
      typeof c.client_email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.gserviceaccount\.com$/.test(c.client_email) ||
      typeof c.private_key !== "string" ||
      !c.private_key.startsWith("-----BEGIN PRIVATE KEY-----") ||
      !c.private_key.trim().endsWith("-----END PRIVATE KEY-----")
    )
      return null;
    // Never accept a configurable token endpoint, delegated subject or project scope.
    return { propertyId, email: c.client_email, key: c.private_key };
  } catch {
    return null;
  }
}

type Preset = {
  dimensions: string[];
  metrics: string[];
  startDate: string;
  endDate: string;
  limit: number;
  sort: string;
  ascending?: boolean;
};
export function reportPresets(period: ReportPeriod): Preset[] {
  const range = { startDate: period.startDate, endDate: period.endDate };
  return [
    {
      ...range,
      dimensions: [],
      metrics: TOTAL_METRICS,
      limit: 1,
      sort: "activeUsers",
    },
    {
      startDate: period.previousStartDate,
      endDate: period.previousEndDate,
      dimensions: [],
      metrics: TOTAL_METRICS,
      limit: 1,
      sort: "activeUsers",
    },
    {
      ...range,
      dimensions: ["date"],
      metrics: ["activeUsers", "sessions", "screenPageViews"],
      limit: 90,
      sort: "date",
      ascending: true,
    },
    {
      ...range,
      dimensions: ["sessionSourceMedium"],
      metrics: [
        "activeUsers",
        "sessions",
        "ecommercePurchases",
        "purchaseRevenue",
      ],
      limit: 10,
      sort: "sessions",
    },
    {
      ...range,
      dimensions: ["pagePath"],
      metrics: ["screenPageViews", "activeUsers"],
      limit: 10,
      sort: "screenPageViews",
    },
    {
      ...range,
      dimensions: ["itemId"],
      metrics: [
        "itemsViewed",
        "itemsAddedToCart",
        "itemsPurchased",
        "itemRevenue",
      ],
      limit: 10,
      sort: "itemsViewed",
    },
  ];
}
function reportRequest(preset: Preset) {
  return {
    dateRanges: [{ startDate: preset.startDate, endDate: preset.endDate }],
    dimensions: preset.dimensions.map((name) => ({ name })),
    metrics: preset.metrics.map((name) => ({ name })),
    dimensionFilter: {
      filter: {
        fieldName: "hostName",
        inListFilter: {
          values: ["www.measurejoy.org", "measurejoy.org"],
          caseSensitive: false,
        },
      },
    },
    orderBys: [
      {
        ...(preset.dimensions.includes(preset.sort)
          ? { dimension: { dimensionName: preset.sort } }
          : { metric: { metricName: preset.sort } }),
        desc: !preset.ascending,
      },
    ],
    limit: preset.limit,
    keepEmptyRows: false,
    returnPropertyQuota: true,
  };
}
class ReportingError extends Error {}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ReportingError(
      "Google returned an unreadable report. Please try again later.",
    );
  return value as Record<string, unknown>;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value))
    throw new ReportingError(
      "Google returned an unreadable report. Please try again later.",
    );
  return value;
}
function label(value: unknown): string {
  if (typeof value !== "string")
    throw new ReportingError(
      "Google returned an unreadable report. Please try again later.",
    );
  return value.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 180);
}
function metric(value: unknown, monetary: boolean): number {
  if (typeof value !== "string" || !/^-?\d+(?:\.\d+)?$/.test(value))
    throw new ReportingError(
      "Google returned an unreadable report. Please try again later.",
    );
  const n = Number(value);
  if (
    !Number.isFinite(n) ||
    Math.abs(n) > Number.MAX_SAFE_INTEGER ||
    (!monetary && (!Number.isInteger(n) || n < 0))
  )
    throw new ReportingError(
      "Google returned an unreadable report. Please try again later.",
    );
  return n;
}
type ParsedRow = { dimensions: string[]; values: number[] };
function parseReport(
  raw: unknown,
  preset: Preset,
  warnings: Set<string>,
): ParsedRow[] {
  const report = object(raw);
  const meta = report.metadata ? object(report.metadata) : {};
  if (meta.currencyCode && meta.currencyCode !== "USD")
    throw new ReportingError(
      "The Google property currency does not match the store. Ask the owner to check the reporting connection.",
    );
  if (
    meta.timeZone &&
    !["America/Los_Angeles", "US/Pacific"].includes(String(meta.timeZone))
  )
    throw new ReportingError(
      "The Google property time zone does not match this report. Ask the owner to check the reporting connection.",
    );
  const restriction = meta.schemaRestrictionResponse
    ? object(meta.schemaRestrictionResponse)
    : {};
  if (
    Array.isArray(restriction.activeMetricRestrictions) &&
    restriction.activeMetricRestrictions.length
  )
    throw new ReportingError(
      "Google has restricted one or more report metrics. Ask the owner to check the reporting account’s permissions.",
    );
  if (meta.subjectToThresholding)
    warnings.add(
      "Google may withhold small groups to protect visitor privacy.",
    );
  if (meta.dataLossFromOtherRow)
    warnings.add(
      "Google grouped some high-cardinality data into an “other” row.",
    );
  if (Array.isArray(meta.samplingMetadatas) && meta.samplingMetadatas.length)
    warnings.add("Google sampled some data in this report.");
  if (
    Array.isArray(meta.dataTruncationReasons) &&
    meta.dataTruncationReasons.length
  )
    warnings.add("Google truncated some report data.");
  if (meta.emptyReason)
    warnings.add(
      "Google marked at least one section as empty; newly collected data may still be processing.",
    );
  // GA4 omits headers as well as rows for an empty no-dimension totals report.
  // Accept only that verified shape, after checking its property metadata and
  // permissions; partial headers or any indication of rows remain errors.
  if (
    preset.dimensions.length === 0 &&
    report.kind === "analyticsData#runReport" &&
    report.dimensionHeaders === undefined &&
    report.metricHeaders === undefined &&
    (report.rows === undefined ||
      (Array.isArray(report.rows) && report.rows.length === 0)) &&
    (report.rowCount === undefined || report.rowCount === 0) &&
    meta.currencyCode === "USD" &&
    ["America/Los_Angeles", "US/Pacific"].includes(String(meta.timeZone))
  )
    return [];
  const headers = (value: unknown) =>
    array(value).map((x) => label(object(x).name));
  if (
    headers(report.dimensionHeaders || []).join("|") !==
      preset.dimensions.join("|") ||
    headers(report.metricHeaders).join("|") !== preset.metrics.join("|")
  )
    throw new ReportingError(
      "Google returned different report fields than expected. Please try again later.",
    );
  const rows = array(report.rows || []);
  if (rows.length > preset.limit)
    throw new ReportingError(
      "Google returned an unexpectedly large report. Please try again later.",
    );
  return rows.map((rawRow) => {
    const row = object(rawRow);
    const dims = array(row.dimensionValues || []);
    const values = array(row.metricValues);
    if (
      dims.length !== preset.dimensions.length ||
      values.length !== preset.metrics.length
    )
      throw new ReportingError(
        "Google returned an unreadable report. Please try again later.",
      );
    return {
      dimensions: dims.map((x) => label(object(x).value)),
      values: values.map((x, i) =>
        metric(object(x).value, /Revenue$/.test(preset.metrics[i])),
      ),
    };
  });
}
async function batch(
  propertyId: string,
  token: string,
  presets: Preset[],
): Promise<unknown[]> {
  const response = await fetch(
    `${API}/properties/${propertyId}:batchRunReports`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests: presets.map(reportRequest) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new ReportingError(
        "The reporting connection cannot access this Google Analytics property. Ask the owner to check its read-only access.",
      );
    if (response.status === 429)
      throw new ReportingError(
        "Google’s reporting limit has been reached. Please try again in a few minutes.",
      );
    throw new ReportingError(
      "Google Analytics is temporarily unavailable. Please try again shortly.",
    );
  }
  const text = await response.text();
  if (text.length > 1_000_000)
    throw new ReportingError(
      "Google returned an unexpectedly large report. Please try again later.",
    );
  const data = object(JSON.parse(text));
  const reports = array(data.reports);
  if (reports.length !== presets.length)
    throw new ReportingError(
      "Google returned an incomplete report. Please try again later.",
    );
  return reports;
}
function totals(rows: ParsedRow[]): ReportTotals {
  const [users = 0, sessions = 0, views = 0, purchases = 0, revenue = 0] =
    rows[0]?.values || [];
  return { users, sessions, views, purchases, revenue };
}
async function fetchReport(
  config: Config,
  period: ReportPeriod,
): Promise<AnalyticsReportResult> {
  try {
    authClient ||= new JWT({
      email: config.email,
      key: config.key,
      scopes: [SCOPE],
      transporterOptions: { timeout: TIMEOUT_MS, retry: false },
    });
    const token = (await authClient.getAccessToken()).token;
    if (!token)
      throw new ReportingError(
        "The Google reporting connection is unavailable. Ask the owner to check its configuration.",
      );
    const presets = reportPresets(period);
    // GA4 permits at most five reports in one batch. No automatic retry loop.
    const raw = [
      ...(await batch(config.propertyId, token, presets.slice(0, 5))),
      ...(await batch(config.propertyId, token, presets.slice(5))),
    ];
    const warnings = new Set<string>();
    const rows = raw.map((report, i) =>
      parseReport(report, presets[i], warnings),
    );
    const dailyMap = new Map(
      rows[2].map((row) => {
        const date = row.dimensions[0];
        if (!/^\d{8}$/.test(date))
          throw new ReportingError(
            "Google returned an unreadable date. Please try again later.",
          );
        const day = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
        const stamp = Date.parse(`${day}T00:00:00Z`);
        if (
          !Number.isFinite(stamp) ||
          new Date(stamp).toISOString().slice(0, 10) !== day ||
          day < period.startDate ||
          day > period.endDate
        )
          throw new ReportingError(
            "Google returned a date outside the selected report. Please try again later.",
          );
        return [day, row.values];
      }),
    );
    const daily = Array.from({ length: period.days }, (_, i) => {
      const date = new Date(
        Date.parse(`${period.startDate}T00:00:00Z`) + i * 86_400_000,
      )
        .toISOString()
        .slice(0, 10);
      const [users = 0, sessions = 0, views = 0] = dailyMap.get(date) || [];
      return { date, users, sessions, views };
    });
    const report: AnalyticsReport = {
      period,
      fetchedAt: new Date().toISOString(),
      currency: "USD",
      current: totals(rows[0]),
      previous: totals(rows[1]),
      daily,
      channels: rows[3].map((r) => ({
        channel: r.dimensions[0],
        users: r.values[0],
        sessions: r.values[1],
        purchases: r.values[2],
        revenue: r.values[3],
      })),
      pages: rows[4].map((r) => ({
        path: r.dimensions[0].split(/[?#]/)[0],
        views: r.values[0],
        users: r.values[1],
      })),
      products: rows[5].map((r) => ({
        itemId: r.dimensions[0],
        views: r.values[0],
        addToCarts: r.values[1],
        purchases: r.values[2],
        revenue: r.values[3],
      })),
      warnings: [...warnings],
    };
    const hasData =
      Object.values(report.current).some((value) => value !== 0) ||
      rows.slice(2).some((section) => section.length > 0);
    return { status: hasData ? "ready" : "empty", report };
  } catch (error) {
    return {
      status: "error",
      period,
      message:
        error instanceof ReportingError
          ? error.message
          : "Google Analytics could not be reached. Please try again shortly.",
    };
  }
}
export async function loadGa4Report(
  days: ReportDays,
): Promise<AnalyticsReportResult> {
  if (!parseReportDays(days)) throw new Error("Invalid report period.");
  const period = reportingPeriod(days);
  const config = configuration();
  if (!config)
    return {
      status: "not_configured",
      period,
      message:
        "Analytics reporting is not connected yet. Ask the site owner to finish the read-only Google Analytics connection.",
    };
  const key = `${config.propertyId}:${days}:${period.endDate}`;
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.result;
  const pending = inFlight.get(key);
  if (pending) return pending;
  const request = fetchReport(config, period)
    .then((result) => {
      // At most three current-day presets; never grow with arbitrary date ranges.
      for (const oldKey of cache.keys())
        if (!oldKey.endsWith(`:${period.endDate}`)) cache.delete(oldKey);
      cache.set(key, {
        result,
        expires: Date.now() + (result.status === "error" ? 30_000 : CACHE_MS),
      });
      return result;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
