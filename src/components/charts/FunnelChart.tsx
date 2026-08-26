"use client";

export interface FunnelStage {
  label: string;
  value: number;
}

const ORDINAL_STEPS = ["var(--chart-seq-300)", "var(--chart-seq-450)", "var(--chart-seq-600)"];

/* An ordinal funnel — each stage's bar width is relative to the first
   stage, stepped light-to-dark on the sequential blue ramp (never
   magnitude-encoded via a fresh hue per stage; order is the point). Drop-off
   between consecutive stages is printed directly, not left for the reader
   to compute from bar widths. */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const base = stages[0]?.value || 1;
  return (
    <div className="space-y-4">
      {stages.map((s, i) => {
        const fraction = base > 0 ? s.value / base : 0;
        const prev = i > 0 ? stages[i - 1].value : null;
        const dropOff = prev && prev > 0 ? Math.round(((prev - s.value) / prev) * 100) : null;
        return (
          <div key={s.label} className="space-y-1.5">
            {dropOff !== null && dropOff > 0 && (
              <p className="text-xs text-fg-quaternary pl-1">↓ {dropOff}% drop-off</p>
            )}
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-fg-secondary">{s.label}</span>
              <span className="text-fg font-mono tabular-nums">{s.value}</span>
            </div>
            <div className="h-3 rounded-full bg-surface-inset overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(fraction * 100, 2)}%`, backgroundColor: ORDINAL_STEPS[Math.min(i, ORDINAL_STEPS.length - 1)] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
