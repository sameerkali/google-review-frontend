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
  email: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email address" : null,
  phone: (v) => v && !/^\+?[\d\s\-().]{7,}$/.test(v) ? "Invalid phone number" : null,
  googleReviewUrl: (v) => v && !v.startsWith("http") ? "Must be a valid URL starting with http" : null,
  price: (v) => v && isNaN(Number(v)) ? "Must be a number" : null,
  name: (v) => !v?.trim() ? "Name is required" : null,
  serial: (v) => !v?.trim() ? "Serial / Code is required" : null,
  code: (v) => !v?.trim() ? "QR Code is required" : null,
  billingType: (v) => !["monthly", "annually", "one-time"].includes(v) ? 'Use "monthly", "annually", or "one-time"' : null,
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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
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

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) { setToken(t); refresh(t); }
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

  const create = async (kind: string, body: Record<string, any>): Promise<boolean> => {
    try {
      await api("/admin/" + kind, { method: "POST", body, token });
      toast("success", "Created successfully");
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
              <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
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
          {tab === "overview" && <OverviewTab ov={data.ov} loading={dataLoading} />}
          {tab === "businesses" && (
            <ListTab
              rows={data.b || []}
              cols={["name", "email", "phone", "status"]}
              onAdd={(body) => create("business", { ...body, serial: body.code, code: undefined })}
              addFields={["name", "email", "phone", "address", "googleReviewUrl", "code"]}
              loading={dataLoading}
              toast={toast}
            />
          )}
          {tab === "plans" && (
            <ListTab
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
function OverviewTab({ ov, loading }: { ov?: Row; loading: boolean }) {
  const cards = [
    { label: "Total Businesses", value: ov?.businesses },
    { label: "Active Businesses", value: ov?.activeBusinesses },
    { label: "Hardware Units", value: ov?.hardware },
    { label: "Total Events", value: ov?.events },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Platform Overview</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Real-time summary of your QR review platform</p>
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
  billingType: "Billing Type (monthly / annually / one-time)",
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
  rows, cols, onAdd, addFields, loading, toast,
}: {
  rows: Row[];
  cols: string[];
  onAdd: (b: any) => Promise<boolean>;
  addFields: string[];
  loading: boolean;
  toast: (kind: Toast["kind"], msg: string) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(addFields, form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast("error", "Please fix the form errors before submitting");
      return;
    }
    setSaving(true);
    const ok = await onAdd(form);
    setSaving(false);
    if (ok) { setForm({}); setShowForm(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white capitalize">{cols[0]} Management</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{rows.length} record{rows.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setErrors({}); }}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
        >
          <svg className={`w-4 h-4 transition-transform duration-200 ${showForm ? "rotate-45" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {showForm ? "Cancel" : "Add New"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4" noValidate>
          <h3 className="text-sm font-semibold text-white">New Record</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addFields.map((f) => (
              <div key={f} className="space-y-1.5">
                <label htmlFor={`field-${f}`} className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {FIELD_LABELS[f] || f}
                  {REQUIRED_FIELDS[f] && <span className="text-red-400 ml-1">*</span>}
                </label>
                <input
                  id={`field-${f}`}
                  type={f === "email" ? "email" : f === "price" ? "number" : "text"}
                  placeholder={FIELD_LABELS[f] || f}
                  value={form[f] || ""}
                  onChange={(e) => {
                    setForm({ ...form, [f]: e.target.value });
                    if (errors[f]) setErrors({ ...errors, [f]: "" });
                  }}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                    errors[f]
                      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
                  }`}
                />
                {errors[f] && (
                  <p className="flex items-center gap-1 text-xs text-red-400">
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
              onClick={() => { setShowForm(false); setErrors({}); setForm({}); }}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <DataTable rows={rows} cols={cols} loading={loading} />
    </div>
  );
}

/* ─── Data Table ─────────────────────────────────────────── */
function DataTable({ rows, cols, loading }: { rows: Row[]; cols: string[]; loading: boolean }) {
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
                {c.replace(/([A-Z])/g, " $1").trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-900/60 transition-colors duration-100">
              {cols.map((c) => (
                <td key={c} className="px-4 py-3 text-zinc-300 whitespace-nowrap max-w-xs truncate">
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
                      {String(row[c] ?? "—")}
                    </span>
                  ) : (
                    String(row[c] ?? "—")
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
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Store the pending URL in a ref so the effect always reads the latest value
  const pendingUrl = useRef("");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  // Draw the QR AFTER React has committed the canvas to the DOM
  useEffect(() => {
    if (!reviewUrl || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, reviewUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch(() => {
      toast("error", "Failed to render QR code");
    });
  }, [reviewUrl]);

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
      pendingUrl.current = url;
      // Setting state triggers re-render → canvas appears → useEffect draws the QR
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

  const copyLink = async () => {
    await navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    toast("info", "Link copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
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
      {reviewUrl && !verifyErr && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">QR Code for <span className="text-emerald-400">{bizName}</span></h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verified
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Canvas renders the QR code */}
            <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0">
              <canvas ref={canvasRef} className="block" />
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Review URL</p>
                <code className="block text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 break-all">
                  {reviewUrl}
                </code>
              </div>
              <div className="flex flex-wrap gap-2">
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
                Scan the QR with your phone camera or tap "Open Review Page" to test the customer experience.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}