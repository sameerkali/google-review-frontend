"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Toast, ToastFn } from "@/lib/types";
import { registerAdminSignOut, registerAdminToast } from "@/lib/authBridge";

interface AdminContextValue {
  token: string;
  authChecked: boolean;
  toasts: Toast[];
  toast: ToastFn;
  dismissToast: (id: number) => void;
  login: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  wizardOpen: boolean;
  wizardKey: number;
  openWizard: () => void;
  closeWizard: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);
  const toastId = useRef(0);

  const toast = useCallback<ToastFn>((kind, msg) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, kind, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("admin_token");
    setToken("");
    queryClient.clear();
    router.replace("/admin/login");
  }, [router, queryClient]);

  // The QueryClient's global 401 handler lives outside React (created above
  // this provider); it reaches the real signOut/toast through this bridge.
  useEffect(() => {
    registerAdminSignOut(signOut);
    registerAdminToast(toast);
  }, [signOut, toast]);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of persisted token on mount
    if (t) setToken(t);
    setAuthChecked(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token: t } = await api<{ token: string }>("/admin/login", {
      method: "POST",
      body: { username, password },
    });
    localStorage.setItem("admin_token", t);
    queryClient.clear(); // never show a stale/previous admin's cached data
    setToken(t);
    toast("success", "Signed in successfully");
    router.replace("/admin/overview");
  }, [router, toast, queryClient]);

  const openWizard = useCallback(() => { setWizardKey((k) => k + 1); setWizardOpen(true); }, []);
  const closeWizard = useCallback(() => setWizardOpen(false), []);

  const value: AdminContextValue = {
    token, authChecked, toasts, toast, dismissToast,
    login, signOut, wizardOpen, wizardKey, openWizard, closeWizard,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
