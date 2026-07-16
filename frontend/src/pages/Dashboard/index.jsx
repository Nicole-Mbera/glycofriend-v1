import React, { useEffect, useState } from "react";
import { getDashboardSummary } from "../../api";
import { t } from "../../i18n";
import { Activity, Clock, Coffee, Utensils, TrendingDown, Target, Heart } from "lucide-react";
import SuggestionCard from "../../components/SuggestionCard";
import styles from "./Dashboard.module.css";

const COLOR_HEX = { green: "#2ECC71", yellow: "#F1C40F", red: "#E74C3C" };

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const LOG_META = {
  fasting: { label: "Fasting", icon: Coffee },
  pre_meal: { label: "Pre-meal", icon: Utensils },
  post_meal: { label: "Post-meal", icon: Activity }
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "var(--text-secondary)" }}>{t("loading")}</div>;

  const { currentWeek, recentLogs, activeSuggestions } = data || {};

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: 16 }}>
        <h1 className={styles.title}>Hello! 👋</h1>
        <p className={styles.subtitle}>Here is your daily health summary.</p>
      </div>

      <div className={styles.featureGrid}>
        <div className={styles.statCardDark}>
          <div className={styles.statHeader}>
            <Activity className="w-5 h-5" />
            <span className={styles.statTitle}>Weekly Average</span>
          </div>
          <div className={styles.statValue}>
            {currentWeek ? Math.round(currentWeek.averageReading) : "--"} <span style={{ fontSize: 16, fontWeight: 500 }}>mg/dL</span>
          </div>
          <p className={styles.statDesc}>Your blood glucose is well managed.</p>
        </div>

        <div className={styles.statCardLight}>
          <div className={styles.statHeader}>
            <Target className="w-5 h-5" style={{ color: "var(--color-green)" }} />
            <span className={styles.statTitle} style={{ color: "var(--text-secondary)" }}>Status</span>
          </div>
          <div className={styles.statValue} style={{ color: currentWeek?.colorBadge ? COLOR_HEX[currentWeek.colorBadge] : "var(--text-primary)" }}>
            {currentWeek?.colorBadge ? currentWeek.colorBadge.toUpperCase() : "N/A"}
          </div>
          <p className={styles.statDesc} style={{ color: "var(--text-secondary)" }}>Based on your last 7 days.</p>
        </div>

        <div className={styles.statCardLight}>
          <div className={styles.statHeader}>
            <Heart className="w-5 h-5" style={{ color: "#E74C3C" }} />
            <span className={styles.statTitle} style={{ color: "var(--text-secondary)" }}>Insights</span>
          </div>
          <div className={styles.statValue} style={{ color: "var(--text-primary)" }}>
            {recentLogs?.length || 0}
          </div>
          <p className={styles.statDesc} style={{ color: "var(--text-secondary)" }}>Logs recorded this week.</p>
        </div>
      </div>

      {activeSuggestions && activeSuggestions.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 className={styles.sectionTitle}>Recommendations</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeSuggestions.map((s) => <SuggestionCard key={s.id} suggestion={s} />)}
          </div>
        </div>
      )}

      <div>
        <h2 className={styles.sectionTitle}>Recent Readings</h2>
        {recentLogs && recentLogs.length > 0 ? (
          <div className={styles.logList}>
            {recentLogs.map((log) => {
              const meta = LOG_META[log.logType];
              const Icon = meta.icon;
              return (
                <div key={log.id} className={styles.logRow}>
                  <div className={styles.logInfo}>
                    <div className={styles.logIcon} style={{ background: "rgba(52, 199, 89, 0.1)", color: "var(--color-green)" }}>
                      <Icon size={24} />
                    </div>
                    <div className={styles.logMeta}>
                      <span className={styles.logType}>{meta.label}</span>
                      <span className={styles.logTime}>
                        <Clock size={14} /> {formatDay(log.loggedAt)} at {formatTime(log.loggedAt)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.logValueBox}>
                    <span className={styles.logValue}>{Math.round(log.readingMgdl)}</span>
                    <span className={styles.statusDot} style={{ background: COLOR_HEX[log.color] }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>No logs recorded yet.</p>
        )}
      </div>
    </div>
  );
}
