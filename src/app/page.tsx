import { QrIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-6 text-center relative">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="space-y-4 max-w-sm animate-rise-in">
        <div className="w-16 h-16 rounded-2xl bg-brand/15 border border-brand/25 flex items-center justify-center mx-auto">
          <QrIcon className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-2xl font-semibold text-fg">QR Review Platform</h1>
        <p className="text-fg-tertiary text-sm leading-relaxed">
          Scan a QR code at a participating business to leave a review.
        </p>
        <a
          href="/admin"
          className="inline-block mt-4 rounded-xl bg-surface border border-border-strong px-5 py-2.5 text-sm text-fg-secondary hover:bg-surface-inset transition-colors"
        >
          Admin Dashboard →
        </a>
      </div>
    </div>
  );
}
