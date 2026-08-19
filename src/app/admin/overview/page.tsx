"use client";

import { useAdmin } from "../_lib/context";
import { PlusIcon } from "../_lib/icons";
import { Skeleton } from "../_components/Loaders";

export default function OverviewPage() {
  const { data, dataLoading, openWizard } = useAdmin();
  const ov = data.ov as Record<string, number> | undefined;

  const cards = [
    { label: "Total Businesses", value: ov?.businesses },
    { label: "Active Businesses", value: ov?.activeBusinesses },
    { label: "Hardware Units", value: ov?.hardware },
    { label: "Total Events", value: ov?.events },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Platform Overview</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Real-time summary of your QR review platform</p>
        </div>
        <button
          onClick={openWizard}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer shrink-0"
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          Onboard New Business
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3 hover:border-zinc-700 transition-colors duration-200">
            {dataLoading ? (
              <><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-16 mt-2" /></>
            ) : (
              <><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p><p className="text-3xl font-bold text-white">{value ?? "—"}</p></>
            )}
          </div>
        ))}
      </div>
      {!ov && !dataLoading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-500 text-sm">Click Refresh to load data.</p>
        </div>
      )}
    </div>
  );
}
