"use client";

import { useState } from "react";
import { useBusiness } from "../_lib/context";
import { AlertIcon, LockIcon, QrIcon, UserIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Input, Label, ErrorText } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function BusinessLoginPage() {
  const { login } = useBusiness();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [formErr, setFormErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eErr = !email.trim() ? "Email is required" : "";
    const pErr = !password.trim() ? "Password is required" : "";
    setEmailErr(eErr);
    setPasswordErr(pErr);
    setFormErr("");
    if (eErr || pErr) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (x) {
      setFormErr(x instanceof Error ? x.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background relative overflow-hidden">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />
      </div>
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm mx-4 rounded-2xl border border-border bg-surface/80 p-8 space-y-5 shadow-2xl animate-rise-in"
        noValidate
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center border border-brand/25">
            <QrIcon className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-fg">Business Portal</h1>
            <p className="text-xs text-fg-tertiary">QR Review Platform</p>
          </div>
        </div>

        {formErr && (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-danger rounded-lg border border-danger/20 bg-danger/10 px-3 py-2">
            <AlertIcon className="w-3.5 h-3.5 shrink-0" />
            {formErr}
          </p>
        )}

        <div>
          <Label htmlFor="biz-login-email">Email</Label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-fg-quaternary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="biz-login-email"
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="you@yourbusiness.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailErr(""); setFormErr(""); }}
              aria-invalid={!!emailErr}
              error={!!emailErr}
              className="pl-10"
            />
          </div>
          <ErrorText>{emailErr}</ErrorText>
        </div>

        <div>
          <Label htmlFor="biz-login-password">Password</Label>
          <div className="relative">
            <LockIcon className="w-4 h-4 text-fg-quaternary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="biz-login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordErr(""); setFormErr(""); }}
              aria-invalid={!!passwordErr}
              error={!!passwordErr}
              className="pl-10"
            />
          </div>
          <ErrorText>{passwordErr}</ErrorText>
        </div>

        <Button type="submit" variant="primary" className="w-full" loading={loading} loadingText="Signing in…">
          Sign in
        </Button>
        <p className="text-center text-xs text-fg-quaternary">Don&apos;t have an account? Contact the platform admin who set up your QR code.</p>
      </form>
    </main>
  );
}
