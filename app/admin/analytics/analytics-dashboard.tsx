import type { ReactNode } from "react";
import Link from "next/link";
import { ChartNoAxesCombined, Clock3, Info, RefreshCw } from "lucide-react";
import styles from "./analytics-dashboard.module.css";

import type { AnalyticsReport, ReportDays } from "@/lib/analytics-report-types";
import { CAMPAIGN_LINKS } from "@/lib/campaign-links";

type DailyPoint = AnalyticsReport["daily"][number];

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const currencyDifference = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  signDisplay: "exceptZero",
});
const percent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

function dateLabel(value: string, year = false) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(year ? ({ year: "numeric" } as const) : {}),
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function comparison(current: number, previous: number, money = false) {
  if (money && (current < 0 || previous < 0))
    return `${currencyDifference.format(current - previous)} vs previous ${currency.format(previous)}`;
  if (previous === 0)
    return current === 0
      ? "No change from previous period"
      : "No activity in previous period";
  const change = ((current - previous) / previous) * 100;
  return `${percent.format(change)}% from previous period`;
}

function productName(names: Record<string, string>, itemId: string) {
  const value = Object.hasOwn(names, itemId) ? names[itemId] : undefined;
  return typeof value === "string" && value.trim() ? value : undefined;
}

function Metric({
  label,
  value,
  previous,
  money = false,
}: {
  label: string;
  value: number;
  previous: number;
  money?: boolean;
}) {
  return (
    <div className={styles.metric}>
      <dt>{label}</dt>
      <dd>
        {money ? currency.format(value) : number.format(value)}
        <p className={styles.comparison}>{comparison(value, previous, money)}</p>
      </dd>
    </div>
  );
}

function Panel({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel} aria-labelledby={id}>
      <div className={styles.panelHeading}>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function ReportTable({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.tableScroll}
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      <table className={styles.table}>{children}</table>
    </div>
  );
}

function ShareLinks() {
  return (
    <Panel
      id="share-links"
      title="Share links"
      description="Select and copy a link for your profile, video description, or weekly email. These tags help identify visits from each platform."
    >
      <div className={styles.shareLinks}>
        {CAMPAIGN_LINKS.map(({ label, source, url }) => (
          <label key={source} htmlFor={`share-link-${source}`}>
            {label}
            <input
              id={`share-link-${source}`}
              type="url"
              value={url}
              readOnly
              spellCheck={false}
              aria-describedby="share-links-help"
            />
          </label>
        ))}
      </div>
      <p id="share-links-help" className={styles.shareHelp}>
        Source / medium comes from referring websites or campaign tags in your
        links. Direct / none can include visits from apps that hide the referring
        source. Visitors must allow analytics for their activity to appear in
        these reports.
      </p>
    </Panel>
  );
}

