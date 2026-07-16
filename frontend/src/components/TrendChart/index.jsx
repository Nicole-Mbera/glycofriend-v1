import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

export default function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: "#95A5A6", fontSize: 14, textAlign: "center", padding: "20px 0" }}>No trend data yet.</p>;
  }

  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    avg: d.avg,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#95A5A6" }} />
        <YAxis tick={{ fontSize: 11, fill: "#95A5A6" }} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 13, border: "1px solid #ECF0F1" }}
          formatter={(v) => [`${v} mg/dL`, "Avg"]}
        />
        <ReferenceLine y={126} stroke="#E74C3C" strokeDasharray="4 4" strokeWidth={1} />
        <ReferenceLine y={100} stroke="#F1C40F" strokeDasharray="4 4" strokeWidth={1} />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#2ECC71"
          strokeWidth={2.5}
          dot={{ fill: "#2ECC71", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
