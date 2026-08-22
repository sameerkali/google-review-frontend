"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { AlertIcon, CheckIcon, CopyIcon, UploadIcon } from "@/components/icons";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Input";

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
    <Modal open={open} onClose={uploading ? undefined : onClose} maxWidth="2xl" labelledBy="bulk-upload-title">
      <div className="max-h-[85vh] flex flex-col">
        <ModalHeader onClose={uploading ? undefined : onClose}>
          <h2 id="bulk-upload-title" className="text-sm font-semibold text-fg">Bulk Upload Review Comments</h2>
        </ModalHeader>

        <div className="overflow-y-auto">
          <ModalBody>
            <p className="text-xs text-fg-tertiary leading-relaxed">
              Pick the business below, then upload or paste just the comment text — no business ID
              needed, it&apos;s attached automatically. You can still add comments one at a time from
              the form on this page, and you can run this upload as many times as you like.
            </p>

            <Field label="Business *" htmlFor="bulk-business" error={error && !businessId ? error : undefined}>
              <Select
                id="bulk-business"
                value={businessId}
                onChange={(e) => { setBusinessId(e.target.value); if (error) setError(""); }}
                error={!!(error && !businessId)}
              >
                <option value="">Select a business…</option>
                {businesses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </Select>
              {!businesses.length && (
                <p className="mt-1.5 text-xs text-fg-tertiary">No businesses yet — onboard one first from the Overview tab.</p>
              )}
            </Field>

            <div className="rounded-xl border border-border-strong bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Example JSON</span>
                <button
                  onClick={copyExample}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-fg-tertiary hover:text-fg hover:bg-surface-inset transition-colors cursor-pointer"
                >
                  {copied ? <><CheckIcon className="w-3.5 h-3.5 text-success" /> Copied</> : <><CopyIcon className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <pre className="text-xs text-brand overflow-x-auto whitespace-pre">{EXAMPLE}</pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="bulk-json" className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Paste JSON</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-border-strong px-2.5 py-1 text-xs text-fg-tertiary hover:text-fg hover:border-fg-quaternary transition-colors cursor-pointer"
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
              <Textarea
                id="bulk-json"
                value={text}
                onChange={(e) => { setText(e.target.value); if (error) setError(""); }}
                placeholder={EXAMPLE}
                rows={8}
                spellCheck={false}
                error={!!error}
                className="text-xs font-mono"
              />
              {error && (
                <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                  <AlertIcon className="w-3 h-3 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          </ModalBody>
        </div>

        <ModalFooter>
          <Button onClick={upload} disabled={!text.trim() || !businessId} loading={uploading} loadingText="Uploading…" variant="primary" className="ml-auto">
            Upload
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
