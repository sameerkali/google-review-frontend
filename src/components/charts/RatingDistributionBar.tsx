"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@/components/ThemeProvider";
import { getCategoricalColors, getNivoTheme } from "@/lib/nivoTheme";

/* Count per star, 1 to 5. The single most useful Basic widget - a 4.6
   average with a bimodal distribution is a different business than a 4.6
   with everything clustered at 4-5, and the average alone can't show that. */
export function RatingDistributionBar({ distribution }: { distribution: Record<string, number> }) {
  const { theme } = useTheme();
  const colors = getCategoricalColors(theme);
  const data = [1, 2, 3, 4, 5].map((star) => ({ star: `${star}★`, value: distribution[star] || 0 }));

  return (
    <div style={{ height: 220 }}>
      <ResponsiveBar
        data={data}
        keys={["value"]}
        indexBy="star"
        margin={{ top: 12, right: 12, bottom: 32, left: 40 }}
        padding={0.4}
        borderRadius={4}
        colors={colors[0]}
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
        tooltip={({ data: d }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg">
            <span className="font-semibold">{d.star}</span>: {d.value}
          </div>
        )}
      />
    </div>
  );
}