function DailyTraffic({ daily }: { daily: DailyPoint[] }) {
  const maximum = Math.max(1, ...daily.map((point) => point.sessions));
  const ceiling = maximum <= 4 ? 4 : Math.ceil(maximum / 10) * 10;
  const width = 1000,
    height = 180;
  const position = (point: DailyPoint, index: number) => ({
    x: daily.length === 1 ? width / 2 : (index / (daily.length - 1)) * width,
    y: height - (point.sessions / ceiling) * height,
  });
  const path = daily
    .map((point, index) => {
      const { x, y } = position(point, index);
      return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const labels =
    daily.length > 1
      ? [
          daily[0],
          daily[Math.floor((daily.length - 1) / 2)],
          daily[daily.length - 1],
        ]
      : daily;
  return (
    <Panel
      id="daily-traffic"
      title="Daily visits"
      description="Measured sessions by day. A person may start more than one visit."
    >
      {daily.length ? (
        <>
          <div
            className={styles.chart}
            role="img"
            aria-label={`Daily visits from ${dateLabel(daily[0].date)} through ${dateLabel(daily[daily.length - 1].date)}. Exact values are available in the daily data table below.`}
          >
            <div className={styles.yAxis} aria-hidden="true">
              <span>{number.format(ceiling)}</span>
              <span>{number.format(ceiling / 2)}</span>
              <span>0</span>
            </div>
            <div className={styles.plot}>
              <svg
                viewBox={`0 -4 ${width} ${height + 8}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {[0, height / 2, height].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2={width}
                    y2={y}
                    className={styles.chartGrid}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <path
                  d={path}
                  className={styles.chartLine}
                  vectorEffect="non-scaling-stroke"
                />
                {daily.length === 1 && (
                  <circle
                    cx={width / 2}
                    cy={position(daily[0], 0).y}
                    r="3"
                    className={styles.chartDot}
                  />
                )}
              </svg>
              <div className={styles.xAxis} aria-hidden="true">
                {labels.map((point, index) => (
                  <span key={`${point.date}-${index}`}>
                    {dateLabel(point.date)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <details className={styles.dailyDetails}>
            <summary>View daily data</summary>
            <ReportTable label="Daily traffic data">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col" className={styles.numeric}>
                    Visitors
                  </th>
                  <th scope="col" className={styles.numeric}>
                    Visits
                  </th>
                  <th scope="col" className={styles.numeric}>
                    Page views
                  </th>
                </tr>
              </thead>
              <tbody>
                {daily.map((point) => (
                  <tr key={point.date}>
                    <th scope="row">{dateLabel(point.date, true)}</th>
                    <td className={styles.numeric}>
                      {number.format(point.users)}
                    </td>
                    <td className={styles.numeric}>
                      {number.format(point.sessions)}
                    </td>
                    <td className={styles.numeric}>
                      {number.format(point.views)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ReportTable>
          </details>
        </>
      ) : (
        <p className={styles.tableEmpty}>
          No daily visits were reported for this period.
        </p>
      )}
    </Panel>
  );
}

export function ReportHeading({ days }: { days: ReportDays }) {
  return (
    <div className={styles.heading}>
      <div>
        <h1>Analytics</h1>
        <p className={styles.intro}>
          See how people find Measure Joy and explore the shop.
        </p>
      </div>
      <form action="/admin/analytics" method="get" className={styles.filter}>
        <label htmlFor="analytics-range">
          Reporting period
          <select id="analytics-range" name="days" defaultValue={String(days)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
        <button type="submit">View report</button>
      </form>
    </div>
  );
}

function PeriodNotice() {
  return (
    <div className={styles.notice} role="status">
      <Info size={18} aria-hidden="true" />
      <p>
        The reporting period wasn’t recognized. Showing the last 30 complete
        days.
      </p>
    </div>
  );
}

export function ReportUnavailable({
  days,
  configured,
  message,
  invalidPeriod = false,
}: {
  days: ReportDays;
  configured: boolean;
  message?: string;
  invalidPeriod?: boolean;
}) {
  return (
    <div className={styles.report}>
      <ReportHeading days={days} />
      {invalidPeriod && <PeriodNotice />}
      <section className={styles.state} role="status">
        <ChartNoAxesCombined size={28} aria-hidden="true" />
        <h2>
          {configured
            ? "The report couldn’t be loaded"
            : "Analytics reports aren’t connected yet"}
        </h2>
        <p>
          {message ||
            (configured
              ? "Google Analytics is temporarily unavailable. No traffic or revenue totals are available right now. Try the report again in a moment."
              : "The owner is finishing the reporting connection. Measured traffic and shopping activity will appear here when it’s ready.")}
        </p>
        {configured && (
          <a className={styles.retry} href={`/admin/analytics?days=${days}`}>
            <RefreshCw size={14} aria-hidden="true" />
            Try again
          </a>
        )}
      </section>
    </div>
  );
}

export function AnalyticsDashboard({
  report,
  productNames = {},
  invalidPeriod = false,
}: {
  report: AnalyticsReport;
  productNames?: Record<string, string>;
  invalidPeriod?: boolean;
}) {
  const empty =
    report.current.users === 0 &&
    report.current.sessions === 0 &&
    report.current.views === 0 &&
    report.current.purchases === 0 &&
    report.current.revenue === 0;
  return (
    <div className={styles.report}>
      <ReportHeading days={report.period.days} />
      {invalidPeriod && <PeriodNotice />}
      <div className={styles.context}>
        <p>
          {dateLabel(report.period.startDate, true)} –{" "}
          {dateLabel(report.period.endDate, true)}
          <br />
          Compared with {dateLabel(report.period.previousStartDate)} –{" "}
          {dateLabel(report.period.previousEndDate, true)}
        </p>
        <p>
          Updated{" "}
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: report.period.timeZone,
          }).format(new Date(report.fetchedAt))}
          <br />
          Time zone: {report.period.timeZone.replaceAll("_", " ")}
        </p>
      </div>
      {report.warnings.map((warning) => (
        <div key={warning} className={styles.notice} role="status">
          <Clock3 size={18} aria-hidden="true" />
          <p>{warning}</p>
        </div>
      ))}
      <div className={styles.notice}>
        <Info size={18} aria-hidden="true" />
        <p>
          These reports cover visitors who allow analytics. Recent activity may
          still be processing. Recorded purchases and revenue can differ from
          actual sales.{" "}
          <Link href="/admin/orders">View Stripe orders for sales totals.</Link>
        </p>
      </div>
      {empty && (
        <div className={styles.notice} role="status">
          <ChartNoAxesCombined size={18} aria-hidden="true" />
          <p>
            <strong>No activity reported for this period.</strong> This is
            Google Analytics’ current result. It does not mean the shop had no
            visitors or orders. Try a wider period or check again after
            processing.
          </p>
        </div>
      )}
      <dl className={styles.metrics}>
        <Metric
          label="Consented visitors"
          value={report.current.users}
          previous={report.previous.users}
        />
        <Metric
          label="Measured visits"
          value={report.current.sessions}
          previous={report.previous.sessions}
        />
        <Metric
          label="Recorded purchases"
          value={report.current.purchases}
          previous={report.previous.purchases}
        />
        <Metric
          label="Observed revenue"
          value={report.current.revenue}
          previous={report.previous.revenue}
          money
        />
      </dl>
      <DailyTraffic daily={report.daily} />
      <div className={styles.tableGrid}>
        <Panel
          id="acquisition-channels"
          title="Where visits come from"
          description="Sources and mediums recorded for each visit, including your campaign links."
        >
          {report.channels.length ? (
            <ReportTable label="Acquisition sources and mediums">
              <thead>
                <tr>
                  <th scope="col">Source / medium</th>
                  <th scope="col" className={styles.numeric}>
                    Visits
                  </th>
                  <th scope="col" className={styles.numeric}>
                    Purchases
                  </th>
                  <th scope="col" className={styles.numeric}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.channels.map((row) => (
                  <tr key={row.channel}>
                    <td className={styles.dimension}>{row.channel}</td>
                    <td className={styles.numeric}>
                      {number.format(row.sessions)}
                    </td>
                    <td className={styles.numeric}>
                      {number.format(row.purchases)}
                    </td>
                    <td className={styles.numeric}>
                      {currency.format(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ReportTable>
          ) : (
            <p className={styles.tableEmpty}>
              No acquisition sources were reported.
            </p>
          )}
        </Panel>
        <Panel
          id="popular-pages"
          title="Pages people visit"
          description="Page views can include repeat views by the same person. Query strings are excluded."
        >
          {report.pages.length ? (
            <ReportTable label="Page performance">
              <thead>
                <tr>
                  <th scope="col">Page</th>
                  <th scope="col" className={styles.numeric}>
                    Views
                  </th>
                  <th scope="col" className={styles.numeric}>
                    Visitors
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.pages.map((row) => (
                  <tr key={row.path}>
                    <td className={styles.dimension}>
                      {row.path === "/" ? "Homepage" : row.path}
                    </td>
                    <td className={styles.numeric}>
                      {number.format(row.views)}
                    </td>
                    <td className={styles.numeric}>
                      {number.format(row.users)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ReportTable>
          ) : (
            <p className={styles.tableEmpty}>No page views were reported.</p>
          )}
        </Panel>
      </div>
      <ShareLinks />
      <Panel
        id="product-performance"
        title="Product activity"
        description="Product views, items added to bags, and purchases observed by analytics. These are separate activity counts, not a customer-by-customer funnel."
      >
        {report.products.length ? (
          <ReportTable label="Product performance">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className={styles.numeric}>
                  Views
                </th>
                <th scope="col" className={styles.numeric}>
                  Added to bags
                </th>
                <th scope="col" className={styles.numeric}>
                  Purchased
                </th>
                <th scope="col" className={styles.numeric}>
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {report.products.map((row) => {
                const name = productName(productNames, row.itemId);
                return (
                  <tr key={row.itemId}>
                    <td className={styles.dimension}>
                      {name || row.itemId}
                      {name && <span className={styles.subtext}>{row.itemId}</span>}
                    </td>
                    <td className={styles.numeric}>{number.format(row.views)}</td>
                    <td className={styles.numeric}>
                      {number.format(row.addToCarts)}
                    </td>
                    <td className={styles.numeric}>
                      {number.format(row.purchases)}
                    </td>
                    <td className={styles.numeric}>
                      {currency.format(row.revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ReportTable>
        ) : (
          <p className={styles.tableEmpty}>
            No product activity was reported. Product events appear after
            visitors allow analytics and interact with the shop.
          </p>
        )}
      </Panel>
      <p className={styles.footnote}>
        Reports use Google Analytics data, not the full order history. Browser
        choices, blockers, and processing delays can leave activity unrecorded.
        Product revenue excludes shipping and tax.{" "}
        <Link href="/admin/orders">Orders</Link> remains the place to review
        actual payments.
      </p>
    </div>
  );
}
