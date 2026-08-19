"use client";

import { useAdmin } from "../_lib/context";
import type { Row } from "../_lib/types";
import { Skeleton } from "../_components/Loaders";
import { DataTable } from "../_components/DataTable";

export default function AnalyticsPage() {
  const { data, dataLoading } = useAdmin();
  const rows = data.a as Row | undefined;
  const s = rows?.summary;
  const eventRows: Row[] = rows?.rows || [];
  const statCards = s
    ? [
        { label: "Total Scans", value: s.byType?.scan ?? 0 },
        { label: "Google Clicks", value: s.byType?.google_click ?? 0 },
        { label: "Review Copies", value: s.byType?.review_copy ?? 0 },
        { label: "Total Events", value: s.total ?? 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Analytics</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Track QR interactions and engagement</p>
      </div>
      {dataLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : s ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <DataTable rows={eventRows} cols={["eventType", "code", "device", "browser", "os"]} loading={dataLoading} />
    </div>
  );
}
