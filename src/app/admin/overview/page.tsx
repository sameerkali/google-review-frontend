"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import type { Row } from "@/lib/types";
import { AlertIcon, HardwareIcon, PlusIcon, QrIcon } from "@/components/icons";
import { Skeleton } from "@/components/Loaders";

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const EVENT_LABEL: Record<string, string> = { scan: "scanned the QR", google_click: "opened Google Reviews", review_copy: "copied a review" };

function hasLinkedHardware(business: Row, hardwareList: Row[]): boolean {
  return hardwareList.some((h) => {
    const assigned = h.assignedBusinessId;
    const id = assigned && typeof assigned === "object" ? assigned._id : assigned;
    return id === business._id;
  });
}

export default function OverviewPage() {
  const { token, authChecked, openWizard } = useAdmin();
  const enabled = authChecked && !!token;

  const { data: ov, isPending: ovLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api<Record<string, number>>("/admin/overview", { token }),
    enabled,
  });
  const { data: businesses = [], isPending: bLoading } = useQuery({
    queryKey: ["admin", "businesses", "all"],
    queryFn: () => api<Row[]>("/admin/business", { token }),
    enabled,
  });
  const { data: hardware = [], isPending: hLoading } = useQuery({
    queryKey: ["admin", "hardware", "all"],
    queryFn: () => api<Row[]>("/admin/hardware", { token }),
    enabled,
  });
  const { data: analytics, isPending: aLoading } = useQuery({
    queryKey: ["admin", "analytics", "overview"],
    queryFn: () => api<Row>("/admin/analytics", { token }),
    enabled,
  });
  const dataLoading = ovLoading || bLoading || hLoading || aLoading;
  const events = (analytics?.rows as Row[] | undefined) || [];

  const businessName = (id: unknown) => businesses.find((b) => b._id === String(id))?.name || "Unknown business";

  const needsAttention = [
    ...businesses.filter((b) => b.status === "suspended" || b.status === "expired").map((b) => ({ b, reason: `${b.status}` })),
    ...businesses.filter((b) => b.status === "active" && !hasLinkedHardware(b, hardware)).map((b) => ({ b, reason: "no QR linked yet" })),
  ].slice(0, 5);

  const hardwareByStatus = {
    available: hardware.filter((h) => h.status === "available").length,
    assigned: hardware.filter((h) => h.status === "assigned").length,
    lost: hardware.filter((h) => h.status === "lost").length,
    damaged: hardware.filter((h) => h.status === "damaged").length,
  };
  const lowStock = hardwareByStatus.available < 3;

  const recentEvents = [...events]
    .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
    .slice(0, 8);

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
          <h2 className="text-lg font-semibold text-fg">Platform Overview</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">Real-time summary of your QR review platform</p>
        </div>
        <button
          onClick={openWizard}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 cursor-pointer shrink-0"
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2} />
          Onboard New Business
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-5 space-y-3 hover:border-border-strong transition-colors duration-200">
            {dataLoading ? (
              <><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-16 mt-2" /></>
            ) : (
              <><p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">{label}</p><p className="text-3xl font-bold text-fg font-mono tabular-nums">{value ?? "—"}</p></>
            )}
          </div>
        ))}
      </div>

      {dataLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        </div>
      )}

      {!ov && !dataLoading && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-fg-tertiary text-sm">No data available right now.</p>
        </div>
      )}

      {!dataLoading && ov && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Needs attention */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <AlertIcon className="w-4 h-4 text-warning" />
                Needs Attention
              </h3>
              <Link href="/admin/businesses" className="text-xs text-brand hover:text-brand-hover transition-colors">View all →</Link>
            </div>
            {needsAttention.length ? (
              <ul className="space-y-2.5">
                {needsAttention.map(({ b, reason }) => (
                  <li key={b._id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-fg-secondary truncate">{b.name}</span>
                    <span className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-full px-2 py-0.5 shrink-0">{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-tertiary">Nothing needs attention - every active business has a QR linked.</p>
            )}
          </div>

          {/* Hardware stock */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <HardwareIcon className="w-4 h-4 text-info" />
                Hardware Stock
              </h3>
              <Link href="/admin/hardware" className="text-xs text-brand hover:text-brand-hover transition-colors">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-fg font-mono tabular-nums">{hardwareByStatus.available}</p>
                <p className="text-xs text-fg-tertiary">Available</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-fg font-mono tabular-nums">{hardwareByStatus.assigned}</p>
                <p className="text-xs text-fg-tertiary">Assigned</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-fg font-mono tabular-nums">{hardwareByStatus.lost}</p>
                <p className="text-xs text-fg-tertiary">Lost</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-fg font-mono tabular-nums">{hardwareByStatus.damaged}</p>
                <p className="text-xs text-fg-tertiary">Damaged</p>
              </div>
            </div>
            {lowStock && (
              <p className="flex items-center gap-1.5 text-xs text-warning">
                <AlertIcon className="w-3.5 h-3.5 shrink-0" />
                Running low on unassigned stock - register more hardware soon.
              </p>
            )}
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <QrIcon className="w-4 h-4 text-brand" />
              Recent Activity
            </h3>
            {recentEvents.length ? (
              <ul className="divide-y divide-border">
                {recentEvents.map((e) => (
                  <li key={String(e._id)} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="text-fg-secondary truncate">
                      <span className="text-fg font-medium">{businessName(e.businessId)}</span> {EVENT_LABEL[String(e.eventType)] || e.eventType}
                    </span>
                    <span className="text-xs text-fg-quaternary shrink-0">{timeAgo(String(e.createdAt))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-tertiary">No activity yet - scans and clicks will show up here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
