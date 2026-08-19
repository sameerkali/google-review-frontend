export function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-6 h-6 border-2" : "w-4 h-4 border-[1.5px]";
  return <div className={`${cls} rounded-full border-emerald-400 border-t-transparent animate-spin`} />;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-800 ${className}`} />;
}

export function FullPageSpinner() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Spinner size="md" />
    </main>
  );
}
