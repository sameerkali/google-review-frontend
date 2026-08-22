"use client";

import { Spinner } from "@/components/Loaders";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand hover:bg-brand-hover text-white font-semibold",
  secondary: "border border-border-strong text-fg-tertiary hover:text-fg hover:border-fg-quaternary font-medium",
  destructive: "bg-danger hover:bg-danger-hover text-white font-semibold",
  ghost: "text-fg-tertiary hover:text-fg hover:bg-surface-inset font-medium",
};

const SIZE: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  loadingText,
  className = "",
  children,
  disabled,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner /> {loadingText ?? "Working…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

type Tone = "default" | "brand" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  default: "text-fg-tertiary hover:text-fg hover:bg-surface-inset",
  brand: "text-fg-tertiary hover:text-brand hover:bg-brand/10",
  success: "text-fg-tertiary hover:text-success hover:bg-success/10",
  warning: "text-fg-tertiary hover:text-warning hover:bg-warning/10",
  danger: "text-fg-tertiary hover:text-danger hover:bg-danger/10",
  info: "text-fg-tertiary hover:text-info hover:bg-info/10",
};

export function IconButton({
  tone = "default",
  className = "",
  children,
  ...rest
}: {
  tone?: Tone;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-lg p-2 transition-all duration-150 cursor-pointer active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-50 ${TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
