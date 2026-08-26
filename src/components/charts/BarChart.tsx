"use client";

import { BarRow } from "./BarRow";

export interface BarChartDatum {
  label: string;
  value: number;
  /** Omit for a single-series magnitude chart (one hue, all bars share it —
      identity isn't in play, only comparing size). Provide per-item for a
      categorical chart where each bar is its own thing. */
  color?: string;
}

/* A small horizontal bar chart. Categorical (color per bar) needs no legend
   box here — every bar already carries its own text label, so identity is
   never color-alone. Magnitude (single hue) needs no legend either — a lone
   series names itself via the chart title. */
export function BarChart({ data, unit = "var(--chart-series-1)" }: { data: BarChartDatum[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <BarRow key={d.label} label={d.label} value={d.value} fraction={d.value / max} color={d.color ?? unit} />
      ))}
    </div>
  );
}
