"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Row } from "@/lib/types";
import { useBusiness } from "../_lib/context";
import { QrCard } from "@/components/QrCard";
import { Skeleton } from "@/components/Loaders";
import { RatingTrendChart } from "@/components/charts/RatingTrendChart";
import { RatingDistributionBar } from "@/components/charts/RatingDistributionBar";
import { ConversionFunnelChart } from "@/components/charts/ConversionFunnelChart";
import { TimingBar } from "@/components/charts/TimingBar";
import { DeviceDonut } from "@/components/charts/DeviceDonut";
import { AspectsComparisonBar } from "@/components/charts/AspectsComparisonBar";
import { ShiftBar } from "@/components/charts/ShiftBar";
import { InfoIcon, LockIcon, SparkleIcon, StarFillIcon, DownloadIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { generateReportPdf, type ReportPayload } from "@/lib/generateReportPdf";

// ── Types matching the backend response shapes ────────────────────────────────

type Range = "7d" | "30d" | "90d";
interface Stat { value: number | null; prev: number | null }
interface AvgRatingStat { value: number | null; ratingCount: number; prev: number | null; prevRatingCount: number }
interface DraftEditStat { value: number | null; copiedCount: number; prev: number | null }
interface ActivityRow { rating: number; items: string[]; aspects: string[]; startedAt: string }
interface SummaryPayload { reviewsStarted: Stat; avgRating: AvgRatingStat; googleClicks: Stat; completionRate: Stat; draftEditRate: DraftEditStat; recentActivity: ActivityRow[] }
interface RatingsPayload { series: { date: string; avg: number | null; count: number; rolling7d: number | null }[]; distribution: Record<string, number>; ratingCount: number }
interface FunnelPayload { stages: { key: string; label: string; value: number }[] }
interface TimingPayload { byHour: { hour: number; scans: number; avgRating: number | null }[]; byWeekday: { weekday: number; scans: number }[] }
interface DevicesPayload { devices: { android: number; ios: number; other: number }; referrer: { qr: number; nfc: number; direct: number } }
interface MenuRow { menuItemId: string; name: string; mentions: number; avgRating: number | null; trend: "up" | "down" | "flat"; fiveStarShare: number; threeOrBelowShare: number; lowData: boolean }
interface AspectsPayload { aspects: { aspect: string; total: number; lowRated: number; highRated: number }[] }
interface ShiftsPayload { bands: { label: string; sessions: number; avgRating: number | null; lowData: boolean }[] }
interface ComparePeriod { scans: number; rated: number; clicked: number; avgRating: number | null; completionRate: number }
interface ComparePayload { a: ComparePeriod; b: ComparePeriod }

const FUNNEL_HINT: Record<string, string> = {
  scans: "Where every visit starts.",
  rated: "Drop here means placement, or the page loading slowly.",
  drafted: "Drop here means friction on the item/aspect screens.",
  copied: "Drop here means the draft isn't landing - check the wording.",
  clicked: "Drop here is a hesitation at Google - not much you can fix.",
};

function errorTotalScans(err: unknown): number | null {
  if (err instanceof ApiError && err.body && typeof err.body === "object") {
    const v = (err.body as { totalScans?: unknown }).totalScans;
    return typeof v === "number" ? v : null;
  }
  return null;
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Small shared pieces ────────────────────────────────────────────────────────

function DownloadReportButton({ token, businessName, toast }: { token: string; businessName: string; toast: (k: "success" | "error" | "info", m: string) => void }) {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const reports = await Promise.all(
        (["7d", "30d", "90d"] as Range[]).map((r) => api<ReportPayload>(`/business/dashboard/report?range=${r}`, { token }))
      );
      generateReportPdf(reports, businessName);
    } catch {
      toast("error", "Could not generate the report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={download} loading={loading} loadingText="Preparing…">
      <DownloadIcon className="w-4 h-4" />
      Download report (PDF)
    </Button>
  );
}

function RangeToggle({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface">
      {(["7d", "30d", "90d"] as Range[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            range === r ? "bg-brand text-white" : "text-fg-tertiary hover:text-fg"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function deltaLabel(cur: number | null, prev: number | null, suffix = ""): { text: string; tone: "up" | "down" | "flat" | "none" } {
  if (prev === null || cur === null) return { text: "first period", tone: "none" };
  if (prev === 0 && cur === 0) return { text: "no change", tone: "flat" };
  const diff = cur - prev;
  const pct = prev !== 0 ? Math.round((diff / prev) * 100) : null;
  const text = pct === null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}${suffix}` : `${diff > 0 ? "+" : ""}${pct}%`;
  return { text, tone: diff > 0 ? "up" : diff < 0 ? "down" : "flat" };
}

function StatCard({ label, value, delta, note }: { label: string; value: string; delta?: { text: string; tone: "up" | "down" | "flat" | "none" }; note?: string }) {
  const toneClass = delta?.tone === "up" ? "text-success" : delta?.tone === "down" ? "text-danger" : "text-fg-quaternary";
  // A short numeric value ("4.3", "82%") reads as a headline stat at 3xl;
  // a longer fallback string ("No copies yet") would overflow a 2-up mobile
  // card at that size, so it drops down a size instead of truncating.
  const valueSizeClass = value.length > 7 ? "text-lg" : "text-3xl";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-2 min-w-0">
      <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider leading-snug line-clamp-2">{label}</p>
      <p className={`${valueSizeClass} font-bold text-fg font-mono tabular-nums truncate`}>{value}</p>
      {delta && <p className={`text-xs font-medium ${toneClass}`}>{delta.text} vs previous period</p>}
      {note && <p className="text-xs text-warning">{note}</p>}
    </div>
  );
}

function LockedCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface-inset/40 p-6 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0 border border-border">
        <LockIcon className="w-4 h-4 text-fg-quaternary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-fg">{title}</p>
        <p className="text-xs text-fg-tertiary mt-1 leading-relaxed">{description}</p>
        <span className="inline-block mt-2 text-xs font-medium text-brand">Included on the Full plan</span>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-center px-6">
      <p className="text-sm text-fg-quaternary">{message}</p>
    </div>
  );
}

function RecentActivityFeed({ rows, featured }: { rows: ActivityRow[]; featured: boolean }) {
  if (!rows.length) {
    return <p className="text-sm text-fg-tertiary">No ratings yet - the first one will show up here within minutes of a scan.</p>;
  }
  return (
    <ul className={featured ? "space-y-3" : "divide-y divide-border"}>
      {rows.map((a, i) => (
        <li key={i} className={featured ? "rounded-xl border border-border bg-surface p-3.5 flex items-start gap-3" : "flex items-center justify-between gap-3 py-2.5 text-sm"}>
          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: 5 }).map((_, s) => (
              <StarFillIcon key={s} className={`w-3.5 h-3.5 ${s < a.rating ? "text-warning" : "text-fg-quaternary/30"}`} />
            ))}
          </div>
          <span className="text-fg-secondary flex-1 min-w-0 truncate">
            {a.items.length ? `Mentioned ${a.items.join(", ")}` : "No item mentioned"}
            {a.aspects.length ? ` · ${a.aspects.join(", ")}` : ""}
          </span>
          <span className="text-xs text-fg-quaternary shrink-0">{timeAgo(a.startedAt)}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Free / no-plan tier ────────────────────────────────────────────────────────

function FreeTierView({ business, reviewUrl, posterHref, totalScans, toast }: { business?: Row; reviewUrl: string; posterHref?: string; totalScans: number | null; toast: (k: "success" | "error" | "info", m: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Dashboard</h2>
        <p className="text-sm text-fg-tertiary mt-0.5">Welcome back, {business?.name}</p>
      </div>
      {reviewUrl ? (
        <QrCard reviewUrl={reviewUrl} businessName={business?.name || ""} toast={toast} badgeLabel="Live" posterHref={posterHref} />
      ) : null}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Total scans, all time</p>
          <p className="text-3xl font-bold text-fg font-mono tabular-nums mt-1">{totalScans ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-start gap-3">
          <InfoIcon className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-fg-secondary">Your reports are paused. Data is still being collected - you&apos;re just not seeing it.</p>
            <p className="text-xs text-fg-tertiary mt-1">Restart for ₹299/month to see ratings, trends and your funnel again.</p>
          </div>
        </div>
        <button className="rounded-xl bg-brand hover:bg-brand-hover px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer">
          Reactivate reporting
        </button>
      </div>
    </div>
  );
}

// ── Full-tier sections ───────────────────────────────────────────────────────

function MenuBreakdownSection({ token, range }: { token: string; range: Range }) {
  const [sort, setSort] = useState<"mentions" | "rating">("mentions");
  const { data, isPending } = useQuery({
    queryKey: ["business", "dashboard", "menu", range, sort],
    queryFn: () => api<{ items: MenuRow[] }>(`/business/dashboard/menu?range=${range}&sort=${sort}`, { token }),
    enabled: !!token,
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-fg">Menu breakdown</h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "mentions" | "rating")}
          className="text-xs rounded-lg border border-border-strong bg-background px-2 py-1 text-fg-secondary cursor-pointer"
        >
          <option value="mentions">Sort by mentions</option>
          <option value="rating">Sort by rating</option>
        </select>
      </div>
      {isPending ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : !data?.items.length ? (
        <EmptyChart message="Menu breakdown appears once customers start mentioning items in their ratings." />
      ) : (
        <>
          {/* Card layout - small screens, where the 6-column table would force
              horizontal scrolling on every single row. */}
          <div className="space-y-2.5 sm:hidden">
            {data.items.map((row) => (
              <div key={row.menuItemId} className="rounded-xl border border-border p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-fg-secondary min-w-0 truncate">{row.name}</span>
                  <span className={`text-sm font-semibold shrink-0 ${row.trend === "up" ? "text-success" : row.trend === "down" ? "text-danger" : "text-fg-quaternary"}`}>
                    {row.trend === "up" ? "↑" : row.trend === "down" ? "↓" : "–"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-tertiary">
                  <span className="shrink-0 whitespace-nowrap">{row.mentions} mentions</span>
                  <span className="shrink-0 whitespace-nowrap">
                    {row.lowData ? <span className="text-fg-quaternary">not enough data</span> : `${row.avgRating?.toFixed(1)} avg`}
                  </span>
                  <span className="shrink-0 whitespace-nowrap">{row.fiveStarShare}% 5★</span>
                  <span className="shrink-0 whitespace-nowrap">{row.threeOrBelowShare}% ≤3★</span>
                </div>
              </div>
            ))}
          </div>

          {/* Table layout - sm and up */}
          <div className="hidden sm:block overflow-x-auto -mx-1">
            <table className="w-full text-left text-sm min-w-120">
              <thead>
                <tr className="border-b border-border">
                  {["Dish", "Mentions", "Avg rating", "Trend", "5★ share", "≤3★ share"].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-fg-tertiary uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.menuItemId} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5 font-medium text-fg-secondary whitespace-nowrap">{row.name}</td>
                    <td className="px-3 py-2.5 text-fg-tertiary">{row.mentions}</td>
                    <td className="px-3 py-2.5 text-fg-secondary">
                      {row.lowData ? <span className="text-fg-quaternary">not enough data</span> : row.avgRating?.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={row.trend === "up" ? "text-success" : row.trend === "down" ? "text-danger" : "text-fg-quaternary"}>
                        {row.trend === "up" ? "↑" : row.trend === "down" ? "↓" : "–"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-fg-tertiary">{row.fiveStarShare}%</td>
                    <td className="px-3 py-2.5 text-fg-tertiary">{row.threeOrBelowShare}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function AspectsSection({ token, range }: { token: string; range: Range }) {
  const { data, isPending } = useQuery({
    queryKey: ["business", "dashboard", "aspects", range],
    queryFn: () => api<AspectsPayload>(`/business/dashboard/aspects?range=${range}`, { token }),
    enabled: !!token,
  });
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <h3 className="text-sm font-semibold text-fg">What comes up in reviews</h3>
      {isPending ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : !data?.aspects.length ? (
        <EmptyChart message="Aspect themes appear once customers start selecting what stood out." />
      ) : (
        <AspectsComparisonBar aspects={data.aspects} />
      )}
    </div>
  );
}

function ShiftsSection({ token, range }: { token: string; range: Range }) {
  const { data, isPending } = useQuery({
    queryKey: ["business", "dashboard", "shifts", range],
    queryFn: () => api<ShiftsPayload>(`/business/dashboard/shifts?range=${range}`, { token }),
    enabled: !!token,
  });
  const usableBands = data?.bands.filter((b) => !b.lowData) || [];
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <h3 className="text-sm font-semibold text-fg">Rating by shift</h3>
      {isPending ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : usableBands.length < 2 ? (
        <EmptyChart message="Shift comparison needs at least 10 rated sessions per band - check back once volume builds up." />
      ) : (
        <ShiftBar bands={data!.bands} />
      )}
    </div>
  );
}

function CompareSection({ token, days }: { token: string; days: number }) {
  const today = new Date();
  const toStr = (d: Date) => d.toISOString().slice(0, 10);
  const bTo = toStr(today);
  const bFrom = toStr(new Date(today.getTime() - days * 86400000));
  const aTo = bFrom;
  const aFrom = toStr(new Date(today.getTime() - 2 * days * 86400000));

  const { data, isPending } = useQuery({
    queryKey: ["business", "dashboard", "compare", days],
    queryFn: () => api<ComparePayload>(`/business/dashboard/compare?aFrom=${aFrom}&aTo=${aTo}&bFrom=${bFrom}&bTo=${bTo}`, { token }),
    enabled: !!token,
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <h3 className="text-sm font-semibold text-fg">This period vs. the one before</h3>
      {isPending ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : !data ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {(["a", "b"] as const).map((k) => (
            <div key={k} className="space-y-1.5">
              <p className="text-xs font-medium text-fg-quaternary uppercase tracking-wider">{k === "a" ? "Previous period" : "This period"}</p>
              <p className="text-fg-secondary">Avg rating: <span className="font-semibold text-fg">{data[k].avgRating ?? "—"}</span></p>
              <p className="text-fg-secondary">Scans: <span className="font-semibold text-fg">{data[k].scans}</span></p>
              <p className="text-fg-secondary">Completion: <span className="font-semibold text-fg">{data[k].completionRate}%</span></p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-fg-quaternary">This gets more useful every period you stay - it&apos;s your own history.</p>
    </div>
  );
}

function SuggestionsSection({ token }: { token: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["business", "dashboard", "suggestions"],
    queryFn: () => api<{ suggestions: string[] }>("/business/dashboard/suggestions", { token }),
    enabled: !!token,
  });
  if (isPending) return <Skeleton className="h-24 rounded-2xl" />;
  if (!data?.suggestions.length) return null; // nothing rather than something generic
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <h3 className="text-sm font-semibold text-fg">Growth suggestions</h3>
      {data.suggestions.map((s, i) => (
        <div key={i} className="flex items-start gap-2.5 text-sm">
          <SparkleIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <span className="text-fg-secondary">{s}</span>
        </div>
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { token, authChecked, toast } = useBusiness();
  const enabled = authChecked && !!token;
  const [range, setRange] = useState<Range>("30d");

  const { data: business, isPending: businessLoading } = useQuery({
    queryKey: ["business", "me"],
    queryFn: () => api<Row>("/business/me", { token }),
    enabled,
  });
  const tier: "none" | "basic" | "full" = (business?.planId as { features?: { analytics?: "none" | "basic" | "full" } })?.features?.analytics || "none";

  const { data: qr, isPending: qrLoading } = useQuery({
    queryKey: ["business", "me", "qr"],
    queryFn: () => api<{ serial: string; type: string }[]>("/business/me/qr", { token }),
    enabled,
  });
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const reviewUrl = qr?.[0] ? `${baseUrl}/r/${encodeURIComponent(qr[0].serial)}` : "";
  const posterHref = qr?.[0]
    ? `/business/poster/size?serial=${encodeURIComponent(qr[0].serial)}&name=${encodeURIComponent(business?.name || "Business")}`
    : undefined;

  const dashEnabled = enabled && !!business;
  const summaryQ = useQuery({
    queryKey: ["business", "dashboard", "summary", range],
    queryFn: () => api<SummaryPayload>(`/business/dashboard/summary?range=${range}`, { token }),
    enabled: dashEnabled,
    retry: false,
    meta: { silent: true },
  });
  const ratingsQ = useQuery({
    queryKey: ["business", "dashboard", "ratings", range],
    queryFn: () => api<RatingsPayload>(`/business/dashboard/ratings?range=${range}`, { token }),
    enabled: dashEnabled && tier !== "none",
    meta: { silent: true },
  });
  const funnelQ = useQuery({
    queryKey: ["business", "dashboard", "funnel", range],
    queryFn: () => api<FunnelPayload>(`/business/dashboard/funnel?range=${range}`, { token }),
    enabled: dashEnabled && tier !== "none",
    meta: { silent: true },
  });
  const timingQ = useQuery({
    queryKey: ["business", "dashboard", "timing", range],
    queryFn: () => api<TimingPayload>(`/business/dashboard/timing?range=${range}`, { token }),
    enabled: dashEnabled && tier !== "none",
    meta: { silent: true },
  });
  const [timingMode, setTimingMode] = useState<"hour" | "weekday">("hour");
  const devicesQ = useQuery({
    queryKey: ["business", "dashboard", "devices", range],
    queryFn: () => api<DevicesPayload>(`/business/dashboard/devices?range=${range}`, { token }),
    enabled: dashEnabled && tier !== "none",
    meta: { silent: true },
  });

  if (businessLoading || qrLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (tier === "none") {
    const totalScans = errorTotalScans(summaryQ.error);
    return <FreeTierView business={business} reviewUrl={reviewUrl} posterHref={posterHref} totalScans={totalScans} toast={toast} />;
  }

  const summary = summaryQ.data;
  const isNew = (summary?.reviewsStarted.value ?? 0) < 20;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">Dashboard</h2>
          <p className="text-sm text-fg-tertiary mt-0.5">Welcome back, {business?.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RangeToggle range={range} onChange={setRange} />
          <DownloadReportButton token={token} businessName={business?.name || "Business"} toast={toast} />
        </div>
      </div>

      {reviewUrl && <QrCard reviewUrl={reviewUrl} businessName={business?.name || ""} toast={toast} badgeLabel="Live" posterHref={posterHref} />}

      {summary && isNew && (
        <div className="rounded-xl border border-info/20 bg-info/5 px-4 py-3 text-sm text-fg-secondary flex items-center gap-2">
          <InfoIcon className="w-4 h-4 text-info shrink-0" />
          {summary.reviewsStarted.value} review{summary.reviewsStarted.value === 1 ? "" : "s"} collected in the last 30 days. Charts unlock at 20.
        </div>
      )}

      {/* Stat cards - 2 up on phones, 3 on tablets, all 5 in one row from
          lg up. Never fewer than 2 columns so a value never renders full-width
          (that reads as a headline number, not a stat among peers). */}
      {summaryQ.isPending ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Reviews started" value={String(summary.reviewsStarted.value)} delta={deltaLabel(summary.reviewsStarted.value, summary.reviewsStarted.prev)} />
          <StatCard
            label="Average rating"
            value={summary.avgRating.ratingCount < 5 ? `${summary.avgRating.ratingCount} so far` : summary.avgRating.value?.toFixed(1) || "—"}
            delta={summary.avgRating.ratingCount >= 5 ? deltaLabel(summary.avgRating.value, summary.avgRating.prev) : undefined}
          />
          <StatCard label="Google clicks" value={String(summary.googleClicks.value)} delta={deltaLabel(summary.googleClicks.value, summary.googleClicks.prev)} />
          <StatCard
            label="Completion rate"
            value={`${summary.completionRate.value}%`}
            delta={deltaLabel(summary.completionRate.value, summary.completionRate.prev, "pt")}
            note={summary.completionRate.value !== null && summary.completionRate.value < 20 ? "Low completion often means the code is at the counter rather than on the table." : undefined}
          />
          <StatCard
            label="Draft edit rate"
            value={summary.draftEditRate.value === null ? "No copies yet" : `${summary.draftEditRate.value}%`}
            delta={summary.draftEditRate.value !== null ? deltaLabel(summary.draftEditRate.value, summary.draftEditRate.prev, "pt") : undefined}
            note={summary.draftEditRate.copiedCount >= 5 && summary.draftEditRate.value !== null && summary.draftEditRate.value < 20 ? "Most customers copy the draft as-is - a good sign it reads naturally." : undefined}
          />
        </div>
      ) : null}

      {/* Recent activity - featured when there's not much else to show yet */}
      {summary && (isNew ? (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h3 className="text-sm font-semibold text-fg">Recent activity</h3>
          <RecentActivityFeed rows={summary.recentActivity} featured />
        </div>
      ) : null)}

      {/* Rating trend + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h3 className="text-sm font-semibold text-fg">Rating over time</h3>
          {ratingsQ.isPending ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : !ratingsQ.data?.ratingCount ? (
            <EmptyChart message="Rating trend appears once you have a few days of ratings." />
          ) : (
            <RatingTrendChart points={ratingsQ.data.series} />
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h3 className="text-sm font-semibold text-fg">Rating distribution</h3>
          {ratingsQ.isPending ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : !ratingsQ.data?.ratingCount ? (
            <EmptyChart message="Distribution appears once ratings start coming in." />
          ) : (
            <RatingDistributionBar distribution={ratingsQ.data.distribution} />
          )}
        </div>
      </div>

      {/* Funnel */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h3 className="text-sm font-semibold text-fg">Scan-to-review funnel</h3>
        {funnelQ.isPending ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : !funnelQ.data?.stages.some((s) => s.value > 0) ? (
          <EmptyChart message="The funnel fills in as scans come through." />
        ) : (
          <>
            <ConversionFunnelChart stages={funnelQ.data.stages.map((s) => ({ id: s.label, value: s.value }))} />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {funnelQ.data.stages.map((s) => (
                <p key={s.key} className="text-xs text-fg-quaternary leading-snug" title={FUNNEL_HINT[s.key]}>
                  <span className="font-medium text-fg-tertiary">{s.label}:</span> {FUNNEL_HINT[s.key]}
                </p>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Timing + devices + scan source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-fg">When people scan</h3>
            <div className="flex gap-1">
              {(["hour", "weekday"] as const).map((m) => (
                <button key={m} onClick={() => setTimingMode(m)} className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer ${timingMode === m ? "bg-brand/15 text-brand" : "text-fg-tertiary hover:text-fg"}`}>
                  {m === "hour" ? "By hour" : "By day"}
                </button>
              ))}
            </div>
          </div>
          {timingQ.isPending ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : !timingQ.data || !(timingMode === "hour" ? timingQ.data.byHour : timingQ.data.byWeekday).some((d) => d.scans > 0) ? (
            <EmptyChart message="Timing patterns appear once there's more than a day or two of scans." />
          ) : (
            <TimingBar
              mode={timingMode}
              data={timingMode === "hour" ? timingQ.data.byHour.map((h) => ({ key: h.hour, scans: h.scans })) : timingQ.data.byWeekday.map((d) => ({ key: d.weekday, scans: d.scans }))}
            />
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 min-w-0">
          <h3 className="text-sm font-semibold text-fg">Device split</h3>
          {devicesQ.isPending ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : !devicesQ.data || Object.values(devicesQ.data.devices).every((v) => v === 0) ? (
            <EmptyChart message="Device data appears as scans come in." />
          ) : (
            <DeviceDonut data={Object.entries(devicesQ.data.devices).map(([_id, count]) => ({ _id, count }))} />
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 min-w-0 sm:col-span-2 xl:col-span-1">
          <h3 className="text-sm font-semibold text-fg">Scan source</h3>
          {devicesQ.isPending ? (
            <Skeleton className="h-56 rounded-xl" />
          ) : !devicesQ.data || Object.values(devicesQ.data.referrer).every((v) => v === 0) ? (
            <EmptyChart message="Scan source appears as codes get used." />
          ) : (
            <DeviceDonut
              data={Object.entries(devicesQ.data.referrer)
                .filter(([, count]) => count > 0)
                .map(([_id, count]) => ({ _id: _id.toUpperCase(), count }))}
            />
          )}
        </div>
      </div>

      {/* Recent activity - secondary panel once there's other content to look at */}
      {summary && !isNew && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h3 className="text-sm font-semibold text-fg">Recent activity</h3>
          <RecentActivityFeed rows={summary.recentActivity} featured={false} />
        </div>
      )}

      {/* Full tier - menu breakdown last: it's the biggest widget on the page,
          and the quicker/smaller ones (aspects, shifts, compare, suggestions)
          are worth seeing before scrolling past it. */}
      {tier === "full" ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AspectsSection token={token} range={range} />
            <ShiftsSection token={token} range={range} />
          </div>
          <CompareSection token={token} days={range === "7d" ? 7 : range === "90d" ? 90 : 30} />
          <SuggestionsSection token={token} />
          <MenuBreakdownSection token={token} range={range} />
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LockedCard title="Complaint & praise themes" description="What comes up in low ratings vs high ratings, side by side." />
          <LockedCard title="Shift view" description="Average rating by time of day - spot a staffing issue your other data can't show." />
          <LockedCard title="Growth suggestions" description="Rules-based tips generated from your own numbers, not generic advice." />
          <LockedCard title="Menu breakdown" description="Per-dish ratings, mentions and trend - see which dish is actually the problem." />
        </div>
      )}
    </div>
  );
}
