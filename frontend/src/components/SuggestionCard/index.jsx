import React from "react";
import { lang } from "../../i18n";

export default function SuggestionCard({ suggestion }) {
  const text = suggestion?.suggestion?.[lang] ?? suggestion?.suggestion?.en ?? "";
  if (!text) return null;
  return (
    <div style={{
      background: "rgba(255, 204, 0, 0.1)",
      border: "1px solid rgba(255, 204, 0, 0.3)",
      borderRadius: "var(--radius-md)",
      padding: "16px",
      marginTop: "16px",
      boxShadow: "var(--shadow-sm)"
    }}>
      <p style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}
