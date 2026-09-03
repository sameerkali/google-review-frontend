"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BusinessProvider, useBusiness } from "./_lib/context";
import { api } from "@/lib/api";
import type { Row } from "@/lib/types";
import { ToastContainer } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FullPageSpinner, Skeleton } from "@/components/Loaders";
import { LogoutIcon, QrIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconButton } from "@/components/ui/Button";

const NAV = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/menu", label: "Menu" },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <BusinessShell>{children}</BusinessShell>
    </BusinessProvider>
  );
}

function BusinessShell({ children }: { children: React.ReactNode }) {
  const { token, authChecked, toasts, dismissToast, signOut } = useBusiness();
  const router = useRouter();
  const pathname = usePathname();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const { data: business, isPending: businessLoading } = useQuery({
    queryKey: ["business", "me"],
    queryFn: () => api<Row>("/business/me", { token }),
    enabled: authChecked && !!token,
  });

  const isLoginRoute = pathname === "/business/login";
  const isIndexRoute = pathname === "/business";

  useEffect(() => {
    if (!authChecked) return;
    // Same replace()-not-push() pattern as the admin panel - keeps the login
    // page out of history so Back can't land a signed-in owner back on it.
    if (!token && !isLoginRoute) { router.replace("/business/login"); return; }
    if (token && (isLoginRoute || isIndexRoute)) { router.replace("/business/dashboard"); return; }
  }, [authChecked, token, isLoginRoute, isIndexRoute, router]);

  const redirecting = !authChecked || (!token && !isLoginRoute) || (token && (isLoginRoute || isIndexRoute));
  if (redirecting) return <FullPageSpinner />;
  if (isLoginRoute) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        message="You'll need your email and password to sign back in."
        confirmLabel="Sign out"
        onConfirm={() => { signOut(); setConfirmSignOut(false); }}
        onCancel={() => setConfirmSignOut(false)}
      />
      <header className="sticky top-0 z-10 bg-background/80 border-b border-border px-5 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center border border-brand/25 shrink-0">
            <QrIcon className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0">
            {businessLoading ? (
              <>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-16" />
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-fg truncate">{business?.name || "Business Portal"}</p>
                <p className="text-xs text-fg-tertiary">{(business?.planId as { name?: string } | undefined)?.name || "No plan"}</p>
              </>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                pathname.startsWith(href)
                  ? "bg-brand/15 text-brand border-brand/20"
                  : "border-transparent text-fg-tertiary hover:text-fg hover:bg-surface-inset"
              }`}
            >
              {label}
            </Link>
          ))}
          <ThemeToggle className="ml-1" />
          <IconButton onClick={() => setConfirmSignOut(true)} aria-label="Sign out" title="Sign out" tone="danger">
            <LogoutIcon className="w-4 h-4" />
          </IconButton>
        </nav>
      </header>
      <main className="p-5 sm:p-6 lg:p-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
