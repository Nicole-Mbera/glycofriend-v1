import React from "react";
import { t } from "../../i18n";

const COLORS = { green: "#2ECC71", yellow: "#F1C40F", red: "#E74C3C" };

export default function ColorBadge({ color, value, size = "medium" }) {
  const bg = COLORS[color] || "#95A5A6";
  const sizes = {
    small: { circle: 28, font: 11 },
    medium: { circle: 48, font: 14 },
    large: { circle: 88, font: 18 },
  };
  const { circle, font } = sizes[size] || sizes.medium;

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span
        style={{
          width: circle, height: circle,
          borderRadius: "50%",
          background: bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: font,
        }}
      >
        {size === "small" ? "" : t(color) || "—"}
      </span>
      {value !== undefined && (
        <span style={{ fontSize: 13, color: "#7F8C8D" }}>{value} mg/dL</span>
      )}
    </span>
  );
}
