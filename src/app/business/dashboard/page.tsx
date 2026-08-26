"use client";

import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Row } from "@/lib/types";
import { useBusiness } from "../_lib/context";
import { QrCard } from "@/components/QrCard";
import { Skeleton } from "@/components/Loaders";
import { BarChart } from "@/components/charts/BarChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { CheckIcon, CloseIcon, InfoIcon, SparkleIcon } from "@/components/icons";

/* Curated, hand-written for now — a real suggestions engine isn't wired up
   yet. Gated behind the same plan.features.suggestions flag the (currently
   unused) live endpoint would be, so swapping in real ones later is a
   drop-in data-source change, not a UI change. */
const STATIC_SUGGESTIONS = [
  "Ask happy customers to scan right at the moment they're paying — that's when reviews convert best.",
  "Place the QR code at eye level near the register or exit, not tucked in a corner.",
  "Give staff a one-line prompt to say out loud: \"Scan this to leave us a quick review!\"",
  "Print the QR code on receipts and takeaway bags for extra reach beyond the counter.",
  "Refresh your pre-written review suggestions every few months so they keep feeling authentic.",
  "Reply publicly to new Google reviews — it shows future customers you're listening.",
];

interface Plan {
  name: string;
  price: number;
  billingType: string;
  features?: { analytics?: string; userData?: boolean; suggestions?: boolean };
}

interface AnalyticsPayload {
  level: string;
  summary: { total: number; byType: Record<string, number>; conversionRate: number };
  breakdown?: { device: { _id: string; count: number }[]; browser: { _id: string; count: number }[]; os: { _id: string; count: number }[] };
  recentEvents?: { eventType: string; device?: string; browser?: string; os?: string; createdAt: string }[];
}

function FeatureRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {on ? <CheckIcon className="w-4 h-4 text-success shrink-0" /> : <CloseIcon className="w-4 h-4 text-fg-quaternary shrink-0" />}
      <span className={on ? "text-fg-secondary" : "text-fg-quaternary"}>{label}</span>
    </div>
  );
}

