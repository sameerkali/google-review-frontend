"use client";

import { ResponsiveRadar } from "@nivo/radar";
import { useChartTheme } from "@/hooks/useChartTheme";

/* Normalizes scan/copy/click counts to a 0–100 index relative to scans (the
   top of the funnel), plus conversion rate on its own already-percentage
   scale - so the four axes share one comparable range instead of raw
   counts of wildly different magnitude dominating the shape. */
export function EngagementRadar({
  scans, reviewCopies, googleClicks, conversionRate,
}: {
  scans: number;
  reviewCopies: number;
  googleClicks: number;
  conversionRate: number;
}) {
  const { theme, nivoTheme } = useChartTheme();
  const base = scans || 1;
  const data = [
    { metric: "Scans", index: 100 },
    { metric: "Copies", index: Math.round((reviewCopies / base) * 100) },
    { metric: "Clicks", index: Math.round((googleClicks / base) * 100) },
    { metric: "Conv %", index: Math.min(100, Math.round(conversionRate)) },
  ];
  const hue = theme === "light" ? "#2a78d6" : "#3987e5";

  return (
    <div style={{ height: 240 }}>
      <ResponsiveRadar
        data={data}
        keys={["index"]}
        indexBy="metric"
        maxValue={100}
        margin={{ top: 30, right: 55, bottom: 30, left: 55 }}
        gridLevels={4}
        gridShape="circular"
        colors={[hue]}
        theme={nivoTheme}
        fillOpacity={0.25}
        borderWidth={2}
        dotSize={6}
        dotBorderWidth={2}
        dotBorderColor={{ from: "color" }}
        enableDotLabel={false}
        animate
        motionConfig="gentle"
        isInteractive
      />
    </div>
  );
}
