"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Row, Toast, ToastFn } from "@/lib/types";

interface AdminContextValue {
  token: string;
  authChecked: boolean;
  data: Record<string, Row | Row[] | undefined>;
  dataLoading: boolean;
  toasts: Toast[];
  toast: ToastFn;
  dismissToast: (id: number) => void;
  refresh: () => Promise<void>;
  create: (kind: string, body: Record<string, unknown>, successMsg?: (created: Row) => string) => Promise<Row | null>;
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
  const [token, setToken] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState<Record<string, Row | Row[] | undefined>>({});
  const [dataLoading, setDataLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);
  const toastId = useRef(0);
  const tokenRef = useRef("");

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
    tokenRef.current = "";
    setToken("");
    setData({});
    router.replace("/admin/login");
  }, [router]);

  const refresh = useCallback(async (t?: string) => {
    const tok = t || tokenRef.current;
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
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        toast("error", "Session expired — please sign in again");
        signOut();
        return;
      }
      toast("error", e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setDataLoading(false);
    }
  }, [toast, signOut]);

  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) {
      tokenRef.current = t;
      setToken(t);
      refresh(t);
    }
    setAuthChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token: t } = await api<{ token: string }>("/admin/login", {
      method: "POST",
      body: { username, password },
    });
    localStorage.setItem("admin_token", t);
    tokenRef.current = t;
    setToken(t);
    toast("success", "Signed in successfully");
    await refresh(t);
    router.replace("/admin/overview");
  }, [refresh, router, toast]);

  const create = useCallback(async (
    kind: string,
    body: Record<string, unknown>,
    successMsg?: (created: Row) => string
  ): Promise<Row | null> => {
    try {
      const created = await api<Row>("/admin/" + kind, { method: "POST", body, token: tokenRef.current });
      toast("success", successMsg ? successMsg(created) : "Created successfully");
      await refresh();
      return created;
    } catch (x) {
      if (x instanceof ApiError && x.status === 401) { signOut(); return null; }
      toast("error", x instanceof Error ? x.message : "Something went wrong");
      return null;
    }
  }, [toast, refresh, signOut]);

  const openWizard = useCallback(() => { setWizardKey((k) => k + 1); setWizardOpen(true); }, []);
  const closeWizard = useCallback(() => setWizardOpen(false), []);

  const value: AdminContextValue = {
    token, authChecked, data, dataLoading, toasts, toast, dismissToast,
    refresh, create, login, signOut, wizardOpen, wizardKey, openWizard, closeWizard,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
