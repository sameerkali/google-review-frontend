"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import QRCode from "qrcode";

/* ─── Types ─────────────────────────────────────────────── */
type Row = Record<string, any>;
type Tab = "overview" | "businesses" | "plans" | "hardware" | "reviews" | "analytics" | "simulator";

interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  msg: string;
}

/* ─── Validation helpers ─────────────────────────────────── */
const validators: Record<string, (v: string) => string | null> = {
  email: (v) => !v?.trim() ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email address" : null,
  phone: (v) => v && !/^\+?[\d\s\-().]{7,}$/.test(v) ? "Invalid phone number" : null,
  googleReviewUrl: (v) => v && !v.startsWith("http") ? "Must be a valid URL starting with http" : null,
  price: (v) => v && isNaN(Number(v)) ? "Must be a number" : null,
  name: (v) => !v?.trim() ? "Name is required" : null,
  serial: (v) => !v?.trim() ? "Serial / Code is required" : null,
  code: (v) => !v?.trim() ? "QR Code is required" : null,
  billingType: (v) => !["monthly", "annually", "one_time"].includes(v) ? 'Use "monthly", "annually", or "one_time"' : null,
  type: (v) => !["QR", "NFC"].includes(v) ? 'Use "QR" or "NFC"' : null,
};

/* ─── Fields rendered as a <select> instead of free text ─────────── */
const FIELD_OPTIONS: Record<string, string[]> = {
  type: ["QR", "NFC"],
  billingType: ["monthly", "annually", "one_time"],
};

function validate(fields: string[], form: Record<string, string>): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    const fn = validators[f];
    if (!fn) {
      if (!form[f]?.trim() && ["name", "serial", "code", "reviewText", "businessId"].includes(f)) {
        errs[f] = `${f} is required`;
      }
      continue;
    }
    const msg = fn(form[f] || "");
    if (msg) errs[f] = msg;
  }
  return errs;
}

/* ─── Icons ─────────────────────────────────────────────── */
const icons: Record<Tab, React.ReactNode> = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  businesses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  plans: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  hardware: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
    </svg>
  ),
  reviews: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  simulator: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
    </svg>
  ),
};

const TABS: Tab[] = ["overview", "businesses", "plans", "hardware", "reviews", "analytics", "simulator"];

