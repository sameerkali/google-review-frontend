"use client";

import { useState } from "react";
import { useAdmin } from "../_lib/context";
import { AlertIcon, LockIcon, ShieldIcon, UserIcon } from "../_lib/icons";
import { Spinner } from "../_components/Loaders";

export default function LoginPage() {
  const { login } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameErr, setUsernameErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [formErr, setFormErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uErr = !username.trim() ? "Username is required" : "";
    const pErr = !password.trim() ? "Password is required" : "";
    setUsernameErr(uErr);
    setPasswordErr(pErr);
    setFormErr("");
    if (uErr || pErr) return;

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (x) {
      setFormErr(x instanceof Error ? x.message : "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm mx-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 space-y-5 shadow-2xl"
        noValidate
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <ShieldIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">Admin Portal</h1>
            <p className="text-xs text-zinc-500">QR Review Platform</p>
          </div>
        </div>

        {formErr && (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-red-400 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
            <AlertIcon className="w-3.5 h-3.5 shrink-0" />
            {formErr}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="admin-username" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Username
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="admin"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUsernameErr(""); setFormErr(""); }}
              aria-invalid={!!usernameErr}
              className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                usernameErr
                  ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                  : "border-zinc-700 focus:border-emerald-500/60 focus:ring-emerald-500/20"
              }`}
            />
          </div>
          {usernameErr && <p role="alert" className="text-xs text-red-400">{usernameErr}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-password" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <LockIcon className="w-4 h-4 text-zinc-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordErr(""); setFormErr(""); }}
              aria-invalid={!!passwordErr}
              className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                passwordErr
                  ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                  : "border-zinc-700 focus:border-emerald-500/60 focus:ring-emerald-500/20"
              }`}
            />
          </div>
          {passwordErr && <p role="alert" className="text-xs text-red-400">{passwordErr}</p>}
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
