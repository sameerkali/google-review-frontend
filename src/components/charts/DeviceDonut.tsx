"use client";

import { ResponsivePie } from "@nivo/pie";
import { useChartTheme } from "@/hooks/useChartTheme";

export function DeviceDonut({ data }: { data: { _id: string; count: number }[] }) {
  const { colors, nivoTheme } = useChartTheme();
  const items = data.map((row) => ({ id: row._id || "unknown", label: row._id || "unknown", value: row.count }));

  return (
    <div style={{ height: 240 }}>
      <ResponsivePie
        data={items}
        margin={{ top: 12, right: 12, bottom: 40, left: 12 }}
        innerRadius={0.6}
        padAngle={2}
        cornerRadius={4}
        activeOuterRadiusOffset={6}
        colors={colors}
        theme={nivoTheme}
        borderWidth={0}
        enableArcLinkLabels={false}
        arcLabelsSkipAngle={20}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 3]] }}
        animate
        motionConfig="gentle"
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            translateY: 34,
            itemWidth: 70,
            itemHeight: 16,
            symbolSize: 8,
            symbolShape: "circle",
          },
        ]}
        tooltip={({ datum: d }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg">
            <span className="font-semibold capitalize">{d.label}</span>: {d.value}
          </div>
        )}
      />
    </div>
  );
}
