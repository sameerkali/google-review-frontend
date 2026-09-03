"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@/components/ThemeProvider";
import { getNivoTheme } from "@/lib/nivoTheme";

/* A single-hue horizontal bar chart - magnitude comparison across browsers,
   not identity, so one hue is correct (per the dataviz skill's form
   heuristic); the label on each row already names it directly. */
export function BrowserBar({ data }: { data: { _id: string; count: number }[] }) {
  const { theme } = useTheme();
  const hue = theme === "light" ? "#2a78d6" : "#3987e5";
  const items = data.map((row) => ({ browser: row._id || "unknown", value: row.count }));

  return (
    <div style={{ height: 220 }}>
      <ResponsiveBar
        data={items}
        keys={["value"]}
        indexBy="browser"
        layout="horizontal"
        margin={{ top: 8, right: 24, bottom: 24, left: 70 }}
        padding={0.4}
        borderRadius={4}
        colors={hue}
        theme={getNivoTheme(theme)}
        axisBottom={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        enableGridY={false}
        gridXValues={4}
        enableLabel
        label={(d) => `${d.value}`}
        labelPosition="end"
        labelOffset={6}
        labelTextColor={theme === "light" ? "#3f3f46" : "#d4d4d8"}
        animate
        motionConfig="gentle"
        tooltip={({ data: d }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg capitalize">
            <span className="font-semibold">{d.browser}</span>: {d.value}
          </div>
        )}
      />
    </div>
  );
}
