"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Toast, ToastFn } from "@/lib/types";
import { registerBusinessSignOut, registerBusinessToast } from "@/lib/authBridge";

interface BusinessContextValue {
  token: string;
  authChecked: boolean;
  toasts: Toast[];
  toast: ToastFn;
  dismissToast: (id: number) => void;
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
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
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
    localStorage.removeItem("business_token");
    setToken("");
    queryClient.clear();
    router.replace("/business/login");
  }, [router, queryClient]);

  // The QueryClient's global 401 handler lives outside React (created above
  // this provider); it reaches the real signOut/toast through this bridge.
  useEffect(() => {
    registerBusinessSignOut(signOut);
    registerBusinessToast(toast);
  }, [signOut, toast]);

  useEffect(() => {
    const t = localStorage.getItem("business_token");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of persisted token on mount
    if (t) setToken(t);
    setAuthChecked(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: t } = await api<{ token: string }>("/business/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("business_token", t);
    queryClient.clear(); // never show a stale/previous account's cached data
    setToken(t);
    toast("success", "Signed in successfully");
    router.replace("/business/dashboard");
  }, [router, toast, queryClient]);

  const value: BusinessContextValue = {
    token, authChecked, toasts, toast, dismissToast, login, signOut,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}
