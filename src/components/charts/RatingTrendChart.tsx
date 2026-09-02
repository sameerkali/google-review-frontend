"use client";

import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "@/components/ThemeProvider";
import { getCategoricalColors, getNivoTheme } from "@/lib/nivoTheme";

export interface RatingPoint {
  date: string; // YYYY-MM-DD
  avg: number | null;
  rolling7d: number | null;
}

/* Daily average rating with a 7-day rolling average overlaid, so a single
   bad day doesn't read as a collapse. Points with no ratings that day are
   left as gaps (null), not zeroes — zero would misrepresent "no data" as
   "rated zero stars." */
export function RatingTrendChart({ points }: { points: RatingPoint[] }) {
  const { theme } = useTheme();
  const colors = getCategoricalColors(theme);

  const series = [
    { id: "Daily average", data: points.map((p) => ({ x: p.date, y: p.avg })) },
    { id: "7-day average", data: points.map((p) => ({ x: p.date, y: p.rolling7d })) },
  ];

  return (
    <div style={{ height: 260 }}>
      <ResponsiveLine
        data={series}
        margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 1, max: 5 }}
        colors={colors}
        theme={getNivoTheme(theme)}
        pointSize={6}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointColor={theme === "light" ? "#ffffff" : "#18181b"}
        enableArea={false}
        useMesh
        curve="monotoneX"
        axisBottom={{ tickSize: 0, tickPadding: 8, tickValues: Math.min(6, points.length), format: (v) => String(v).slice(5) }}
        axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
        enableGridX={false}
        gridYValues={4}
        animate
        motionConfig="gentle"
        legends={[
          {
            anchor: "top-left",
            direction: "row",
            translateY: -18,
            itemWidth: 110,
            itemHeight: 16,
            symbolSize: 8,
            symbolShape: "circle",
          },
        ]}
        tooltip={({ point }) => (
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg">
            <span className="font-semibold">{String(point.data.x)}</span> · {point.seriesId}: {point.data.y == null ? "—" : Number(point.data.y).toFixed(1)}
          </div>
        )}
      />
    </div>
  );
}
