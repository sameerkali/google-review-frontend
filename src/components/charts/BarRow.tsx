"use client";

/* A single labeled horizontal bar — the unit both AnalyticsBarChart and
   FunnelChart are built from. Value is always printed as text (never
   hidden behind hover), so color never has to carry meaning alone. */
export function BarRow({
  label, value, displayValue, fraction, color,
}: {
  label: string;
  value: number;
  displayValue?: string;
  /** 0–1, this bar's width relative to the chart's max. */
  fraction: number;
  color: string;
}) {
  return (
    <div className="group space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-fg-secondary truncate">{label}</span>
        <span className="text-fg font-mono tabular-nums shrink-0">{displayValue ?? value}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-inset overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out group-hover:brightness-110"
          style={{ width: `${Math.max(fraction * 100, value > 0 ? 2 : 0)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
