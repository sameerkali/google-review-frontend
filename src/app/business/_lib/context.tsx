"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Row, Toast, ToastFn } from "@/lib/types";

interface BusinessContextValue {
  token: string;
  authChecked: boolean;
  business: Row | null;
  loading: boolean;
  toasts: Toast[];
  toast: ToastFn;
  dismissToast: (id: number) => void;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [business, setBusiness] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
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
    localStorage.removeItem("business_token");
    tokenRef.current = "";
    setToken("");
    setBusiness(null);
    router.replace("/business/login");
  }, [router]);

  const refresh = useCallback(async (t?: string) => {
    const tok = t || tokenRef.current;
    if (!tok) return;
    setLoading(true);
    try {
      const me = await api<Row>("/business/me", { token: tok });
      setBusiness(me);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        toast("error", "Session expired — please sign in again");
        signOut();
        return;
      }
      toast("error", e instanceof Error ? e.message : "Failed to load your account");
    } finally {
      setLoading(false);
    }
  }, [toast, signOut]);

  useEffect(() => {
    const t = localStorage.getItem("business_token");
    if (t) {
      tokenRef.current = t;
      setToken(t);
      refresh(t);
    }
    setAuthChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: t } = await api<{ token: string }>("/business/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("business_token", t);
    tokenRef.current = t;
    setToken(t);
    toast("success", "Signed in successfully");
    await refresh(t);
    router.replace("/business/dashboard");
  }, [refresh, router, toast]);

  const value: BusinessContextValue = {
    token, authChecked, business, loading, toasts, toast, dismissToast, refresh, login, signOut,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}
