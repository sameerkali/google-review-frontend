"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useChartTheme } from "@/hooks/useChartTheme";

const WEEKDAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* Scans by hour of day, or by day of week - same shape either way (an
   index + a count). Used for "when do people scan" placement questions. */
export function TimingBar({ data, mode }: { data: { key: number; scans: number }[]; mode: "hour" | "weekday" }) {
  const { colors, nivoTheme } = useChartTheme();
  const rows = data.map((d) => ({ label: mode === "hour" ? `${d.key}h` : WEEKDAY_LABEL[d.key], value: d.scans }));

  return (
    <div style={{ height: 220 }}>
      <ResponsiveBar
        data={rows}
        keys={["value"]}
        indexBy="label"
        margin={{ top: 12, right: 12, bottom: 32, left: 40 }}
        padding={mode === "hour" ? 0.25 : 0.4}
        borderRadius={3}
        colors={colors[1]}
        theme={nivoTheme}
        axisBottom={{ tickSize: 0, tickPadding: 8, tickValues: mode === "hour" ? rows.filter((_, i) => i % 3 === 0).map((r) => r.label) : undefined }}
        axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
        enableGridX={false}
        gridYValues={4}
        enableLabel={false}
        animate
        motionConfig="gentle"
        tooltip={({ data: d }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg">
            <span className="font-semibold">{d.label}</span>: {d.value} scan{d.value === 1 ? "" : "s"}
          </div>
        )}
      />
    </div>
  );
}
