type Tone = "default" | "brand" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  default: "bg-surface-inset text-fg-tertiary border-border-strong",
  brand: "bg-brand/10 text-brand border-brand/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-info/10 text-info border-info/20",
};

const DOT: Record<Tone, string> = {
  default: "bg-fg-quaternary",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function Badge({
  tone = "default",
  dot = false,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${TONE[tone]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT[tone]}`} />}
      {children}
    </span>
  );
}
