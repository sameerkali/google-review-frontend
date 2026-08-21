"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BusinessProvider, useBusiness } from "./_lib/context";
import { ToastContainer } from "../admin/_components/Toast";
import { FullPageSpinner } from "../admin/_components/Loaders";
import { LogoutIcon, QrIcon } from "../admin/_lib/icons";

const NAV = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/reviews", label: "Reviews" },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <BusinessShell>{children}</BusinessShell>
    </BusinessProvider>
  );
}

function BusinessShell({ children }: { children: React.ReactNode }) {
  const { token, authChecked, business, toasts, dismissToast, signOut } = useBusiness();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginRoute = pathname === "/business/login";
  const isIndexRoute = pathname === "/business";

  useEffect(() => {
    if (!authChecked) return;
    // Same replace()-not-push() pattern as the admin panel — keeps the login
    // page out of history so Back can't land a signed-in owner back on it.
    if (!token && !isLoginRoute) { router.replace("/business/login"); return; }
    if (token && (isLoginRoute || isIndexRoute)) { router.replace("/business/dashboard"); return; }
  }, [authChecked, token, isLoginRoute, isIndexRoute, router]);

  const redirecting = !authChecked || (!token && !isLoginRoute) || (token && (isLoginRoute || isIndexRoute));
  if (redirecting) return <FullPageSpinner />;
  if (isLoginRoute) return <>{children}</>;

  return (
    <div className="min-h-screen bg-zinc-950">
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
      <header className="sticky top-0 z-10 bg-zinc-950/80 border-b border-zinc-800 px-5 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <QrIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{business?.name || "Business Portal"}</p>
            <p className="text-xs text-zinc-500">{(business?.planId as { name?: string } | undefined)?.name || "No plan"}</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                pathname.startsWith(href)
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  : "border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={() => signOut()}
            aria-label="Sign out"
            title="Sign out"
            className="ml-1 rounded-lg p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 cursor-pointer"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </nav>
      </header>
      <main className="p-5 sm:p-6 lg:p-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
