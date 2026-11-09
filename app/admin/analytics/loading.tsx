import { ChartNoAxesCombined } from "lucide-react";
import styles from "./analytics-dashboard.module.css";

export default function AnalyticsLoading() {
  return (
    <div className={styles.report}>
      <section
        className={styles.state}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <ChartNoAxesCombined size={28} aria-hidden="true" />
        <h2>Loading analytics report</h2>
        <p>Reading the latest available traffic and shopping activity.</p>
      </section>
    </div>
  );
}
