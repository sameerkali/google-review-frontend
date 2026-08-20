"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "../_lib/types";
import { AlertIcon, CheckIcon, CloseIcon, CopyIcon, UploadIcon } from "../_lib/icons";
import { useEscapeKey } from "../_lib/useEscapeKey";
import { Spinner } from "./Loaders";

function buildExample(businesses: Row[]): string {
  const id = businesses[0]?._id || "665f1a2b3c4d5e6f7a8b9c0d";
  return JSON.stringify(
    {
      items: [
        { businessId: id, reviewText: "Great coffee and quick service!" },
        { businessId: id, reviewText: "Loved the friendly staff and cozy atmosphere." },
      ],
    },
    null,
    2
  );
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
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEscapeKey(onClose, open && !uploading);

  if (!open) return null;

  const example = buildExample(businesses);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => { setText(String(reader.result || "")); setError(""); };
    reader.onerror = () => setError("Could not read that file");
    reader.readAsText(file);
  };

  const copyExample = () => {
    navigator.clipboard
      .writeText(example)
      .then(() => { setCopied(true); toast("info", "Example JSON copied"); setTimeout(() => setCopied(false), 2500); })
      .catch(() => toast("error", "Could not copy to clipboard"));
  };

  const upload = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("That's not valid JSON — check for missing commas or quotes");
      return;
    }
    const items = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown })?.items;
    if (!Array.isArray(items) || !items.length) {
      setError('Expected an array, or an object with an "items" array');
      return;
    }
    const bad = items.findIndex((it) => !it || typeof it !== "object" || !it.businessId || !it.reviewText);
    if (bad !== -1) {
      setError(`Item ${bad + 1} is missing "businessId" or "reviewText"`);
      return;
    }

    setError("");
    setUploading(true);
    try {
      const res = await api<{ created: number; skipped: number }>("/admin/review-suggestions/bulk", {
        method: "POST",
        token,
        body: { items },
      });
      await onRefresh();
      if (res.skipped) {
        toast("info", `Uploaded ${res.created} comment${res.created !== 1 ? "s" : ""} — ${res.skipped} row${res.skipped !== 1 ? "s" : ""} skipped (bad businessId or missing text)`);
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
            Upload a JSON file, or paste JSON below, to add many review-suggestion comments at once.
            Each comment needs the target business&apos;s ID (copy it from the Businesses tab) and the
            comment text. You can still add comments one at a time from the form on this page — run this
            upload as many times as you like.
          </p>

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
            <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre">{example}</pre>
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
              placeholder={example}
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
            disabled={uploading || !text.trim()}
            className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            {uploading ? <><Spinner /> Uploading…</> : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
