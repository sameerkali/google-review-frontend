"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@/components/ThemeProvider";
import { getCategoricalColors, getNivoTheme } from "@/lib/nivoTheme";

export function ActivityByTypeBar({ scans, reviewCopies, googleClicks }: { scans: number; reviewCopies: number; googleClicks: number }) {
  const { theme } = useTheme();
  const colors = getCategoricalColors(theme);
  const data = [
    { type: "Scans", fullLabel: "Scans", value: scans, color: colors[0] },
    { type: "Copies", fullLabel: "Review Copies", value: reviewCopies, color: colors[1] },
    { type: "Clicks", fullLabel: "Google Clicks", value: googleClicks, color: colors[2] },
  ];

  return (
    <div style={{ height: 220 }}>
      <ResponsiveBar
        data={data}
        keys={["value"]}
        indexBy="type"
        margin={{ top: 12, right: 12, bottom: 32, left: 40 }}
        padding={0.45}
        borderRadius={4}
        colors={(d) => (d.data as { color: string }).color}
        theme={getNivoTheme(theme)}
        axisBottom={{ tickSize: 0, tickPadding: 8 }}
        axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
        enableGridX={false}
        gridYValues={4}
        enableLabel
        label={(d) => `${d.value}`}
        labelSkipHeight={16}
        labelTextColor={{ from: "color", modifiers: [["darker", 3]] }}
        animate
        motionConfig="gentle"
        isInteractive
        tooltip={({ data: d }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg">
            <span className="font-semibold">{d.fullLabel}</span>: {d.value}
          </div>
        )}
      />
    </div>
  );
}
