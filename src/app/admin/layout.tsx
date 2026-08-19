"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminProvider, useAdmin } from "./_lib/context";
import type { Row } from "./_lib/types";
import { ToastContainer } from "./_components/Toast";
import { OnboardWizard } from "./_components/OnboardWizard";
import { FullPageSpinner, Spinner } from "./_components/Loaders";
import { LogoutIcon, MenuIcon, RefreshIcon, ShieldIcon, TAB_ICONS } from "./_lib/icons";

const NAV: { href: string; key: keyof typeof TAB_ICONS; label: string }[] = [
  { href: "/admin/overview", key: "overview", label: "Overview" },
  { href: "/admin/businesses", key: "businesses", label: "Businesses" },
  { href: "/admin/plans", key: "plans", label: "Plans" },
  { href: "/admin/hardware", key: "hardware", label: "Hardware" },
  { href: "/admin/reviews", key: "reviews", label: "Reviews" },
  { href: "/admin/analytics", key: "analytics", label: "Analytics" },
  { href: "/admin/simulator", key: "simulator", label: "QR Simulator" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { token, authChecked, dataLoading, refresh, signOut, toasts, dismissToast, wizardOpen, wizardKey, closeWizard, data, toast } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginRoute = pathname === "/admin/login";
  const isIndexRoute = pathname === "/admin";

  useEffect(() => {
    if (!authChecked) return;
    // Redirects use replace() (not push()) so the page being left behind
    // never lingers in history — this is what stops the browser Back button
    // from ever landing an authenticated admin back on the login screen.
    if (!token && !isLoginRoute) { router.replace("/admin/login"); return; }
    if (token && (isLoginRoute || isIndexRoute)) { router.replace("/admin/overview"); return; }
  }, [authChecked, token, isLoginRoute, isIndexRoute, router]);

  const redirecting = !authChecked || (!token && !isLoginRoute) || (token && (isLoginRoute || isIndexRoute));
  if (redirecting) return <FullPageSpinner />;
  if (isLoginRoute) return <>{children}</>;

  const activeKey = NAV.find((n) => pathname.startsWith(n.href))?.key || "overview";
  const activeLabel = NAV.find((n) => n.key === activeKey)?.label || "Admin";

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
      <OnboardWizard
        key={wizardKey}
        open={wizardOpen}
        onClose={closeWizard}
        token={token}
        hardwareList={(data.h as Row[]) || []}
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
              <ShieldIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-xs text-zinc-500">QR Review Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, key, label }) => {
            const Icon = TAB_ICONS[key];
            const active = activeKey === key;
            return (
              <Link
                key={key}
                href={href}
                prefetch
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer text-left ${
                  active
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                <span className={active ? "text-emerald-400" : "text-zinc-600"}>
                  <Icon className="w-4 h-4" />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-zinc-800">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 cursor-pointer"
          >
            <LogoutIcon className="w-4 h-4" />
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
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white">{activeLabel}</h1>
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
              <RefreshIcon className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
