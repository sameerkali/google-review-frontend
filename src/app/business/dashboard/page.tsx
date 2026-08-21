"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useBusiness } from "../_lib/context";
import { QrCard } from "../../admin/_components/QrCard";
import { Skeleton } from "../../admin/_components/Loaders";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "../../admin/_lib/icons";

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
      {on ? <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" /> : <CloseIcon className="w-4 h-4 text-zinc-600 shrink-0" />}
      <span className={on ? "text-zinc-200" : "text-zinc-600"}>{label}</span>
    </div>
  );
}

function UpgradeTeaser({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 flex items-start gap-3">
      <InfoIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { business, token, toast } = useBusiness();
  const plan = business?.planId as Plan | undefined;

  const [qr, setQr] = useState<{ serial: string; type: string }[]>([]);
  const [qrLoading, setQrLoading] = useState(true);

  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [analyticsBlocked, setAnalyticsBlocked] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [tips, setTips] = useState<string[] | null>(null);
  const [tipsBlocked, setTipsBlocked] = useState("");
  const [tipsLoading, setTipsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setQrLoading(true);
      try {
        setQr(await api<{ serial: string; type: string }[]>("/business/me/qr", { token }));
      } catch (e) {
        toast("error", e instanceof Error ? e.message : "Failed to load your QR code");
      } finally {
        setQrLoading(false);
      }
    })();

    (async () => {
      setAnalyticsLoading(true);
      try {
        setAnalytics(await api<AnalyticsPayload>("/business/me/analytics", { token }));
      } catch (e) {
        setAnalyticsBlocked(e instanceof ApiError ? e.message : "Analytics unavailable right now.");
      } finally {
        setAnalyticsLoading(false);
      }
    })();

    (async () => {
      setTipsLoading(true);
      try {
        const res = await api<{ tips: string[] }>("/business/me/suggestions", { token });
        setTips(res.tips);
      } catch (e) {
        setTipsBlocked(e instanceof ApiError ? e.message : "Suggestions unavailable right now.");
      } finally {
        setTipsLoading(false);
      }
    })();
  }, [token, toast]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const primaryQr = qr[0];
  const reviewUrl = primaryQr ? `${baseUrl}/r/${encodeURIComponent(primaryQr.serial)}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Welcome back, {business?.name}</p>
      </div>

      {/* Plan card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Your Plan</h3>
          {plan ? (
            <span className="text-lg font-bold text-white">
              {plan.name} <span className="text-sm font-normal text-zinc-500">₹{plan.price}{plan.billingType === "monthly" ? "/mo" : plan.billingType === "annually" ? "/yr" : ""}</span>
            </span>
          ) : (
            <span className="text-sm text-zinc-500">No plan assigned</span>
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
        <h3 className="text-sm font-semibold text-white">Analytics</h3>
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
                <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            {analytics.breakdown && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["device", "browser", "os"] as const).map((field) => (
                  <div key={field} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider capitalize">{field}</p>
                    {analytics.breakdown![field].length ? (
                      <ul className="space-y-1.5">
                        {analytics.breakdown![field].map((row) => (
                          <li key={row._id || "unknown"} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300 capitalize">{row._id || "unknown"}</span>
                            <span className="text-zinc-500">{row.count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-zinc-600">No data yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {analytics.recentEvents && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Scans</p>
                {analytics.recentEvents.length ? (
                  <ul className="divide-y divide-zinc-800">
                    {analytics.recentEvents.slice(0, 10).map((e, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="text-zinc-300">{e.eventType} · {e.device || "unknown"} · {e.browser || "unknown"}</span>
                        <span className="text-xs text-zinc-600 shrink-0">{new Date(e.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500">No activity yet.</p>
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
        <h3 className="text-sm font-semibold text-white">Growth Suggestions</h3>
        {tipsLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : tips ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <AlertIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-zinc-300">{t}</span>
              </div>
            ))}
          </div>
        ) : (
          <UpgradeTeaser message={tipsBlocked || "Growth suggestions unavailable."} />
        )}
      </div>
    </div>
  );
}