/* ─── Toast system ───────────────────────────────────────── */
function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none max-w-[calc(100vw-2rem)]"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl pointer-events-auto transition-all duration-300 ${
            t.kind === "success"
              ? "bg-emerald-950 border border-emerald-500/30 text-emerald-300"
              : t.kind === "error"
              ? "bg-red-950 border border-red-500/30 text-red-300"
              : "bg-blue-950 border border-blue-500/30 text-blue-300"
          }`}
        >
          <span>
            {t.kind === "success" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : t.kind === "error" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            )}
          </span>
          {t.msg}
          <button
            className="ml-2 cursor-pointer opacity-60 hover:opacity-100"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Spinner ────────────────────────────────────────────── */
function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-6 h-6 border-2" : "w-4 h-4 border-[1.5px]";
  return <div className={`${cls} rounded-full border-emerald-400 border-t-transparent animate-spin`} />;
}

/* ─── Skeleton ───────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-800 ${className}`} />;
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Admin() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);
  const openWizard = useCallback(() => { setWizardKey((k) => k + 1); setWizardOpen(true); }, []);
  const toastId = useRef(0);

  const toast = useCallback((kind: Toast["kind"], msg: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, kind, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refresh = useCallback(async (t?: string) => {
    const tok = t || token;
    if (!tok) return;
    setDataLoading(true);
    try {
      const [ov, b, p, h, s, a] = await Promise.all([
        api<Row>("/admin/overview", { token: tok }),
        api<Row[]>("/admin/business", { token: tok }),
        api<Row[]>("/admin/plans", { token: tok }),
        api<Row[]>("/admin/hardware", { token: tok }),
        api<Row[]>("/admin/review-suggestions", { token: tok }),
        api<Row>("/admin/analytics", { token: tok }),
      ]);
      setData({ ov, b, p, h, s, a });
    } catch (e: any) {
      toast("error", e.message || "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  }, [token, toast]);

  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) { setToken(t); refresh(t); }
    setAuthChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setLoginErr("Password is required"); return; }
    setLoginErr("");
    setLoading(true);
    try {
      const { token: t } = await api<{ token: string }>("/admin/login", {
        method: "POST",
        body: { password },
      });
      localStorage.setItem("admin_token", t);
      setToken(t);
      toast("success", "Signed in successfully");
      refresh(t);
    } catch (x: any) {
      setLoginErr(x.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  const create = async (
    kind: string,
    body: Record<string, any>,
    successMsg?: (created: Row) => string
  ): Promise<boolean> => {
    try {
      const created = await api<Row>("/admin/" + kind, { method: "POST", body, token });
      toast("success", successMsg ? successMsg(created) : "Created successfully");
      await refresh();
      return true;
    } catch (x: any) {
      toast("error", x.message || "Something went wrong");
      return false;
    }
  };

  const signOut = () => {
    localStorage.removeItem("admin_token");
    setToken("");
    setData({});
    toast("info", "Signed out");
  };

  /* Avoid flashing the login form before we've checked localStorage for an
     existing session — that swap is a jarring full-page layout shift. */
  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Spinner size="md" />
      </main>
    );
  }

  /* ─── Login screen ────────────────────────────────────── */
  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
        <ToastContainer toasts={toasts} dismiss={dismissToast} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>
        <form
          onSubmit={login}
          className="relative w-full max-w-sm mx-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 space-y-5 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Admin Portal</h1>
              <p className="text-xs text-zinc-500">QR Review Platform</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginErr(""); }}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                loginErr
                  ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                  : "border-zinc-700 focus:border-emerald-500/60 focus:ring-emerald-500/20"
              }`}
            />
            {loginErr && (
              <p role="alert" className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {loginErr}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 py-3 text-sm font-semibold text-zinc-950 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? <><Spinner /> Signing in…</> : "Sign in"}
          </button>
          <p className="text-center text-xs text-zinc-600">Access restricted to authorised administrators</p>
        </form>
      </main>
    );
  }

  /* ─── Dashboard ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
      <OnboardWizard
        key={wizardKey}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        token={token}
        hardwareList={data.h || []}
        onRefresh={refresh}
        toast={toast}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-xs text-zinc-500">QR Review Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium capitalize transition-all duration-150 cursor-pointer text-left ${
                tab === t
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              <span className={tab === t ? "text-emerald-400" : "text-zinc-600"}>
                {icons[t]}
              </span>
              {t === "simulator" ? "QR Simulator" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-zinc-800">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <header className="sticky top-0 z-10 bg-zinc-950/80 border-b border-zinc-800 px-5 py-3 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white capitalize">
                {tab === "simulator" ? "QR Simulator" : tab}
              </h1>
              <p className="text-xs text-zinc-600 hidden sm:block">QR Review Platform · Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dataLoading && <Spinner />}
            <button
              onClick={() => refresh()}
              disabled={dataLoading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer disabled:opacity-40"
            >
              <svg className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-6 lg:p-8">
          {tab === "overview" && (
            <OverviewTab ov={data.ov} loading={dataLoading} onOnboard={openWizard} />
          )}
          {tab === "businesses" && (
            <ListTab
              title="Business Management"
              rows={data.b || []}
              cols={["_id", "name", "email", "phone", "status"]}
              onAddClick={openWizard}
              loading={dataLoading}
              toast={toast}
            />
          )}
          {tab === "plans" && (
            <ListTab
              title="Plan Management"
              rows={data.p || []}
              cols={["name", "billingType", "price"]}
              onAdd={(body) => create("plans", body)}
              addFields={["name", "billingType", "price"]}
              loading={dataLoading}
              toast={toast}
            />
          )}
          {tab === "hardware" && (
            <ListTab
              title="Hardware Management"
              rows={data.h || []}
              cols={["type", "serial", "status"]}
              onAdd={(body) => create("hardware", { items: [body] })}
              addFields={["type", "serial"]}
              loading={dataLoading}
              toast={toast}
            />
          )}
          {tab === "reviews" && (
            <ListTab
              title="Review Suggestion Management"
              rows={data.s || []}
              cols={["businessId", "reviewText", "status"]}
              onAdd={(body) => create("review-suggestions", body)}
              addFields={["businessId", "reviewText"]}
              loading={dataLoading}
              toast={toast}
            />
          )}
          {tab === "analytics" && <AnalyticsTab rows={data.a} loading={dataLoading} />}
          {tab === "simulator" && <SimulatorTab toast={toast} />}
        </main>
      </div>
    </div>
  );
}

/* ─── Overview Tab ───────────────────────────────────────── */
function OverviewTab({ ov, loading, onOnboard }: { ov?: Row; loading: boolean; onOnboard: () => void }) {
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
          onClick={onOnboard}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Onboard New Business
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3 hover:border-zinc-700 transition-colors duration-200">
            {loading ? (
              <><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-16 mt-2" /></>
            ) : (
              <><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p><p className="text-3xl font-bold text-white">{value ?? "—"}</p></>
            )}
          </div>
        ))}
      </div>
      {!ov && !loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-500 text-sm">Click Refresh to load data.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Analytics Tab ──────────────────────────────────────── */
function AnalyticsTab({ rows, loading }: { rows?: Row; loading: boolean }) {
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
      {loading ? (
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
      <DataTable rows={eventRows} cols={["eventType", "code", "device", "browser", "os"]} loading={loading} />
    </div>
  );
}

/* ─── List Tab ───────────────────────────────────────────── */
const FIELD_LABELS: Record<string, string> = {
  name: "Business Name",
  email: "Email Address",
  phone: "Phone Number",
  address: "Address",
  googleReviewUrl: "Google Review URL",
  code: "Hardware Serial / Code",
  billingType: "Billing Type",
  price: "Price",
  type: "Hardware Type",
  serial: "Serial Number",
  businessId: "Business ID",
  reviewText: "Review Text",
};

const REQUIRED_FIELDS: Record<string, boolean> = {
  name: true, serial: true, code: true, reviewText: true, businessId: true,
};

function ListTab({
  title, rows, cols, onAdd, addFields, loading, toast, onAddClick,
}: {
  title: string;
  rows: Row[];
  cols: string[];
  onAdd?: (b: any) => Promise<boolean>;
  addFields?: string[];
  loading: boolean;
  toast: (kind: Toast["kind"], msg: string) => void;
  /** When provided, "Add New" calls this instead of toggling the built-in inline form
      (used by the Businesses tab to launch the guided onboarding wizard). */
  onAddClick?: () => void;
}) {
  const fields = addFields || [];
  const emptyForm = Object.fromEntries(fields.map((f) => [f, FIELD_OPTIONS[f]?.[0] || ""]));
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const validateField = (f: string, value: Record<string, string>) => {
    const errs = validate([f], value);
    setErrors((prev) => ({ ...prev, [f]: errs[f] || "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fields, form);
    setErrors(errs);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    if (Object.keys(errs).some((f) => errs[f])) {
      toast("error", "Please fix the form errors before submitting");
      return;
    }
    setSaving(true);
    const ok = await onAdd!(form);
    setSaving(false);
    if (ok) { setForm(emptyForm); setErrors({}); setTouched({}); setShowForm(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{rows.length} record{rows.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={onAddClick || (() => { setShowForm((v) => !v); setErrors({}); setTouched({}); })}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
        >
          <svg className={`w-4 h-4 transition-transform duration-200 ${showForm && !onAddClick ? "rotate-45" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {showForm && !onAddClick ? "Cancel" : "Add New"}
        </button>
      </div>

      {showForm && !onAddClick && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4" noValidate>
          <h3 className="text-sm font-semibold text-white">New Record</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f} className="space-y-1.5">
                <label htmlFor={`field-${f}`} className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {FIELD_LABELS[f] || f}
                  {REQUIRED_FIELDS[f] && <span className="text-red-400 ml-1">*</span>}
                </label>
                {FIELD_OPTIONS[f] ? (
                  <select
                    id={`field-${f}`}
                    value={form[f] || FIELD_OPTIONS[f][0]}
                    onChange={(e) => {
                      const next = { ...form, [f]: e.target.value };
                      setForm(next);
                      if (touched[f]) validateField(f, next);
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, [f]: true })); validateField(f, form); }}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none transition-all duration-200 focus:ring-1 ${
                      errors[f]
                        ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                        : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                    }`}
                  >
                    {FIELD_OPTIONS[f].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`field-${f}`}
                    type={f === "email" ? "email" : f === "price" ? "number" : "text"}
                    placeholder={FIELD_LABELS[f] || f}
                    value={form[f] || ""}
                    onChange={(e) => {
                      const next = { ...form, [f]: e.target.value };
                      setForm(next);
                      if (touched[f]) validateField(f, next);
                    }}
                    onBlur={() => { setTouched((t) => ({ ...t, [f]: true })); validateField(f, form); }}
                    aria-invalid={!!errors[f]}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                      errors[f]
                        ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                        : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                    }`}
                  />
                )}
                {errors[f] && (
                  <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    {errors[f]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? <><Spinner /> Saving…</> : "Save Record"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setErrors({}); setTouched({}); setForm(emptyForm); }}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <DataTable rows={rows} cols={cols} loading={loading} toast={toast} />
    </div>
  );
}

