import React, { useEffect, useState } from "react";
import { getDashboardSummary } from "../../api";
import { t } from "../../i18n";
import TrendChart from "../../components/TrendChart";
import styles from "./Analytics.module.css";

const COLOR_HEX = { green: "#2ECC71", yellow: "#F1C40F", red: "#E74C3C" };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--text-secondary)" }}>{t("loading")}</div>;

  const { trendData, weeksHistory, currentWeek } = data || {};

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.subtitle}>Your glucose trends over time</p>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {currentWeek ? Math.round(currentWeek.averageReading) : "--"}
          </span>
          <span className={styles.statLabel}>Avg This Week</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: currentWeek?.colorBadge ? COLOR_HEX[currentWeek.colorBadge] : "inherit" }}>
            {currentWeek?.colorBadge ? currentWeek.colorBadge.toUpperCase() : "N/A"}
          </span>
          <span className={styles.statLabel}>Status</span>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>{t("trend")}</h2>
        <TrendChart data={trendData} />
      </div>

      {weeksHistory && weeksHistory.length > 0 && (
        <div className={styles.chartCard}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>{t("last4Weeks")}</h2>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            {[...weeksHistory].reverse().map((w) => (
              <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: COLOR_HEX[w.colorBadge] || "#ccc",
                  boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.1)"
                }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                  {new Date(w.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
