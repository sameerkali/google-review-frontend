"use client";

import { ResponsiveRadialBar } from "@nivo/radial-bar";
import { useChartTheme } from "@/hooks/useChartTheme";

export function OsRadialBar({ data }: { data: { _id: string; count: number }[] }) {
  const { theme, colors, nivoTheme } = useChartTheme();
  const series = data.map((row) => ({
    id: row._id || "unknown",
    data: [{ x: row._id || "unknown", y: row.count }],
  }));

  return (
    <div style={{ height: 220 }}>
      <ResponsiveRadialBar
        data={series}
        margin={{ top: 12, right: 12, bottom: 40, left: 12 }}
        padding={0.35}
        cornerRadius={4}
        colors={colors}
        theme={nivoTheme}
        enableTracks
        tracksColor={theme === "light" ? "#f4f4f5" : "#27272a"}
        radialAxisStart={null}
        circularAxisOuter={{ tickSize: 0, tickPadding: 8 }}
        animate
        motionConfig="gentle"
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            translateY: 30,
            itemWidth: 70,
            itemHeight: 14,
            symbolSize: 8,
            symbolShape: "circle",
          },
        ]}
        tooltip={({ bar }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg capitalize">
            <span className="font-semibold">{bar.category}</span>: {bar.value}
          </div>
        )}
      />
    </div>
  );
}