/* Populated Mongoose refs (e.g. businessId) arrive as full objects, not ids —
   render something human-readable instead of the default "[object Object]". */
function cellText(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") {
    const obj = value as Row;
    return obj.name || obj._id || JSON.stringify(obj);
  }
  return String(value);
}

/* ─── Data Table ─────────────────────────────────────────── */
function DataTable({
  rows, cols, loading, toast,
}: {
  rows: Row[];
  cols: string[];
  loading: boolean;
  toast?: (kind: Toast["kind"], msg: string) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex gap-6">
          {cols.map((c) => <Skeleton key={c} className="h-3 w-16" />)}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-zinc-800 flex gap-6">
            {cols.map((c) => <Skeleton key={c} className="h-3 w-20" />)}
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="text-sm text-zinc-500">No records yet</p>
        <p className="text-xs text-zinc-600 mt-1">Add your first record using the button above</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-zinc-900 border-b border-zinc-800">
            {cols.map((c) => (
              <th key={c} className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                {c === "_id" ? "ID" : c.replace(/([A-Z])/g, " $1").trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-900/60 transition-colors duration-100">
              {cols.map((c) => (
                <td
                  key={c}
                  className={`px-4 py-3 text-zinc-300 whitespace-nowrap max-w-xs truncate ${c === "_id" ? "font-mono text-xs cursor-pointer hover:text-emerald-400" : ""}`}
                  title={c === "_id" ? "Click to copy" : undefined}
                  onClick={
                    c === "_id" && row[c]
                      ? () => {
                          navigator.clipboard
                            .writeText(String(row[c]))
                            .then(() => toast?.("info", "Business ID copied to clipboard"))
                            .catch(() => toast?.("error", "Could not copy to clipboard"));
                        }
                      : undefined
                  }
                >
                  {c === "status" ? (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      String(row[c]) === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : String(row[c]) === "assigned"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        String(row[c]) === "active" ? "bg-emerald-400" : String(row[c]) === "assigned" ? "bg-blue-400" : "bg-zinc-500"
                      }`} />
                      {cellText(row[c])}
                    </span>
                  ) : (
                    cellText(row[c])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── QR Simulator Tab ───────────────────────────────────── */
function SimulatorTab({ toast }: { toast: (kind: Toast["kind"], msg: string) => void }) {
  const [serial, setSerial] = useState("");
  const [serialErr, setSerialErr] = useState("");
  const [verifyErr, setVerifyErr] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [bizName, setBizName] = useState("");
  const [verifying, setVerifying] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = serial.trim();
    if (!trimmed) { setSerialErr("Serial / Code is required"); return; }
    setSerialErr("");
    setVerifyErr("");
    setReviewUrl("");
    setBizName("");
    setVerifying(true);

    try {
      // Verify the serial actually exists + is assigned to a business
      const result = await api<{ business: { name: string }; suggestion: string | null }>(`/r/${encodeURIComponent(trimmed)}`);
      const url = `${baseUrl}/r/${encodeURIComponent(trimmed)}`;
      setReviewUrl(url);
      setBizName(result.business?.name || "");
      toast("success", `QR generated for "${result.business?.name}" — scan or open the link!`);
    } catch {
      setVerifyErr(
        `Serial "${trimmed}" was not found or is not assigned to a business yet.`
      );
      toast("error", "Serial not set up — see the steps below.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-white">QR Code Simulator</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Test the full review flow without physical hardware.</p>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Required setup before generating
        </div>
        <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>
            Go to <strong className="text-zinc-200">Hardware</strong> tab → <strong className="text-zinc-200">Add New</strong> →
            enter any serial e.g. <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">TEST-001</code>
          </li>
          <li>
            Go to <strong className="text-zinc-200">Businesses</strong> tab → <strong className="text-zinc-200">Add New</strong> →
            fill in all fields, set <em>Hardware Serial / Code</em> to the same value (<code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">TEST-001</code>)
          </li>
          <li>Come back here, enter the same serial → the QR will generate and the review page will work</li>
        </ol>
      </div>

      {/* Form */}
      <form onSubmit={generate} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4" noValidate>
        <h3 className="text-sm font-semibold text-white">Generate QR Code</h3>
        <div className="space-y-1.5">
          <label htmlFor="sim-serial" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Hardware Serial / Code <span className="text-red-400">*</span>
          </label>
          <input
            id="sim-serial"
            type="text"
            placeholder="e.g. TEST-001, CAFE-ABC"
            value={serial}
            onChange={(e) => { setSerial(e.target.value); setSerialErr(""); setVerifyErr(""); }}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
              serialErr || verifyErr
                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
            }`}
          />
          {serialErr && (
            <p className="flex items-center gap-1 text-xs text-red-400">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {serialErr}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={verifying}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
        >
          {verifying ? (
            <><div className="w-4 h-4 border-[1.5px] border-zinc-800 border-t-transparent rounded-full animate-spin" /> Verifying…</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            </svg> Verify &amp; Generate QR</>
          )}
        </button>
      </form>

      {/* Error: serial not found */}
      {verifyErr && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-red-400">Serial not found or not assigned</p>
              <p className="text-xs text-zinc-400">{verifyErr}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Fix: Go to <strong className="text-zinc-300">Hardware</strong> tab and add <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">{serial.trim()}</code> as a serial. Then go to <strong className="text-zinc-300">Businesses</strong> and create/update a business with that serial in the "Hardware Serial / Code" field.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success: QR result */}
      {reviewUrl && !verifyErr && <QrCard reviewUrl={reviewUrl} businessName={bizName} toast={toast} />}
    </div>
  );
}

/* ─── QR Card (shared: QR Simulator + Onboarding Wizard) ────────────── */
function QrCard({
  reviewUrl, businessName, toast, badgeLabel = "Verified", compact = false,
}: {
  reviewUrl: string;
  businessName: string;
  toast: (kind: Toast["kind"], msg: string) => void;
  badgeLabel?: string;
  /** Force a stacked layout — the row split relies on a viewport-width
      breakpoint, which is wrong inside a narrow container like a modal. */
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // Draw the QR AFTER React has committed the canvas to the DOM
  useEffect(() => {
    if (!reviewUrl || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, reviewUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => toast("error", "Failed to render QR code"));
  }, [reviewUrl, toast]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(reviewUrl)
      .then(() => {
        setCopied(true);
        toast("info", "Link copied to clipboard");
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => toast("error", "Could not copy to clipboard"));
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white truncate">QR Code for <span className="text-emerald-400">{businessName}</span></h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {badgeLabel}
        </span>
      </div>
      <div className={`flex flex-col gap-6 ${compact ? "items-center text-center" : "items-start sm:flex-row sm:text-left"}`}>
        {/* Canvas renders the QR code */}
        <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0">
          <canvas ref={canvasRef} className="block" />
        </div>
        <div className="space-y-4 flex-1 min-w-0">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Review URL</p>
            <code className="block text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 break-all">
              {reviewUrl}
            </code>
          </div>
          <div className={`flex flex-wrap gap-2 ${compact ? "justify-center" : ""}`}>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
            >
              {copied ? (
                <><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Copied!</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg> Copy Link</>
              )}
            </button>
            <button
              onClick={() => window.open(reviewUrl, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open Review Page
            </button>
          </div>
          <p className="text-xs text-zinc-600">
            Scan the QR with your phone camera or tap &quot;Open Review Page&quot; to test the customer experience.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Onboarding Wizard ──────────────────────────────────────────────
   Single guided flow that replaces the old "register hardware, then
   business, then hunt for its ID to add reviews" 3-tab process: business
   details → QR code → review suggestions → the QR is generated immediately. */
type WizardStep = "details" | "code" | "reviews" | "success";

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "code", label: "QR Code" },
  { key: "reviews", label: "Reviews" },
];

const DETAIL_FIELDS: { f: string; label: string; required?: boolean }[] = [
  { f: "name", label: "Business Name", required: true },
  { f: "email", label: "Email Address", required: true },
  { f: "phone", label: "Phone Number" },
  { f: "address", label: "Address" },
  { f: "googleReviewUrl", label: "Google Review URL" },
];

function slugifyCode(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  return base || "BUSINESS";
}

function OnboardWizard({
  open, onClose, token, hardwareList, onRefresh, toast,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  hardwareList: Row[];
  onRefresh: () => Promise<void>;
  toast: (kind: Toast["kind"], msg: string) => void;
}) {
  const emptyDetails: Record<string, string> = { name: "", email: "", phone: "", address: "", googleReviewUrl: "" };
  const [step, setStep] = useState<WizardStep>("details");
  const [details, setDetails] = useState<Record<string, string>>(emptyDetails);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [detailTouched, setDetailTouched] = useState<Record<string, boolean>>({});
  // The code field is either what the admin typed, or — until they touch it —
  // a suggestion derived from the business name. Derived at render time
  // (not synced via an effect) so there's nothing to keep in sync.
  const [codeInput, setCodeInput] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [reviews, setReviews] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState<{ businessName: string; reviewUrl: string } | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const availableHardware = hardwareList.filter((h) => h.status === "available").slice(0, 6);

  const suggestedCode = (() => {
    if (!details.name.trim()) return "";
    const base = slugifyCode(details.name);
    const existing = new Set(hardwareList.map((h) => h.serial));
    let candidate = base;
    let n = 2;
    while (existing.has(candidate)) { candidate = `${base}-${n}`; n++; }
    return candidate;
  })();
  const code = codeTouched ? codeInput : suggestedCode;

  const setCode = (v: string) => { setCodeInput(v); setCodeTouched(true); };

  const resetAll = () => {
    setStep("details");
    setDetails(emptyDetails);
    setDetailErrors({});
    setDetailTouched({});
    setCodeInput("");
    setCodeTouched(false);
    setReviews([""]);
    setServerError("");
    setResult(null);
  };

  if (!open) return null;

  const detailFieldNames = DETAIL_FIELDS.map((d) => d.f);

  const validateDetailField = (f: string, values: Record<string, string>) => {
    const errs = validate([f], values);
    setDetailErrors((prev) => ({ ...prev, [f]: errs[f] || "" }));
  };

  const goToCode = () => {
    const errs = validate(detailFieldNames, details);
    setDetailErrors(errs);
    setDetailTouched(Object.fromEntries(detailFieldNames.map((f) => [f, true])));
    if (Object.values(errs).some(Boolean)) return;
    setServerError("");
    setStep("code");
  };

  const addReview = () => setReviews((r) => (r.length >= 5 ? r : [...r, ""]));
  const removeReview = (i: number) => setReviews((r) => r.filter((_, idx) => idx !== i));
  const updateReview = (i: number, v: string) => setReviews((r) => r.map((x, idx) => (idx === i ? v : x)));

  const finish = async () => {
    setSubmitting(true);
    setServerError("");
    try {
      const created = await api<Row>("/admin/business", {
        method: "POST",
        token,
        body: {
          name: details.name.trim(),
          email: details.email.trim(),
          phone: details.phone.trim() || undefined,
          address: details.address.trim() || undefined,
          googleReviewUrl: details.googleReviewUrl.trim() || undefined,
          serial: code.trim() || undefined,
        },
      });

      const texts = reviews.map((r) => r.trim()).filter(Boolean);
      let failedReviews = 0;
      for (const reviewText of texts) {
        try {
          await api("/admin/review-suggestions", { method: "POST", token, body: { businessId: created._id, reviewText } });
        } catch {
          failedReviews++;
        }
      }
      if (failedReviews > 0) {
        toast("error", `Business created, but ${failedReviews} review suggestion${failedReviews > 1 ? "s" : ""} failed to save — add ${failedReviews > 1 ? "them" : "it"} again from the Reviews tab`);
      }

      await onRefresh();
      setResult({
        businessName: created.name,
        reviewUrl: code.trim() ? `${baseUrl}/r/${encodeURIComponent(code.trim())}` : "",
      });
      setStep("success");
    } catch (e: any) {
      const msg: string = e.message || "Something went wrong. Please try again.";
      if (/email/i.test(msg)) {
        setStep("details");
        setDetailErrors((prev) => ({ ...prev, email: "This email is already registered to another business" }));
        setDetailTouched((prev) => ({ ...prev, email: true }));
      }
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.key === step);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onKeyDown={(e) => { if (e.key === "Escape" && !submitting) onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 id="wizard-title" className="text-sm font-semibold text-white">
              {step === "success" ? "Business Onboarded" : "Onboard New Business"}
            </h2>
            {step !== "success" && (
              <p className="text-xs text-zinc-500 mt-0.5">
                Step {stepIndex + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[stepIndex].label}
              </p>
            )}
          </div>
          <button
            onClick={() => !submitting && onClose()}
            aria-label="Close onboarding wizard"
            disabled={submitting}
            className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {step !== "success" && (
          <div className="flex gap-1.5 px-6 pt-4 shrink-0">
            {WIZARD_STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-emerald-500" : "bg-zinc-800"}`}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {serverError && step !== "success" && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              {DETAIL_FIELDS.map(({ f, label, required }, i) => (
                <div key={f} className="space-y-1.5">
                  <label htmlFor={`wiz-${f}`} className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {label}{required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    id={`wiz-${f}`}
                    autoFocus={i === 0}
                    type={f === "email" ? "email" : "text"}
                    value={details[f]}
                    onChange={(e) => {
                      const next = { ...details, [f]: e.target.value };
                      setDetails(next);
                      if (detailTouched[f]) validateDetailField(f, next);
                    }}
                    onBlur={() => { setDetailTouched((t) => ({ ...t, [f]: true })); validateDetailField(f, details); }}
                    aria-invalid={!!detailErrors[f]}
                    placeholder={f === "googleReviewUrl" ? "https://maps.google.com/..." : label}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                      detailErrors[f]
                        ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                        : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                    }`}
                  />
                  {detailErrors[f] && <p role="alert" className="text-xs text-red-400">{detailErrors[f]}</p>}
                </div>
              ))}
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                This code goes on the physical QR stand, table tent, or NFC tag for{" "}
                <span className="text-white font-medium">{details.name || "this business"}</span>.
              </p>
              <div className="space-y-1.5">
                <label htmlFor="wiz-code" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Hardware Serial / Code
                </label>
                <input
                  id="wiz-code"
                  autoFocus
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CAFE-DELHI"
                  className="w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15 font-mono"
                />
                <p className="text-xs text-zinc-600">
                  {codeTouched
                    ? "Doesn't need to exist yet — it's set up automatically when you finish."
                    : "Suggested from the business name — edit it if you already have a physical code."}
                </p>
              </div>
              {availableHardware.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Or use unassigned hardware already in stock</p>
                  <div className="flex flex-wrap gap-2">
                    {availableHardware.map((h) => (
                      <button
                        key={h._id}
                        type="button"
                        onClick={() => setCode(h.serial)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                          code === h.serial
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                        }`}
                      >
                        {h.serial} <span className="text-zinc-600">· {h.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "reviews" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Pre-written reviews shown to customers after they scan — optional, but they significantly increase conversion. You can add more later too.
              </p>
              {reviews.map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea
                    autoFocus={i === 0}
                    value={r}
                    onChange={(e) => updateReview(i, e.target.value)}
                    rows={2}
                    placeholder={`Suggestion ${i + 1}, e.g. "Great coffee and quick service!"`}
                    className="flex-1 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 focus:border-emerald-500/50 focus:ring-emerald-500/15 resize-none"
                  />
                  {reviews.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReview(i)}
                      aria-label={`Remove suggestion ${i + 1}`}
                      className="mt-1 rounded-lg p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {reviews.length < 5 && (
                <button
                  type="button"
                  onClick={addReview}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add another suggestion
                </button>
              )}
            </div>
          )}

          {step === "success" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-emerald-300">
                  <span className="font-semibold">{result.businessName}</span> is set up and ready to collect reviews.
                </p>
              </div>
              {result.reviewUrl ? (
                <QrCard reviewUrl={result.reviewUrl} businessName={result.businessName} toast={toast} badgeLabel="Ready" compact />
              ) : (
                <p className="text-sm text-zinc-400">
                  No QR code was linked yet — assign hardware to this business anytime from the Hardware tab.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
          {step === "details" && (
            <button
              onClick={goToCode}
              className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
            >
              Continue
            </button>
          )}
          {step === "code" && (
            <>
              <button
                onClick={() => setStep("details")}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep("reviews")}
                className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
              >
                Continue
              </button>
            </>
          )}
          {step === "reviews" && (
            <>
              <button
                onClick={() => setStep("code")}
                disabled={submitting}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={finish}
                disabled={submitting}
                className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? <><Spinner /> Creating…</> : "Finish & Generate QR"}
              </button>
            </>
          )}
          {step === "success" && (
            <>
              <button
                onClick={resetAll}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
              >
                Onboard Another
              </button>
              <button
                onClick={onClose}
                className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}