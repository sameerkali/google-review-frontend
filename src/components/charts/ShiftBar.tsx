"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@/components/ThemeProvider";
import { getCategoricalColors, getNivoTheme } from "@/lib/nivoTheme";

/* Average rating per shift band - the staffing conversation an owner can't
   have from any other data he owns. Bands with too little volume are
   filtered out before this ever renders (see the lowData flag on each band). */
export function ShiftBar({ bands }: { bands: { label: string; avgRating: number | null }[] }) {
  const { theme } = useTheme();
  const colors = getCategoricalColors(theme);
  const data = bands.map((b) => ({ label: b.label, value: b.avgRating ?? 0 }));

  return (
    <div style={{ height: 200 }}>
      <ResponsiveBar
        data={data}
        keys={["value"]}
        indexBy="label"
        margin={{ top: 12, right: 12, bottom: 42, left: 40 }}
        padding={0.4}
        borderRadius={4}
        colors={colors[3]}
        theme={getNivoTheme(theme)}
        axisBottom={{ tickSize: 0, tickPadding: 8, format: (v) => String(v).split(" (")[0] }}
        axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 5 }}
        enableGridX={false}
        gridYValues={5}
        enableLabel
        label={(d) => (d.value ? Number(d.value).toFixed(1) : "—")}
        labelSkipHeight={12}
        labelTextColor={{ from: "color", modifiers: [["darker", 3]] }}
        animate
        motionConfig="gentle"
        tooltip={({ data: d }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg">
            <span className="font-semibold">{d.label}</span>: {d.value ? `${Number(d.value).toFixed(2)} avg` : "not enough data"}
          </div>
        )}
      />
    </div>
  );
}
