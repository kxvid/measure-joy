export type ReportDays = 7 | 30 | 90;
export type ReportPeriod = {
  days: ReportDays;
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  timeZone: "America/Los_Angeles";
};
export type ReportTotals = {
  users: number;
  sessions: number;
  views: number;
  purchases: number;
  revenue: number;
};
export type AnalyticsReport = {
  period: ReportPeriod;
  fetchedAt: string;
  currency: "USD";
  current: ReportTotals;
  previous: ReportTotals;
  daily: Array<{
    date: string;
    users: number;
    sessions: number;
    views: number;
  }>;
  channels: Array<{
    channel: string;
    users: number;
    sessions: number;
    purchases: number;
    revenue: number;
  }>;
  pages: Array<{ path: string; views: number; users: number }>;
  products: Array<{
    itemId: string;
    views: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
  }>;
  warnings: string[];
};
export type AnalyticsReportResult =
  | { status: "ready" | "empty"; report: AnalyticsReport }
  | {
      status: "not_configured" | "error";
      period: ReportPeriod;
      message: string;
    };
