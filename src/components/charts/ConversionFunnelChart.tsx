"use client";

import { ResponsiveFunnel } from "@nivo/funnel";
import { useTheme } from "@/components/ThemeProvider";
import { getNivoTheme, SEQUENTIAL_ORDINAL } from "@/lib/nivoTheme";

export interface FunnelStage {
  id: string;
  value: number;
  [key: string]: string | number;
}

export function ConversionFunnelChart({ stages }: { stages: FunnelStage[] }) {
  const { theme } = useTheme();
  // Nivo's funnel shape always renders the formatted value, never the part
  // id — a legend row is how identity stays labeled, not color-alone.
  const withLabels = stages.map((s) => ({ ...s, label: s.id }));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {stages.map((s, i) => (
          <span key={s.id} className="flex items-center gap-1.5 text-xs text-fg-tertiary">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEQUENTIAL_ORDINAL[Math.min(i, SEQUENTIAL_ORDINAL.length - 1)] }} />
            {s.id}
          </span>
        ))}
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveFunnel
          data={withLabels}
          margin={{ top: 12, right: 24, bottom: 12, left: 24 }}
          direction="horizontal"
          shapeBlending={0.6}
          colors={SEQUENTIAL_ORDINAL}
          theme={getNivoTheme(theme)}
          borderWidth={0}
          labelColor={theme === "light" ? "#ffffff" : "#0b0b0b"}
          beforeSeparatorLength={0}
          afterSeparatorLength={0}
          currentPartSizeExtension={0}
          currentBorderWidth={0}
          animate
          motionConfig="gentle"
          tooltip={({ part }) => (
            <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-fg shadow-lg">
              <span className="font-semibold">{part.data.id}</span>: {part.data.value}
            </div>
          )}
        />
      </div>
    </div>
  );
}
