"use client";

/* Shared modal shell - backdrop, panel, click-outside-to-close. Each modal
   composes its own header/body/footer inside `children` since content shape
   varies (a confirm dialog vs. a multi-step wizard vs. an edit form). */
const MAX_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
} as const;

export function Modal({
  open,
  onClose,
  maxWidth = "md",
  labelledBy,
  role = "dialog",
  children,
}: {
  open: boolean;
  /** Called on backdrop click; omit to disable click-outside-to-close (e.g. while busy). */
  onClose?: () => void;
  maxWidth?: keyof typeof MAX_WIDTH;
  labelledBy?: string;
  role?: "dialog" | "alertdialog";
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`w-full ${MAX_WIDTH[maxWidth]} rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in max-h-[calc(100dvh-2rem)] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-border">
      <div className="min-w-0">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-lg p-1.5 text-fg-tertiary hover:text-fg hover:bg-surface-inset transition-colors duration-150 cursor-pointer"
        >
          <CloseGlyph />
        </button>
      )}
    </div>
  );
}

export function ModalBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-5 space-y-4 ${className}`}>{children}</div>;
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">{children}</div>;
}

/* Local, not exported - avoids importing the icon barrel into the primitive layer. */
function CloseGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
