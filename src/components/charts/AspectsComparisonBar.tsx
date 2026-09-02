"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@/components/ThemeProvider";
import { getCategoricalColors, getNivoTheme } from "@/lib/nivoTheme";

/* Low-rated vs high-rated mention counts, side by side per aspect — reads as
   "what's working / what isn't" rather than a complaints list, which lands
   as an attack. */
export function AspectsComparisonBar({ aspects }: { aspects: { aspect: string; lowRated: number; highRated: number }[] }) {
  const { theme } = useTheme();
  const colors = getCategoricalColors(theme);
  const data = aspects.map((a) => ({ aspect: a.aspect, "Low-rated (≤3★)": a.lowRated, "High-rated (4-5★)": a.highRated }));

  return (
    <div style={{ height: Math.max(180, aspects.length * 36 + 60) }}>
      <ResponsiveBar
        data={data}
        keys={["Low-rated (≤3★)", "High-rated (4-5★)"]}
        indexBy="aspect"
        layout="horizontal"
        groupMode="grouped"
        margin={{ top: 12, right: 20, bottom: 32, left: 90 }}
        padding={0.3}
        borderRadius={3}
        colors={[colors[1], colors[2]]}
        theme={getNivoTheme(theme)}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        enableGridY={false}
        gridXValues={4}
        animate
        motionConfig="gentle"
        legends={[
          {
            dataFrom: "keys",
            anchor: "bottom",
            direction: "row",
            translateY: 30,
            itemWidth: 150,
            itemHeight: 16,
            symbolSize: 8,
            symbolShape: "circle",
          },
        ]}
        tooltip={({ id, value, indexValue }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg">
            <span className="font-semibold capitalize">{indexValue}</span> · {id}: {value}
          </div>
        )}
      />
    </div>
  );
}
