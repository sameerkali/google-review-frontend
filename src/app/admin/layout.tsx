"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminProvider, useAdmin } from "./_lib/context";
import type { Row } from "@/lib/types";
import { ToastContainer } from "@/components/Toast";
import { OnboardWizard } from "./_components/OnboardWizard";
import { FullPageSpinner, Spinner } from "@/components/Loaders";
import { LogoutIcon, MenuIcon, RefreshIcon, ShieldIcon, TAB_ICONS } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV: { href: string; key: keyof typeof TAB_ICONS; label: string; hidden?: boolean }[] = [
  { href: "/admin/overview", key: "overview", label: "Overview" },
  { href: "/admin/businesses", key: "businesses", label: "Businesses" },
  { href: "/admin/plans", key: "plans", label: "Plans" },
  // Not a primary tab — hardware is a support detail of a business, not a
  // peer concern. Reachable via the "Hardware Stock" link on the Businesses
  // tab; kept here (hidden) so the page still gets the right header title
  // and sidebar highlight when visited directly.
  { href: "/admin/hardware", key: "hardware", label: "Hardware", hidden: true },
  { href: "/admin/reviews", key: "reviews", label: "Reviews" },
  { href: "/admin/analytics", key: "analytics", label: "Analytics" },
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
    <div className="min-h-screen bg-background flex">
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
      <OnboardWizard
        key={wizardKey}
        open={wizardOpen}
        onClose={closeWizard}
        token={token}
        hardwareList={(data.h as Row[]) || []}
        plans={(data.p as Row[]) || []}
        onRefresh={refresh}
        toast={toast}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 w-60 bg-surface border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center border border-brand/30">
              <ShieldIcon className="w-4 h-4 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">Admin</p>
              <p className="text-xs text-fg-tertiary">QR Review Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.filter((n) => !n.hidden).map(({ href, key, label }) => {
            const Icon = TAB_ICONS[key];
            const active = activeKey === key;
            return (
              <Link
                key={key}
                href={href}
                prefetch
                onClick={() => setSidebarOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  active
                    ? "bg-brand/15 text-brand border-brand/20"
                    : "border-transparent text-fg-tertiary hover:text-fg hover:bg-surface-inset"
                }`}
              >
                <span className={active ? "text-brand" : "text-fg-quaternary"}>
                  <Icon className="w-4 h-4" />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg-tertiary hover:text-danger hover:bg-danger/8 transition-all duration-150 cursor-pointer"
          >
            <LogoutIcon className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <header className="sticky top-0 z-10 bg-background/80 border-b border-border px-5 py-3 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-2 text-fg-tertiary hover:text-fg hover:bg-surface-inset transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-fg">{activeLabel}</h1>
              <p className="text-xs text-fg-quaternary hidden sm:block">QR Review Platform · Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dataLoading && <Spinner />}
            <button
              onClick={() => refresh()}
              disabled={dataLoading}
              className="flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-fg-tertiary hover:text-fg hover:border-fg-quaternary transition-all duration-150 cursor-pointer disabled:opacity-40"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
