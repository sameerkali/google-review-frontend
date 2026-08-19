"use client";

import type { Toast } from "../_lib/types";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "../_lib/icons";

export function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none max-w-[calc(100vw-2rem)]"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl pointer-events-auto transition-all duration-300 ${
            t.kind === "success"
              ? "bg-emerald-950 border border-emerald-500/30 text-emerald-300"
              : t.kind === "error"
              ? "bg-red-950 border border-red-500/30 text-red-300"
              : "bg-blue-950 border border-blue-500/30 text-blue-300"
          }`}
        >
          <span>
            {t.kind === "success" ? (
              <CheckIcon className="w-4 h-4" />
            ) : t.kind === "error" ? (
              <AlertIcon className="w-4 h-4" />
            ) : (
              <InfoIcon className="w-4 h-4" />
            )}
          </span>
          {t.msg}
          <button
            className="ml-2 cursor-pointer opacity-60 hover:opacity-100"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