function UpgradeTeaser({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 flex items-start gap-3">
      <InfoIcon className="w-5 h-5 text-info shrink-0 mt-0.5" />
      <p className="text-sm text-fg-tertiary">{message}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { token, authChecked, toast } = useBusiness();
  const enabled = authChecked && !!token;

  const { data: business } = useQuery({
    queryKey: ["business", "me"],
    queryFn: () => api<Row>("/business/me", { token }),
    enabled,
  });
  const plan = business?.planId as Plan | undefined;

  const { data: qr, isPending: qrLoading } = useQuery({
    queryKey: ["business", "me", "qr"],
    queryFn: () => api<{ serial: string; type: string }[]>("/business/me/qr", { token }),
    enabled,
  });

  const {
    data: analytics,
    isPending: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ["business", "me", "analytics"],
    queryFn: () => api<AnalyticsPayload>("/business/me/analytics", { token }),
    enabled,
    meta: { silent: true }, // plan-gated — rendered inline via UpgradeTeaser, not a toast
  });
  const analyticsBlocked = analyticsError instanceof ApiError ? analyticsError.message : analyticsError ? "Analytics unavailable right now." : "";

  const suggestionsEnabled = Boolean(plan?.features?.suggestions);
  const analyticsFull = plan?.features?.analytics === "full";

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const primaryQr = qr?.[0];
  const reviewUrl = primaryQr ? `${baseUrl}/r/${encodeURIComponent(primaryQr.serial)}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Dashboard</h2>
        <p className="text-sm text-fg-tertiary mt-0.5">Welcome back, {business?.name}</p>
      </div>

      {/* Plan card */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Your Plan</h3>
          {plan ? (
            <span className="text-lg font-bold text-fg">
              {plan.name} <span className="text-sm font-normal text-fg-tertiary">₹{plan.price}{plan.billingType === "monthly" ? "/mo" : plan.billingType === "annually" ? "/yr" : ""}</span>
            </span>
          ) : (
            <span className="text-sm text-fg-tertiary">No plan assigned</span>
          )}
        </div>
        {plan?.features && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <FeatureRow label="QR code + basic functionality" on />
            <FeatureRow label={`Analytics: ${plan.features.analytics === "full" ? "Full" : plan.features.analytics === "basic" ? "Basic" : "None"}`} on={plan.features.analytics !== "none"} />
            <FeatureRow label="Scanner device data" on={Boolean(plan.features.userData)} />
          </div>
        )}
      </div>

      {/* QR / link */}
      {qrLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : reviewUrl ? (
        <QrCard reviewUrl={reviewUrl} businessName={business?.name || ""} toast={toast} badgeLabel="Live" />
      ) : (
        <UpgradeTeaser message="No QR code is linked to your account yet — contact your platform admin to get one set up." />
      )}

      {/* Analytics */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-fg">Analytics</h3>
        {analyticsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Scans", value: analytics.summary.byType.scan ?? 0 },
                { label: "Google Clicks", value: analytics.summary.byType.google_click ?? 0 },
                { label: "Review Copies", value: analytics.summary.byType.review_copy ?? 0 },
                { label: "Conversion Rate", value: `${analytics.summary.conversionRate}%` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-border bg-surface p-5 space-y-2">
                  <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-bold text-fg font-mono tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            {analytics.breakdown && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["device", "browser", "os"] as const).map((field) => (
                  <div key={field} className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                    <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider capitalize">{field}</p>
                    {analytics.breakdown![field].length ? (
                      analyticsFull ? (
                        <BarChart
                          data={analytics.breakdown![field].map((row) => ({ label: row._id || "unknown", value: row.count }))}
                        />
                      ) : (
                        <ul className="space-y-1.5">
                          {analytics.breakdown![field].map((row) => (
                            <li key={row._id || "unknown"} className="flex items-center justify-between text-sm">
                              <span className="text-fg-secondary capitalize">{row._id || "unknown"}</span>
                              <span className="text-fg-tertiary">{row.count}</span>
                            </li>
                          ))}
                        </ul>
                      )
                    ) : (
                      <p className="text-xs text-fg-quaternary">No data yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {analyticsFull && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                  <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Activity by Type</p>
                  <BarChart
                    data={[
                      { label: "Scans", value: analytics.summary.byType.scan ?? 0, color: "var(--chart-series-1)" },
                      { label: "Review Copies", value: analytics.summary.byType.review_copy ?? 0, color: "var(--chart-series-2)" },
                      { label: "Google Clicks", value: analytics.summary.byType.google_click ?? 0, color: "var(--chart-series-3)" },
                    ]}
                  />
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                  <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Conversion Funnel</p>
                  <FunnelChart
                    stages={[
                      { label: "Scans", value: analytics.summary.byType.scan ?? 0 },
                      { label: "Review Copies", value: analytics.summary.byType.review_copy ?? 0 },
                      { label: "Google Clicks", value: analytics.summary.byType.google_click ?? 0 },
                    ]}
                  />
                </div>
              </div>
            )}

            {analytics.recentEvents && (
              <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                <p className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Recent Scans</p>
                {analytics.recentEvents.length ? (
                  <ul className="divide-y divide-border">
                    {analytics.recentEvents.slice(0, 10).map((e, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="text-fg-secondary">{e.eventType} · {e.device || "unknown"} · {e.browser || "unknown"}</span>
                        <span className="text-xs text-fg-quaternary shrink-0">{new Date(e.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-fg-tertiary">No activity yet.</p>
                )}
              </div>
            )}
          </>
        ) : (
          <UpgradeTeaser message={analyticsBlocked || "Analytics unavailable."} />
        )}
      </div>

      {/* Growth suggestions */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-fg">Growth Suggestions</h3>
        {suggestionsEnabled ? (
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            {STATIC_SUGGESTIONS.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <SparkleIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span className="text-fg-secondary">{t}</span>
              </div>
            ))}
          </div>
        ) : (
          <UpgradeTeaser message="Growth suggestions aren't included in your current plan." />
        )}
      </div>
    </div>
  );
}
