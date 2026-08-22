"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon, LockIcon } from "@/components/icons";

const FIELD_BASE =
  "w-full rounded-xl border bg-surface-inset px-4 py-2.5 text-sm text-fg placeholder-placeholder outline-none transition-colors duration-150 focus:ring-1";

function fieldTone(error?: boolean) {
  return error
    ? "border-danger/60 focus:border-danger focus:ring-danger/20"
    : "border-border-strong focus:border-brand/60 focus:ring-brand/15";
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-fg-tertiary uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-danger">{children}</p>;
}

export function Input({
  error,
  className = "",
  ...rest
}: { error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_BASE} ${fieldTone(error)} ${className}`} {...rest} />;
}

export function Textarea({
  error,
  className = "",
  ...rest
}: { error?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_BASE} resize-none ${fieldTone(error)} ${className}`} {...rest} />;
}

export function Select({
  error,
  className = "",
  children,
  ...rest
}: { error?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${FIELD_BASE} ${fieldTone(error)} ${className}`} {...rest}>
      {children}
    </select>
  );
}

/** Password field with a lock icon and a show/hide toggle, matching the
    icon-left input recipe already used across the login forms. */
export function PasswordInput({
  error,
  className = "",
  ...rest
}: { error?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <LockIcon className="w-4 h-4 text-fg-quaternary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <Input
        type={visible ? "text" : "password"}
        error={error}
        className={`pl-10 pr-10 ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-fg-tertiary transition-colors cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {visible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}

/** Label + control + error, for the common case of one field in a form grid. */
export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
