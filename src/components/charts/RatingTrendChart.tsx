"use client";

import { ResponsiveLine } from "@nivo/line";
import { useChartTheme } from "@/hooks/useChartTheme";

export interface RatingPoint {
  date: string; // YYYY-MM-DD
  avg: number | null;
  rolling7d: number | null;
}

/* Daily average rating with a 7-day rolling average overlaid, so a single
   bad day doesn't read as a collapse. Points with no ratings that day are
   left as gaps (null), not zeroes - zero would misrepresent "no data" as
   "rated zero stars." */
export function RatingTrendChart({ points }: { points: RatingPoint[] }) {
  const { theme, colors, nivoTheme } = useChartTheme();

  const series = [
    { id: "Daily avg", data: points.map((p) => ({ x: p.date, y: p.avg })) },
    { id: "7-day avg", data: points.map((p) => ({ x: p.date, y: p.rolling7d })) },
  ];

  // nivo's "point" x-scale ignores a numeric tickValues (that only works on
  // linear/time scales) and falls back to rendering every point - with 30-90
  // days of data that's every date crammed onto the axis. Pick an explicit,
  // evenly-spaced subset of actual date values instead - indices spaced by
  // even fractional steps (not a fixed modulo stride with the last point
  // always forced in), so the last two ticks never land a day apart.
  const maxTicks = 6;
  const n = points.length;
  const tickValues = Array.from(
    new Set(
      n <= maxTicks
        ? points.map((p) => p.date)
        : Array.from({ length: maxTicks }, (_, k) => points[Math.round((k * (n - 1)) / (maxTicks - 1))].date)
    )
  );

  return (
    <div style={{ height: 260 }}>
      <ResponsiveLine
        data={series}
        margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 1, max: 5 }}
        colors={colors}
        theme={nivoTheme}
        pointSize={6}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointColor={theme === "light" ? "#ffffff" : "#18181b"}
        enableArea={false}
        useMesh
        curve="monotoneX"
        axisBottom={{ tickSize: 0, tickPadding: 8, tickValues, format: (v) => String(v).slice(5) }}
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
            itemWidth: 90,
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
