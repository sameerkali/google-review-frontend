"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "../_lib/types";
import { AlertIcon, CheckIcon, CloseIcon, CopyIcon, UploadIcon } from "../_lib/icons";
import { useEscapeKey } from "../_lib/useEscapeKey";
import { Spinner } from "./Loaders";

const EXAMPLE = JSON.stringify(
  [
    "Great coffee and quick service!",
    "Loved the friendly staff and cozy atmosphere.",
    "Staff went above and beyond to help us — highly recommend.",
  ],
  null,
  2
);

/* Accepts a plain array of comment strings (the documented format), but also
   tolerates {comments:[...]}, {items:[...]}, and objects with a reviewText
   field — so JSON exported from the old {businessId, reviewText} shape, or
   pasted from elsewhere, still works. The business itself always comes from
   the dropdown, never from the JSON, so admins never have to hand-copy an id. */
function extractComments(parsed: unknown): string[] | null {
  const obj = parsed as Record<string, unknown> | null;
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(obj?.comments)
    ? (obj!.comments as unknown[])
    : Array.isArray(obj?.items)
    ? (obj!.items as unknown[])
    : null;
  if (!arr) return null;

  const texts: string[] = [];
  for (const it of arr) {
    if (typeof it === "string") { texts.push(it); continue; }
    if (it && typeof it === "object" && typeof (it as Record<string, unknown>).reviewText === "string") {
      texts.push((it as { reviewText: string }).reviewText);
      continue;
    }
    return null;
  }
  return texts;
}

/* Bulk-imports review suggestions ("comments") from a JSON file or pasted JSON,
   instead of adding one at a time through the inline form. */
export function BulkReviewUploadModal({
  open, businesses, token, onClose, onRefresh, toast,
}: {
  open: boolean;
  businesses: Row[];
  token: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  toast: ToastFn;
}) {
  const [businessId, setBusinessId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEscapeKey(onClose, open && !uploading);

  if (!open) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => { setText(String(reader.result || "")); setError(""); };
    reader.onerror = () => setError("Could not read that file");
    reader.readAsText(file);
  };

  const copyExample = () => {
    navigator.clipboard
      .writeText(EXAMPLE)
      .then(() => { setCopied(true); toast("info", "Example JSON copied"); setTimeout(() => setCopied(false), 2500); })
      .catch(() => toast("error", "Could not copy to clipboard"));
  };

  const upload = async () => {
    if (!businessId) {
      setError("Select which business these comments belong to first");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("That's not valid JSON — check for missing commas or quotes");
      return;
    }
    const comments = extractComments(parsed);
    if (!comments) {
      setError('Expected a JSON array of comment strings, e.g. ["Great service!", "Loved it"]');
      return;
    }
    const texts = comments.map((t) => t.trim()).filter(Boolean);
    if (!texts.length) {
      setError("No comment text found in that JSON");
      return;
    }

    setError("");
    setUploading(true);
    try {
      const res = await api<{ created: number; skipped: number }>("/admin/review-suggestions/bulk", {
        method: "POST",
        token,
        body: { items: texts.map((reviewText) => ({ businessId, reviewText })) },
      });
      await onRefresh();
      if (res.skipped) {
        toast("info", `Uploaded ${res.created} comment${res.created !== 1 ? "s" : ""} — ${res.skipped} row${res.skipped !== 1 ? "s" : ""} skipped`);
      } else {
        toast("success", `Uploaded ${res.created} comment${res.created !== 1 ? "s" : ""}`);
      }
      setText("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="bulk-upload-title" className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 id="bulk-upload-title" className="text-sm font-semibold text-white">Bulk Upload Review Comments</h2>
          <button onClick={onClose} disabled={uploading} aria-label="Close" className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Pick the business below, then upload or paste just the comment text — no business ID
            needed, it&apos;s attached automatically. You can still add comments one at a time from
            the form on this page, and you can run this upload as many times as you like.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="bulk-business" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Business <span className="text-red-400">*</span>
            </label>
            <select
              id="bulk-business"
              value={businessId}
              onChange={(e) => { setBusinessId(e.target.value); if (error) setError(""); }}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 outline-none transition-all duration-200 focus:ring-1 ${
                error && !businessId ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              }`}
            >
              <option value="">Select a business…</option>
              {businesses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            {!businesses.length && (
              <p className="text-xs text-zinc-500">No businesses yet — onboard one first from the Overview tab.</p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Example JSON</span>
              <button
                onClick={copyExample}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {copied ? <><CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><CopyIcon className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre">{EXAMPLE}</pre>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="bulk-json" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Paste JSON</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <UploadIcon className="w-3.5 h-3.5" />
                Upload .json file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              />
            </div>
            <textarea
              id="bulk-json"
              value={text}
              onChange={(e) => { setText(e.target.value); if (error) setError(""); }}
              placeholder={EXAMPLE}
              rows={8}
              spellCheck={false}
              className={`w-full rounded-xl border px-4 py-2.5 text-xs font-mono text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
                error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
              }`}
            />
            {error && (
              <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
                <AlertIcon className="w-3 h-3 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={upload}
            disabled={uploading || !text.trim() || !businessId}
            className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            {uploading ? <><Spinner /> Uploading…</> : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
